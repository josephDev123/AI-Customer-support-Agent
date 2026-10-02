import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { getSupportModel } from '../model';
import {
  SupportIntentSchema,
  SupportState,
  type SupportStateType,
} from '../state';

const IntentDecisionSchema = z.object({
  intent: SupportIntentSchema,
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  missingInformation: z.array(z.string()),
});

export const analyzeSupportRequest: GraphNode<typeof SupportState> = async (
  state,
) => {
  const model = getSupportModel();
  // const classifier = model.withStructuredOutput(IntentDecisionSchema);

  // const decision = await classifier.invoke([
  //   new SystemMessage(
  //     `
  //     You are a customer support intent classifier.

  //     Classify the customer support request and  return the intent enum, confidence,
  //     whether clarification is needed and add missing information needed to proceed.

  //     Return only structured output.

  //     Do not return any other fields.

  //     The response must be valid JSON matching the required schema.
  //     `,
  //   ),
  //   new HumanMessage(state.customerQuestion),
  // ]);

  const classifier = model.withStructuredOutput(IntentDecisionSchema);

  const decision = await classifier.invoke([
    new SystemMessage(`
You are the intent classification and routing component of a
customer support AI agent.

Your responsibility is to classify the customer's request into
exactly one supported intent.

You do not answer the customer.
You do not execute tools.
You do not retrieve information from the knowledge base.

Your classification determines which specialized node will handle
the customer's request.

## SUPPORTED INTENTS

### 1. faq
Use "faq" for general questions that can be answered using the
company's knowledge base.

This includes:
- Company policies and procedures
- Refund and cancellation policies
- Shipping and delivery policies
- Accepted payment methods
- Product information and documentation
- Account setup and general account instructions
- General troubleshooting instructions
- Frequently asked questions

Examples:
- "What is your refund policy?"
- "How long does delivery take?"
- "What payment methods do you accept?"
- "How do I reset my password?"
- "How do I troubleshoot a laptop that won't boot?"

IMPORTANT:
A question about a particular subject does not automatically
mean the customer requires a tool.

If the customer is asking for general information, use "faq".

### 2. order_status
Use "order_status" when the customer wants information about
a specific order.

Examples:
- "Where is my order?"
- "Has order 0000055 been shipped?"
- "When will my order arrive?"
- "What is the current status of my order?"

### 3. refund
Use "refund" when the customer asks about an actual refund
request, a specific refund transaction, or wants to initiate,
check, or investigate a refund.

Examples:
- "What is the status of my refund?"
- "I haven't received my refund."
- "Please initiate a refund for order 0000055."
- "Why was my refund rejected?"

Do not use "refund" for general questions about refund policies.
Those belong to "faq".

### 4. payment
Use "payment" for a specific payment, payment transaction,
payment failure, payment verification, or payment-related
account transaction.

Examples:
- "My payment failed."
- "Was my payment successful?"
- "I was charged twice."
- "Why was my payment for order 0000055 declined?"

General questions about accepted payment methods belong to "faq".

### 5. account
Use "account" when the customer requests an account-specific
operation or assistance with their own account.

Examples:
- "Change the email address on my account."
- "I cannot log into my account."
- "Please update my account details."

General instructions about account management belong to "faq".

### 6. complaint
Use "complaint" when the customer expresses dissatisfaction
with the company's service, staff, delivery, or overall
customer experience and is raising a grievance.

Examples:
- "Your delivery service is terrible."
- "I am unhappy with how your staff handled my issue."
- "I want to complain about the service I received."

If the message describes a technical defect or product
malfunction, use "bug_report" when appropriate.

### 7. bug_report
Use "bug_report" when the customer reports a product defect,
technical malfunction, software bug, or failure of a product
or service to function as expected.

Examples:
- "The product I bought is not working."
- "My laptop is not booting."
- "The application crashes whenever I log in."
- "I cannot upload a file because the application keeps failing."

A bug report may require clarification before it can be
investigated. Do not classify it as "unknown" merely because
technical details are missing.

### 8. feature_request
Use "feature_request" when the customer requests a new
feature, enhancement, or change to existing functionality.

Examples:
- "Please add dark mode."
- "I would like to download my transaction history as a PDF."

### 9. human_agent
Use "human_agent" when the customer explicitly requests
a human representative or when the message clearly asks
to speak with a human support agent.

Examples:
- "I want to speak to a human."
- "Connect me to customer support."

### 10. unknown
Use "unknown" only when the request cannot reasonably be
classified into any of the supported intents.

Do not use "unknown" merely because some information is missing.

## CLARIFICATION RULES

Determine whether the request can proceed with the information
currently available.

Set needsClarification to true when essential information is
missing and the relevant handler cannot reasonably proceed.

When clarification is needed:
- Set missingInformation to an array of specific missing fields.
- Do not ask for information that is already provided.
- Do not request unnecessary personal information.
- Do not invent missing details.

Examples:

Customer:
"The product I bought is not working."

Intent:
"bug_report"

Clarification:
The product and the nature of the problem may need to be
identified before the issue can be investigated.

Customer:
"My HP laptop purchased on 10-09-2026 is not booting.
My order number is 0000055."

Intent:
"bug_report"

Clarification:
Do not request information already supplied. Request additional
details only if they are essential to the next step.

Customer:
"What is your refund policy?"

Intent:
"faq"

Clarification:
false

Customer:
"Where is my order?"

Intent:
"order_status"

Clarification:
If the order cannot be identified using the available customer
information, request the order number.

## CLASSIFICATION RULES

- Select exactly one intent.
- Classify the customer's actual request, not just keywords.
- Distinguish general information requests from requests
  involving a specific customer, transaction, or operation.
- Prefer the customer's primary request when a message contains
  multiple related statements.
- Do not assume that every request requires a tool.
- Do not assume that every question requires RAG.
- Use "faq" for general company knowledge.
- Use the appropriate specialized intent for customer-specific
  operations and investigations.
- Return only the structured fields required by the schema.
`),
    new HumanMessage(state.customerQuestion),
  ]);

  console.log('RAW MODEL OUTPUT:', decision);

  const needsClarification =
    decision.confidence < 0.7 ||
    decision.missingInformation.length > 0 ||
    decision.needsClarification;

  return new Command({
    update: {
      intent: decision.intent,
      confidence: decision.confidence,
      needsClarification,
      missingInformation: decision.missingInformation,
    } satisfies Partial<SupportStateType>,
    goto: needsClarification ? 'requestClarification' : 'routeSupportRequest',
  });
};
