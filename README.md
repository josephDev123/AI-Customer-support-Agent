# Customer Support AI Agent

A NestJS API that orchestrates an AI-powered customer-support workflow with LangGraph. The agent analyzes customer questions, routes support requests, generates responses, and creates persistent human-escalation tickets when needed.

## Features

- FAQ, order status, refund, payment, account, complaint, bug-report, and feature-request routing.
- Human-agent escalation through a persisted PostgreSQL ticket.
- Prisma 7 with the PostgreSQL driver adapter.
- Zod validation for request and environment data.
- LangGraph checkpointing and in-memory development state.

## Architecture

```text
Customer question
       |
       v
LangGraph supportGraph
       |
       +--> Detect human escalation
       |        |
       |        v
       |   POST /human-escalation-tickets
       |        |
       |        v
       |   NestJS controller
       |        |
       |        v
       |   Service -> Repository -> Prisma -> PostgreSQL
       |
       +--> Other support handler -> Customer response
```

## Prerequisites

- Node.js 24
- npm
- PostgreSQL
- Google API key
- LangSmith credentials
- Pinecone credentials

## Installation

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
GOOGLE_API_KEY=your_google_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host
DATABASE_URL=postgresql://user:password@localhost:5432/customer_support
LANGGRAPH_API_URL=http://localhost:2024
HUMAN_ESCALATION_SERVICE_URL=http://localhost:5000
```

`LANGGRAPH_API_URL` points to the LangGraph server. Compose overrides it with `http://langgraph:2024`; for local development, start the LangGraph server on port 2024 and use `http://localhost:2024`. `HUMAN_ESCALATION_SERVICE_URL` should point to the NestJS API.

Apply migrations and generate the Prisma client:

```bash
prisma migrate deploy
prisma generate
```

## Run the API

```bash
npm run start
npm run start:dev
npm run build
npm run start:prod
```

The API listens on `http://localhost:5000` when `PORT=5000` is configured.

## API

### `POST /human-escalation-tickets`

Creates a human-escalation ticket. This endpoint is called by the LangGraph agent and can also be used by another trusted integration.

Request:

```json
{
  "customerEmail": "customer@example.com",
  "customerQuestion": "I want to speak to a human about my order.",
  "intent": "human_agent",
  "priority": "high"
}
```

Fields:

- `customerEmail` — required valid email address.
- `customerQuestion` — required non-empty question.
- `intent` — required support intent.
- `priority` — optional: `low`, `medium`, or `high`; defaults to `medium`.

Response:

```json
{
  "id": "c2c5f2b0-9a3c-4d8f-8a7d-2b5c0f8d2d31",
  "customerEmail": "customer@example.com",
  "customerQuestion": "I want to speak to a human about my order.",
  "intent": "human_agent",
  "priority": "high",
  "status": "OPEN",
  "assignedTo": null,
  "assignedAt": null,
  "resolvedAt": null,
  "resolution": null,
  "lastHumanResponseAt": null,
  "createdAt": "2026-11-01T06:00:00.000Z",
  "updatedAt": "2026-11-01T06:00:00.000Z"
}
```

Ticket statuses are `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_CUSTOMER`, `RESOLVED`, and `CLOSED`.

The database prevents duplicate tickets for the same customer email and question.

Common errors:

- `400 Bad Request` — invalid request or database values.
- `409 Conflict` — an equivalent ticket already exists.
- `503 Service Unavailable` — the database is unavailable or timed out.
- `500 Internal Server Error` — an unexpected persistence failure.

## Project Structure

```text
src/
├── ai/                  LangGraph state, graph, model, and support nodes
├── features/
│   └── customer-support/ Controller, service, DTO, and repository
├── generated/prisma/    Generated Prisma client
├── prisma/              Prisma service and module
├── config/              Application configuration
├── shared/              Shared validation schemas
└── main.ts              Application bootstrap

prisma/
├── schema.prisma        Generator and datasource configuration
├── models/              One Prisma model per file
│   ├── user.prisma
│   └── human-escalation-ticket.prisma
└── migrations/          PostgreSQL migrations
```

## Tests and Quality Checks

