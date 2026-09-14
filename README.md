# Customer Support Agent

A NestJS customer-support API powered by LangGraph and a structured-output chat model. The agent extracts customer information, classifies support intent, and determines whether more information is needed.

## Current status

This project is under active development. The README documents the current implementation and will evolve as the agent gains more capabilities.

Current limitations:

- Run records are stored in memory and are lost when the application restarts.
- The HTTP service currently sends placeholder customer content and email data into the graph instead of the submitted question.
- The graph can pause with an interrupt when an email address is missing or clarification is required. Resume handling is not yet exposed through the HTTP API.

## Technology

- [NestJS](https://nestjs.com/) for the HTTP application
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) for agent orchestration
- [LangChain](https://js.langchain.com/) for model integration
- Zod for request, state, and model-output validation
- Hugging Face's OpenAI-compatible router as the current model provider

## Prerequisites

- Node.js 24 or a compatible Node.js version
- npm
- A Hugging Face API key

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=6000
HF_API_KEY=your_huggingface_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
```

All three variables are currently required during application configuration validation. `PORT` defaults to `6000` in the server bootstrap when no port is provided at runtime.

## Running the application

```bash
# Start once
npm run start

# Start in watch mode
npm run start:dev

# Build the application
npm run build

# Run the compiled application
npm run start:prod
```

The HTTP server listens on `http://localhost:6000` by default, or on the port configured through `PORT`.

## API

### `POST /agent/question`

Submit a customer-support question:

```bash
curl -X POST http://localhost:6000/agent/question \
  -H "Content-Type: application/json" \
  -d '{"question":"Where is my order?"}'
```

The request body accepts:

```json
{
  "question": "Where is my order?",
  "threadId": "optional-existing-thread-id"
}
```

`question` is required and must contain non-whitespace text. `threadId` is optional; when omitted, the service generates a UUID.

A successful response includes the stored run's `runId` and the graph result, which may contain fields such as:

- `intent`: `faq`, `order_status`, `refund`, `payment`, `account`, `complaint`, `bug_report`, `feature_request`, `human_agent`, or `unknown`
- `confidence`: a value between `0` and `1`
- `needsClarification`
- `missingInformation`
- `clarificationPrompt`
- `finalResult`

Invalid or missing questions return a `400 Bad Request` response.

## Agent workflow

The active support graph in `src/ai/graph.ts` follows this flow:

1. Extract the customer question and email from the input.
2. Interrupt if an email address is unavailable.
3. Classify the support intent and confidence.
4. Interrupt when clarification is required.
5. Produce a clarification prompt or complete the current routing step.

The current model is `Qwen/Qwen3-4B-Instruct-2507:nscale`, accessed through `https://router.huggingface.co/v1` with `HF_API_KEY`.

## Project structure

```text
src/
├── ai/                  LangGraph state, model, graph, and nodes
├── customer-support/   HTTP controller, service, DTO, and in-memory repository
├── config/              Application configuration
├── shared/              Shared environment validation
└── main.ts              Application bootstrap
test/                    End-to-end tests
langgraph.json           LangGraph CLI graph configuration
```

## Tests and quality checks

```bash
# Unit tests
npm run test

# Watch tests
npm run test:watch

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:cov

# Lint
npm run lint

# Format source files
npm run format
```

## LangGraph development

The graph configured for LangGraph tooling is named `agent` and points to `src/ai/graph.ts:supportGraph`:

```bash
npx @langchain/langgraph-cli dev
```

Refer to `langgraph.json` and the [LangGraph JavaScript documentation](https://langchain-ai.github.io/langgraphjs/) for development and deployment configuration.

