import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { Command, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { getSupportModel } from '../model';
import {
  SupportIntentSchema,
  SupportNextStepSchema,
  SupportState,
  type SupportStateType,
} from '../state';

const IntentDecisionSchema = z.object({
  intent: SupportIntentSchema,
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  // nextStep: SupportNextStepSchema,
});

export const classifyIntent: GraphNode<
  typeof SupportState,
  Record<string, any>,
  'clarify-question' | 'emit-result'
> = async (state) => {
  const model = getSupportModel();
  const classifier = model.withStructuredOutput(IntentDecisionSchema);

  const decision = await classifier.invoke([
    new SystemMessage(
      `
        You are a customer support intent classifier.

      Classify the customer support request
      and decide if clarification is needed. Return only structured output.

      Do not return any other fields.

      The response must be valid JSON matching the required schema.
      `,
    ),
    new HumanMessage(state.customerQuestion),
  ]);

  console.log('RAW MODEL OUTPUT:', decision);
  const nextStep =
    decision.needsClarification === true ? 'clarify-question' : 'emit-result';

  return new Command({
    update: {
      intent: decision.intent,
      confidence: decision.confidence,
      needsClarification: decision.needsClarification,
      nextStep,
      clarificationPrompt: '',
      // messages: [new AIMessage(`Intent classified as ${decision.intent}.`)],
    } satisfies Partial<SupportStateType>,
    goto: nextStep,
  });
};

// export const classifyIntent: GraphNode<
//   typeof SupportState,
//   Record<string, any>,
//   'clarify-question' | 'emit-result'
// > = async (state) => {
//   const model = await getSupportModel();

//   const response = await model.invoke([
//     new SystemMessage(`
//       You are a customer support intent classifier.

//       Classify the customer's support request.

//       Return ONLY valid JSON.

//       Required format:

//       {
//         "intent": "order_status",
//         "confidence": 0.98,
//         "needsClarification": false
//       }

//       Rules:
//       - Return exactly the three fields above.
//       - confidence must be between 0 and 1.
//       - needsClarification must be true or false.
//       - Do not return markdown.
//       - Do not return explanations.
//       - Do not wrap the JSON in \`\`\`.
//     `),
//     new HumanMessage(state.customerQuestion),
//   ]);

//   const raw = String(response.content);

//   console.log('RAW MODEL OUTPUT:', raw);

//   const decision = IntentDecisionSchema.parse(JSON.parse(raw));

//   const nextStep = decision.needsClarification
//     ? 'clarify-question'
//     : 'emit-result';

//   return new Command({
//     update: {
//       intent: decision.intent,
//       confidence: decision.confidence,
//       needsClarification: decision.needsClarification,
//       nextStep,
//       clarificationPrompt: '',
//       messages: [new AIMessage(`Intent classified as ${decision.intent}.`)],
//     } satisfies Partial<SupportStateType>,
//     goto: nextStep,
//   });
// };
