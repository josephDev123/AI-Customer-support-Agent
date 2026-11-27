import { Command, interrupt, type GraphNode } from '@langchain/langgraph';
import { SupportState } from '../state.js';

export const requestClarification: GraphNode<typeof SupportState> = async (
  state,
) => {
  const userReply = interrupt({
    reason: 'Additional information is required to process this request.',
    missingInformation: state.missingInformation,
  });

  return new Command({
    update: {
      customerQuestion: `${state.customerQuestion}\n\nAdditional information: ${userReply}`,
      needsClarification: false,
      missingInformation: [],
    },
    goto: 'analyzeSupportRequest',
  });
};
