import { Command, GraphNode } from '@langchain/langgraph';
import { SupportStateType } from '../state';
import { getSupportModel } from '../model';
import { HumanMessage, SystemMessage } from 'langchain';

export const handleRefund: GraphNode<SupportStateType> = async (
  state,
  _config,
) => {
  // Fake refund service response
  const fakeRefundResponse = {
    status: 'approved',
    refundId: 'REF-2026-001245',
    amount: 25000,
    currency: 'NGN',
    estimatedProcessingTime: '3-5 business days',
    message:
      'Your refund request has been approved and is being processed. The refunded amount should appear in your account within 3-5 business days.',
  };

  return new Command({
    update: {
      toolResult: {
        success: true,
        data: fakeRefundResponse,
        error: null,
      },
    },

    goto: 'generateSupportResponse',
  });
};
