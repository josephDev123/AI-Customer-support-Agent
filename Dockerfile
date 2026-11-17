# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma7.config.ts tsconfig.json tsconfig.build.json nest-cli.json langgraph.json ./
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Keep the Prisma CLI in the runtime image for the one-shot migration service.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=build /app/src ./src
COPY --from=build /app/langgraph.json /app/tsconfig.json ./

RUN mkdir -p /app/.langgraph_api \
    && touch /app/.gitignore \
    && chown node:node /app/.langgraph_api /app/.gitignore

USER node
EXPOSE 5000 2024

CMD ["node", "dist/src/main.js"]