```bash
npm run test
npm run test:watch
npm run test:e2e
npm run test:cov
npm run lint
npm run format
```

## LangGraph Development

The graph exposed to LangGraph tooling is `agent` and points to `src/ai/graph.ts:supportGraph`:

```bash
npm run start:langgraph
```

The script binds to `0.0.0.0:2024`, disables browser launching and file watching, and runs the graph registered in `langgraph.json`. The config selects the installed `ts-node/esm` loader so the CLI can run with reloading disabled.

## Production Docker

Copy `.env.example` to `.env` and replace every `replace-me` value with a production secret. The `.env` file is used by Docker Compose and is intentionally excluded from the images.

Build and start the services:

```bash
docker compose build
docker compose up -d
```

The API listens on container port `5000` and the LangGraph development server listens on `0.0.0.0:2024`. Compose binds both host ports only to loopback (`127.0.0.1`), for the Nginx process installed on the Docker host. NestJS still connects to LangGraph internally at `http://langgraph:2024` over the private Compose network. PostgreSQL is not published.

Prisma migrations run through the one-shot `migrate` service before the API starts. The API and LangGraph services can start and restart independently; the existing NestJS routes report LangGraph connection failures when it is unavailable.

### Host Nginx, DNS, and TLS

Nginx runs on the host, so it must proxy to loopback-published ports rather than Docker service names. The Compose defaults are:

| Hostname | Host-only upstream | Nginx include |
| --- | --- | --- |
| `api.josephdev.com.ng` | `http://127.0.0.1:5000` | `deploy/nginx/api-location.conf` |
| `agent.josephdev.com.ng` | `http://127.0.0.1:2024` | `deploy/nginx/langgraph-location.conf` |

The defaults are `API_HOST_PORT=5000` and `LANGGRAPH_HOST_PORT=2024` in `.env.example`. If either host port is changed, update the matching Nginx `proxy_pass` in the include file as well. Keep the Compose bindings on `127.0.0.1`.

Add these A records at your DNS provider, pointing to the DigitalOcean server's public IPv4 address:

```text
api.josephdev.com.ng    A    <DIGITALOCEAN_PUBLIC_IP>
agent.josephdev.com.ng  A    <DIGITALOCEAN_PUBLIC_IP>
```

Check DNS propagation from a client or the server:

```bash
dig +short api.josephdev.com.ng
dig +short agent.josephdev.com.ng
```

In each existing Nginx TLS `server` block, preserve its current `listen`, certificate, and renewal configuration and include the matching location file, for example. Replace an existing `location /` for that hostname rather than adding a duplicate:

```nginx
server {
    server_name agent.josephdev.com.ng;
    # Keep the existing listen/SSL/certificate directives in this block.
    include /path/to/AI-customer-support-agent/deploy/nginx/langgraph-location.conf;
}

server {
    server_name api.josephdev.com.ng;
    # Keep the existing listen/SSL/certificate directives in this block.
    include /path/to/AI-customer-support-agent/deploy/nginx/api-location.conf;
}
```

Use the actual checkout path on the server. Add `server_name` entries to existing vhosts rather than creating duplicate server blocks for the same hostnames. If no TLS certificate covers these names, use the Certbot method already installed on the server to issue/extend certificates after DNS resolves and inbound ports 80/443 are permitted. Do not replace existing certificates or renewal hooks. Check and reload Nginx with `sudo nginx -t` and `sudo systemctl reload nginx`.

If Certbot's Nginx plugin is installed and these hostnames do not already have certificates, issue a certificate without asking Certbot to replace the existing Nginx configuration:

```bash
sudo certbot certonly --nginx -d api.josephdev.com.ng -d agent.josephdev.com.ng
```

Use your existing host's certificate paths and renewal workflow in the TLS server blocks. Keep ports `5000` and `2024` closed in the DigitalOcean firewall; only Nginx's public HTTP/HTTPS ports should accept web traffic.

The LangGraph proxy include uses HTTP/1.1 and disables response buffering/cache with long timeouts for SSE. The installed frontend SDK's default stream transport is SSE; WebSocket upgrade directives are not needed for this path. Nginx forwards the request path and query string unchanged.

### Direct frontend connection

