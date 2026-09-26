import { Command, type GraphNode } from '@langchain/langgraph';
import { SupportState } from '../state';

export const routeSupportRequest: GraphNode<typeof SupportState> = async (
  state,
) => {
  switch (state.intent) {
    case 'faq':
      return new Command({ goto: 'handleFaq' });

    case 'order_status':
      return new Command({ goto: 'handleOrderStatus' });

    case 'refund':
      return new Command({ goto: 'handleRefund' });

    case 'payment':
      return new Command({ goto: 'handlePayment' });

    case 'account':
      return new Command({ goto: 'handleAccount' });

    case 'complaint':
      return new Command({ goto: 'handleComplaint' });

    case 'bug_report':
      return new Command({ goto: 'handleBugReport' });

    case 'feature_request':
      return new Command({ goto: 'handleFeatureRequest' });

    case 'human_agent':
      return new Command({ goto: 'escalateToHuman' });

    case 'unknown':
    default:
      return new Command({ goto: 'handleUnknown' });
  }
};
