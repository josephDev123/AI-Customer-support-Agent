import { AIMessage } from '@langchain/core/messages';
import { Command, type GraphNode } from '@langchain/langgraph';
import { AgentState, type AgentStateType } from '../states';

const CLARIFICATION_PROMPTS: Record<string, string> = {
  order_status: 'Could you share your order number?',
  refund: 'Could you share your order number or receipt?',
  payment: 'Could you share the invoice number or payment reference?',
  account: 'Could you share the email address on the account?',
  complaint: 'Could you share a few more details about the issue?',
  bug_report: 'Could you share the steps to reproduce the bug?',
  feature_request: 'Could you share the feature you want and why it matters?',
  faq: 'Could you share a few more details so I can find the right answer?',
  human_agent: 'Could you share the main issue you want me to pass to a human agent?',
  unknown: 'Could you share a few more details so I can help?',
};

export const clarifyQuestion: GraphNode<
  typeof AgentState,
  Record<string, any>,
  'emit-result'
> = async (state) => {
  const clarificationPrompt =
    CLARIFICATION_PROMPTS[state.intent] ?? CLARIFICATION_PROMPTS.unknown;

  return new Command({
    update: {
      needsClarification: true,
      clarificationPrompt,
      nextStep: 'emit-result',
      messages: [new AIMessage(clarificationPrompt)],
    } satisfies Partial<AgentStateType>,
    goto: 'emit-result',
  });
};
