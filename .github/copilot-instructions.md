# Copilot instructions for this repository

## Project snapshot

This repo is a NestJS API that orchestrates a customer-support workflow with LangGraph. The app routes user questions into specialist nodes, can escalate to a human via a persisted PostgreSQL ticket, and exposes LangGraph-compatible endpoints for streaming runs.

Primary entry points:

- `src/main.ts` – NestJS bootstrap
- `src/app.module.ts` – application wiring and config validation
- `src/ai/graph.ts` – assembled LangGraph workflow (`supportGraph`)
- `src/features/customer-support/` – API, DTOs, repository, and service for human escalation tickets
- `src/features/langgraph-server/` – LangGraph thread/run HTTP endpoints
- `prisma/schema.prisma` and `prisma/models/*.prisma` – Prisma schema and database model definitions

## Build, test, and lint

Use the npm scripts defined in `package.json`:

```bash
npm install
npm run build
npm run lint
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

Run a single Jest spec when working on a focused change:

```bash
npx jest --runTestsByPath src/features/langgraph-server/langgraph-server.controller.spec.ts --runInBand
```

If you prefer the package script form:

```bash
npm test -- --runTestsByPath src/features/langgraph-server/langgraph-server.controller.spec.ts --runInBand
```

Formatting is handled by Prettier for `src/**/*.ts` and `test/**/*.ts`:

```bash
npm run format
```

## Local setup and runtime expectations

The README is the source of truth for app configuration:

- Node.js 24 is expected.
- PostgreSQL is required.
- A `.env` file is required at the repo root (copy from `.env.example`).
- Required env vars include `DATABASE_URL`, `GOOGLE_API_KEY`, `LANGSMITH_API_KEY`, `PINECONE_API_KEY`, and `PINECONE_HOST`.
- `HUMAN_ESCALATION_SERVICE_URL` is used by the LangGraph escalation node; it defaults to the local API URL in Docker.

Common local commands:

```bash
cp .env.example .env
prisma migrate deploy
prisma generate
npm run start
npm run start:dev
```

LangGraph tooling is exposed as the `agent` graph and is started via:

```bash
npx @langchain/langgraph-cli dev
```

Production stack:

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

## High-level architecture

The big picture is a layered application:

1. NestJS HTTP layer receives API requests and exposes LangGraph thread/run endpoints.
2. `supportGraph` in `src/ai/graph.ts` orchestrates the workflow using LangGraph state nodes:
   - `readCustomerQuestion`
   - `analyzeSupportRequest`
   - `routeSupportRequest`
   - specialist handlers (`handleFaq`, `handleOrderStatus`, `handleRefund`, etc.)
   - `generateSupportResponse`
   - `escalateToHuman`
3. The workflow is stateful via `MemorySaver` and `InMemoryStore`; thread IDs are managed through `src/features/langgraph-server/`.
4. Human escalation is persisted to PostgreSQL through Prisma via the customer-support module and repository/service pattern.
5. The database model is intentionally centralized in Prisma, with the generated client written under `src/generated/prisma` and not hand-edited.

## Key codebase conventions

- Feature modules follow the NestJS pattern: controller + service + repository + DTO under `src/features/...`.
- Environment validation is enforced in `src/shared/schemas/env.validation.ts` via `ConfigModule.forRoot({ validate: Env_validation, load: [appConfig] })` in `src/app.module.ts`.
- Repository/database errors are normalized in `customer-support.service.ts` to NestJS exceptions (`BadRequestException`, `ConflictException`, `ServiceUnavailableException`, etc.).
- Graph node files live under `src/ai/nodes/*.ts`; each node handles a specific support intent or workflow step.
- The app uses Prisma 7 with a PostgreSQL driver adapter; schema changes should be done in `prisma/models/*.prisma` and migration files in `prisma/migrations/`.
- The `HUMAN_ESCALATION_SERVICE_URL` contract matters for cross-service communication: the escalation node calls the NestJS API when a ticket must be persisted.
- `src/generated/prisma` is generated output; do not manually edit generated client files.
- The database enforces uniqueness on equivalent customer-email + question escalation tickets; keep that behavior in mind when creating or updating ticket-related logic.

## Repository-specific notes

- The graph is named `agent` and is exposed through `GET /assistants/agent/graph`.
- Thread lifecycle endpoints are in `src/features/langgraph-server/langgraph-server.controller.ts` and service methods.
- The existing Jest setup targets `src` as the root test directory and expects specs ending with `.spec.ts`.
- `npm run lint` uses ESLint with auto-fix enabled, so it's a useful quick validation command after smaller changes.

## Important constraints from project docs

- Human escalation tickets are persisted as their own model, not as ad hoc logs.
- LangGraph checkpoints and run records are in-memory only in the current implementation; restart loses state.
- The app expects Prisma migrations to run before the API starts in Docker.
- The codebase is a production-oriented support orchestration workflow, not a simple chatbot demo; keep agent logic and tool boundaries explicit.
