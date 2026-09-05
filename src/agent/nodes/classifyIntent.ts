import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { getModel } from '../model';
import {
  AgentIntentSchema,
  AgentNextStepSchema,
  AgentState,
  type AgentStateType,
} from '../states';

const IntentDecisionSchema = z.object({
  intent: AgentIntentSchema,
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  nextStep: AgentNextStepSchema,
});

export const classifyIntent: GraphNode<typeof AgentState, Record<string, any>, 'clarify-question' | 'emit-result'> =
  async (state) => {
    const model = await getModel();
    const classifier = model.withStructuredOutput(IntentDecisionSchema);

    const decision = await classifier.invoke([
      new SystemMessage(
        'Classify the customer support request and decide if clarification is needed. Return only structured output.',
      ),
      new HumanMessage(state.customerQuestion),
    ]);

    const nextStep =
      decision.needsClarification === true ? 'clarify-question' : 'emit-result';

    return new Command({
      update: {
        intent: decision.intent,
        confidence: decision.confidence,
        needsClarification: decision.needsClarification,
        nextStep,
        clarificationPrompt: '',
        messages: [new AIMessage(`Intent classified as ${decision.intent}.`)],
      } satisfies Partial<AgentStateType>,
      goto: nextStep,
    });
  };
