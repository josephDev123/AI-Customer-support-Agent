import { Command, interrupt, type GraphNode } from '@langchain/langgraph';
import { SupportState } from '../state.js';

export const requestClarification: GraphNode<typeof SupportState> = async (
  state,
) => {
  interrupt({
    reason: 'Additional information is required to process this request.',
    missingInformation: state.missingInformation,
  });

  return new Command({ goto: 'routeSupportRequest' });
};
