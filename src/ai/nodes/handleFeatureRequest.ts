import { Command, GraphNode } from '@langchain/langgraph';
import { SupportStateType } from '../state';
import { getSupportModel } from '../model';
import { HumanMessage, SystemMessage } from 'langchain';

export const handleFeatureRequest: GraphNode<SupportStateType> = async (
  state,
  _config,
) => {
  const llm = getSupportModel();

  const response = await llm.invoke([
    new SystemMessage(`
      You are a professional customer support agent.

      Using the information gathered by the previous support handler,
      provide a clear and helpful response to the customer.

      Do not invent information.
    `),
    new HumanMessage(state.customerQuestion),
  ]);

  const finalResponse =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  return new Command({
    update: {
      response: '',
    },
  });
};
