import { Command, type GraphNode } from '@langchain/langgraph';
import { SupportState } from '../state.js';

interface CreateEscalationInput {
  customerEmail: string;
  customerQuestion: string;
  intent: string;
  priority?: 'low' | 'medium' | 'high';
}

const escalationServiceUrl = () =>
  process.env.HUMAN_ESCALATION_SERVICE_URL ?? 'http://localhost:8000';

export const escalateToHuman = (
  // supportService: SupportService,
): GraphNode<typeof SupportState, any> => {
  return async (state, runtime) => {
    try {
      const escalation: CreateEscalationInput = {
        customerEmail: runtime.configurable?.email,
        customerQuestion: state.customerQuestion,
        intent: state.intent,
        priority: 'high',
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      let ticket: unknown;
      try {
        const response = await fetch(
          `${escalationServiceUrl().replace(/\/$/, '')}/human-escalation-tickets`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(escalation),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Escalation service returned ${response.status}`);
        }
        ticket = await response.json();
      } finally {
        clearTimeout(timeout);
      }

      // 2. Return the updated graph state
      return new Command({
        update: {
          toolResult: {
            success: true,
            data: {
              handoffStatus: 'escalated',
              ticket,
              response:
                'Your request has been escalated to our human support team. A representative will follow up with you.',
            },
            error: null,
          },
        },
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
            error:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          },
        },
      });
    }
  };
};
