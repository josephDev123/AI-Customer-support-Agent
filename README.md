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
- Hugging Face API key
- LangSmith credentials
- Pinecone credentials

## Installation

```bash
npm install
```

Create a `.env` file:

```env
PORT=6000
HF_API_KEY=your_huggingface_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host
DATABASE_URL=postgresql://user:password@localhost:5432/customer_support
HUMAN_ESCALATION_SERVICE_URL=http://localhost:6000
```

`DATABASE_URL` is required. `HUMAN_ESCALATION_SERVICE_URL` is optional and defaults to `http://localhost:8000` inside the LangGraph escalation node. Set it to the NestJS API base URL when the agent and API run in separate processes.

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

The API listens on `http://localhost:6000` when `PORT=6000` is configured.

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
npx @langchain/langgraph-cli dev
```

## Current Limitations

- Run records and LangGraph checkpoints are stored in memory and are lost when the process restarts.
- Resume handling for graph interruptions is not exposed through the HTTP API.
- The agent and NestJS API must be able to reach each other through `HUMAN_ESCALATION_SERVICE_URL`.
