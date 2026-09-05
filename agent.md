# AI Customer Support Agent

This is an excellent first project. Since you're already experienced with Node.js, PostgreSQL, Docker, Redis, and LangGraph, I wouldn't build this as a demo chatbot. I'd build it as if it were going into production for a SaaS company.

The biggest mistake people make is thinking an AI customer support agent is simply:

```text
User
 ->
LLM
 ->
Answer
```

That is not how production systems work.

A production customer support agent is essentially an orchestrator that decides:

- Does the user just need an answer?
- Should I search documentation?
- Should I check an order?
- Should I create a ticket?
- Should I ask a follow-up question?
- Should I transfer to a human?
- Should I remember this conversation?

The LLM is just one component.

## High-Level Architecture

```text
                    Frontend
          (Web, Mobile, WhatsApp, Slack)

                         |
                         v
                Customer Support API
                  (Node.js/Nestjs)

                         |
                         v
                 LangGraph Workflow
                         |
 +-----------------------+------------------------+
 |                       |                        |
 v                       v                        v
Memory                RAG Search             Business Tools
                         |                        |
                         |                        |
                 pgvector/Pinecone        Order API
                                          Ticket API
                                          CRM
                                          Email
                                          Payment
                                          Calendar
                                          etc.

                         |
                         v
                       GPT-5
                         |
                         v
                    Final Response
```

## Real Company Flow

Imagine the user types:

`My order hasn't arrived.`

The AI should not answer immediately.

Instead it should think:

Can I answer from docs?

No

Need order information

Ask user for order number

User provides order number

Call Order Tool

Order found

Shipping status

Generate response

Notice the LLM never directly accesses the database.

Everything goes through tools.

## Production Workflow

```text
START

Receive Message

Load Conversation Memory

Classify Intent

Need clarification?

YES --------------------------> Ask Follow-up
|                                  |
NO                                 |
|                                  |
v                                  |
Choose Tool                        |
|                                  |
v                                  |
Run Tool                           |
|                                  |
v                                  |
Need another tool? ----------------+
|
YES
|
v
Run Next Tool

Generate Final Answer

Save Memory

END
```

This is exactly the type of workflow LangGraph excels at.

## Intent Classification Node

The first AI node should never answer.

Its only job is:

> "What does the customer want?"

Possible intents:

- FAQ
- ORDER_STATUS
- REFUND
- PAYMENT
- ACCOUNT
- COMPLAINT
- BUG_REPORT
- FEATURE_REQUEST
- HUMAN_AGENT
- UNKNOWN

Output:

```json
{
  "intent": "ORDER_STATUS",
  "confidence": 0.96
}
```

## Clarification Node

Many requests are incomplete.

Example:

`Cancel my order`

The AI should think:

Need order number.

Instead of hallucinating.

Output:

`Could you provide your order number?`

## Router Node

LangGraph now routes.

Intent -> ORDER_STATUS -> Order Tool -> Return Order

Another example:

Intent -> FAQ -> Knowledge Search

Another:

Intent -> REFUND -> Payment Tool

## Available Tools

Think of tools as microservices.

### Order Tool

- `getOrder()`
- `cancelOrder()`
- `trackShipment()`

### Account Tool

- `changeEmail()`
- `resetPassword()`
- `verifyUser()`

### Ticket Tool

- `createTicket()`
- `closeTicket()`
- `assignAgent()`

### CRM Tool

- `findCustomer()`
- `updateCustomer()`
- `getSubscription()`

### Documentation Tool (RAG)

- `searchKnowledgeBase()`
- `searchFAQ()`
- `searchPolicies()`

### Email Tool

- `sendEmail()`
- `sendVerification()`
- `sendReceipt()`

## Memory

Don't use memory only for conversation.

Store things like:

- User prefers email.
- Preferred language.
- Last order.
- Previous complaint.
- Subscription plan.
- Customer name.

## LangGraph Memory

LangGraph in Memory

## RAG Flow

User

Embedding

Vector Search

Top 5 documents

Context

GPT

Answer

Never dump your whole documentation into the prompt.

## Human Escalation

Very important.

Some conversations should stop.

- Refund over $1000 -> Human
- Threatening legal action -> Human
- Angry customer -> Human
- Account hacked -> Human

The AI should create a ticket.

## Ticket Flow

Customer angry

AI

Create Ticket

Store Conversation

Notify Slack

Send Email

Human Agent

## Suggested LangGraph Nodes

I would design the graph with small, single-purpose nodes:

START -> Load Memory -> Intent Classification -> Need Clarification? -> Router -> Tool Executor -> Need Another Tool? -> Summarize Context -> Generate Response -> Save Memory -> END
