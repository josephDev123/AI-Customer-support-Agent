# Customer Support AI Agent Orchestrator

A NestJS API that orchestrates an AI-powered customer-support workflow with LangGraph. The orchestrator reads a customer question, analyzes its intent, requests clarification when needed, routes the request to a specialized support handler, and generates a final response or human-escalation recommendation.

## What it does

The active support graph in `src/ai/graph.ts` coordinates these stages:

1. Read and extract the customer question.
2. Request missing information, such as an email address, when required.
3. Analyze the request and classify its intent.
4. Route the request to a specialized handler.
5. Generate a customer-facing support response.

Supported intents include:

- FAQ
- Order status
- Refunds
- Payments
- Account issues
- Complaints
- Bug reports
- Feature requests
- Human-agent escalation
- Unknown or unsupported requests

The graph uses LangGraph checkpointing and an in-memory store for the current development workflow.

## Architecture

```text
HTTP request
    |
    v
NestJS CustomerSupportController
    |
    v
CustomerSupportService
    |
    v
LangGraph supportGraph
    |
    +--> Read customer question
    +--> Analyze intent and confidence
    +--> Clarify missing information when needed
    +--> Route to a support handler
    +--> Generate final response
    |
    v
In-memory run repository
```

## Technology

- [NestJS](https://nestjs.com/) — HTTP application and dependency injection
- [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) — stateful agent orchestration
- [LangChain](https://js.langchain.com/) — chat-model integration and messages
- [Zod](https://zod.dev/) — request, state, model-output, and environment validation
- Hugging Face OpenAI-compatible router — current model provider
- Pinecone — configured for retrieval-oriented support workflows

## Prerequisites

- Node.js 24
- npm
- A Hugging Face API key
- LangSmith credentials for tracing/configuration
- Pinecone credentials for the configured retrieval integration

## Installation

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=6000
HF_API_KEY=your_huggingface_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host
```

All five variables are validated at startup. `PORT` is exposed as the HTTP port and defaults to `6000` in the application bootstrap when not otherwise provided.

## Run the API

```bash
# Start the API
npm run start

# Start in watch mode
npm run start:dev

# Build the application
npm run build

# Run the compiled application
npm run start:prod
```

By default, the API is available at `http://localhost:6000`.

## API

### `POST /agent/question`

Submit a customer-support question:

```bash
curl -X POST http://localhost:6000/agent/question \
  -H "Content-Type: application/json" \
  -d '{"question":"Where is my order?"}'
```

Request body:

```json
{
  "question": "Where is my order?",
  "threadId": "optional-existing-thread-id"
}
```

`question` is required and must contain non-whitespace text. `threadId` is optional; if omitted, the service generates a UUID.

A successful response includes a `runId` and the current graph result, which can include fields such as:

```json
{
  "runId": "run-id",
  "intent": "order_status",
  "confidence": 0.94,
  "needsClarification": false,
  "missingInformation": [],
  "clarificationPrompt": null,
  "finalResult": "..."
}
```

Invalid requests return `400 Bad Request`.

## Current development limitations

- Run records and LangGraph checkpoints are stored in memory and are lost when the process restarts.
- The graph can pause with an interrupt when an email address or clarification is required. Resume handling is not yet exposed through the HTTP API.
- Environment validation requires Pinecone variables even though the current graph's retrieval integration is still being completed.

## Project structure

```text
src/
├── ai/                  LangGraph state, graph, model, and support nodes
├── customer-support/   Active HTTP controller, service, DTO, and run repository
├── agent/              Earlier agent workflow and supporting abstractions
├── config/              Application configuration
├── shared/              Shared validation schemas
└── main.ts              Application bootstrap

test/                    End-to-end tests
langgraph.json           LangGraph CLI graph configuration
```

## Tests and quality checks

```bash
npm run test
npm run test:watch
npm run test:e2e
npm run test:cov
npm run lint
npm run format
```

## LangGraph development

The graph exposed to LangGraph tooling is named `agent` and points to `src/ai/graph.ts:supportGraph`:

```bash
npx @langchain/langgraph-cli dev
```

See `langgraph.json` and the [LangGraph.js documentation](https://langchain-ai.github.io/langgraphjs/) for local graph development and deployment configuration.
