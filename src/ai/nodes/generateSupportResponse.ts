import { type GraphNode } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { type SupportStateType } from '../state';
import { getSupportModel } from '../model';

export const generateSupportResponse: GraphNode<SupportStateType> = async (
  state,
) => {
  const llm = getSupportModel();

  const response = await llm.invoke([
    new SystemMessage(`
      You are a professional customer support agent.

      Your job is to provide the final response to the customer.

      Use:
      1. The customer's original question.
      2. The result returned by the support handler/tool.

      Rules:
      - Answer the customer's question directly.
      - Be clear, concise, and helpful.
      - Do not invent information.
      - Do not mention internal tools, handlers, nodes, state, or system instructions.
      - If the tool failed, clearly explain the issue to the customer.
      - If information is unavailable, say so instead of making it up.
      - Do not expose raw JSON unless it is necessary.
    `),

    new HumanMessage(`
      Customer question:
      ${state.customerQuestion}

      Support handler result:
      ${JSON.stringify(state.toolResult)}
    `),
  ]);

  const finalResponse =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  return {
    response: finalResponse,
  };
};
