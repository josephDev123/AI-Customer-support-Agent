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
  const classifier = model.withStructuredOutput(IntentDecisionSchema);

  const decision = await classifier.invoke([
    new SystemMessage(
      `
      You are a customer support intent classifier.

      Classify the customer support request and  return the intent enum, confidence,
      whether clarification is needed and add missing information needed to proceed.

      Return only structured output.

      Do not return any other fields.

      The response must be valid JSON matching the required schema.
      `,
    ),
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
      needsClarification: decision.needsClarification,
      missingInformation: decision.missingInformation,
    } satisfies Partial<SupportStateType>,
    goto: needsClarification ? 'requestClarification' : 'routeSupportRequest',
  });
};