The NestJS REST routes remain available for existing clients. For native LangGraph streaming, interrupts, and resume, frontend code should call the LangGraph API directly:

```ts
useStream({
  apiUrl: 'https://agent.josephdev.com.ng',
  assistantId: 'agent',
});
```

Keep the existing thread, input, and stream configuration. The graph ID is `agent`; do not use `pipeline`. Because frontend source was unavailable, `https://josephdev.com.ng` in `langgraph.json` is an assumed frontend origin: replace it with the frontend's exact HTTPS origin if different, then rebuild/recreate LangGraph after backing up its checkpoint files. CORS is not authentication.

### Security warning

**The LangGraph API is intentionally public and unauthenticated in this training deployment.** Anyone who can reach the endpoint can invoke graph operations and consume the server's configured AI-provider credentials/resources. HTTPS encrypts traffic; CORS only controls browser access and is not an access-control boundary.

**TODO: Add authentication and authorization to the public LangGraph API before using it with real customer data or in production.**

### Health checks and service commands

Verify service health and public DNS/HTTPS:

```bash
docker compose ps
curl -fsS "http://127.0.0.1:${API_HOST_PORT:-5000}/health"
curl -fsS "http://127.0.0.1:${LANGGRAPH_HOST_PORT:-2024}/ok"
curl -i https://agent.josephdev.com.ng/ok
curl -i https://api.josephdev.com.ng/health
```

An authenticated endpoint check is intentionally not required because authentication is deferred. Check an OPTIONS/CORS response from the actual frontend origin before testing the browser:

```bash
curl -i -X OPTIONS https://agent.josephdev.com.ng/assistants/search \
  -H 'Origin: https://josephdev.com.ng' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type,last-event-id'
```

Useful lifecycle and inspection commands:

```bash
docker compose stop
docker compose start
docker compose restart api
docker compose restart langgraph
docker compose logs -f api
docker compose logs -f langgraph
docker compose ps
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

Stop and remove the application containers/network while retaining PostgreSQL data:

```bash
docker compose down
```

Deploy future code changes by updating the repository and rebuilding/recreating the services:

```bash
git pull
docker compose up -d --build
```

For the first deployment of loopback-only ports, Nginx must not be reloaded until the new Compose services are running. Before any command that recreates LangGraph, back up `/app/.langgraph_api` from the existing container if its threads/checkpoints must be retained:

```bash
mkdir -p "$HOME/langgraph-backup"
docker cp ai-agent-langgraph:/app/.langgraph_api "$HOME/langgraph-backup/"
```

Keep that backup outside the repository and protect it as customer data.

To test frontend streaming, create/use a thread via `useStream`, send the existing graph input, and confirm state events arrive incrementally. For interrupt/resume, trigger the graph's existing clarification interrupt, provide the resume value through the hook, and confirm the same thread continues. No frontend source is present in this repository, so UI-level verification must be done in the frontend project.

### Persistence and limitations

- The source graph remains compiled with `MemorySaver` and `InMemoryStore`. With the installed LangGraph CLI/API version, the development server replaces those runtime checkpointer/store instances with file-backed in-memory implementations under `/app/.langgraph_api` (including thread/run metadata, checkpoints, and store values). The graph source itself is unchanged.
- That local file data survives a LangGraph process restart and `docker compose restart langgraph` while the same container filesystem remains. It is lost when Compose recreates/replaces the container (`docker compose down` followed by `up`, or a rebuilt deployment), because this configuration does not mount a volume for `/app/.langgraph_api`. A hard process kill can also lose writes not yet flushed.
- PostgreSQL ticket records survive container recreation through `postgres_data`. Durable LangGraph history across container replacement requires a persistent volume or a production checkpoint/store backend; neither is configured here.
- NestJS fetches thread state from LangGraph rather than keeping its former local thread map.
- The LangGraph development server is intended for development and training, not a hardened production deployment. It has no production support guarantees. Docker binds its host port only to loopback, but the host Nginx deliberately publishes the API publicly without authentication.
- Resume handling for graph interruptions is not exposed through the existing NestJS HTTP API; use the direct LangGraph endpoint for native interrupt/resume behavior.
