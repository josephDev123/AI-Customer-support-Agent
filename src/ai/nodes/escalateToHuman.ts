import { Command, type GraphNode } from '@langchain/langgraph';
import { SupportState } from '../state';

interface CreateEscalationInput {
  customerEmail: string;
  intent: string;
  reason: EscalationReason;
}

export enum EscalationReason {
  CUSTOMER_REQUESTED_HUMAN = 'CUSTOMER_REQUESTED_HUMAN',
  COMPLEX_ISSUE = 'COMPLEX_ISSUE',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  UNRESOLVED_ISSUE = 'UNRESOLVED_ISSUE',
  CUSTOMER_COMPLAINT = 'CUSTOMER_COMPLAINT',
}
interface CreateEscalationResult {
  ticketId: string;
  assignedAgentName: string;
}

export const escalateToHuman = (
  // supportService: SupportService,
): GraphNode<typeof SupportState, any> => {
  return async (state, runtime) => {
    try {
      // 1. Create the escalation ticket
      // const escalation = await supportService.createEscalation({
      //   customerEmail: runtime.configurable?.email,
      //   customerQuestion: state.customerQuestion,
      //   intent: state.intent,
      //   reason: EscalationReason.CUSTOMER_REQUESTED_HUMAN,
      // });

      // 1. Create the escalation ticket mock result

      const escalation = {
        customerEmail: runtime.configurable?.email,
        customerQuestion: state.customerQuestion,
        intent: state.intent,
        reason: EscalationReason.CUSTOMER_REQUESTED_HUMAN,
      };

      // 2. Return the updated graph state
      return new Command({
        update: {
          toolResult: {
            success: true,
            data: {
              handoffStatus: 'escalated',
              escalationReason: EscalationReason.CUSTOMER_REQUESTED_HUMAN,
              supportTicketId: crypto.randomUUID(),
              assignedAgent: 'Mr Resolver',
              response: `Your request has been escalated to our human support team. Your support reference is ${crypto.randomUUID()}. A representative will follow up with you.`,
            },
            error: null,
          },
        },
        // goto: '',
      });
    } catch (error) {
      return new Command({
        update: {
          toolResult: {
            success: false,
            data: {
              handoffStatus: 'failed',
              response:
                'We could not complete your request for human support right now. Please try again shortly.',
            },
            error: 'error occur',
          },
        },
      });
    }
  };
};
