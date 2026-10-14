import {
  END,
  START,
  InMemoryStore,
  MemorySaver,
  StateGraph,
  NodeError,
  Command,
} from '@langchain/langgraph';
import { analyzeSupportRequest } from './nodes/analyzeSupportRequest';
import { SupportState } from './state';
import { ReadCustomerQuestionNode } from './nodes/ReadMail';
import { requestClarification } from './nodes/requestClarification';
import { routeSupportRequest } from './nodes/routeSupportRequest';
import { generateSupportResponse } from './nodes/generateSupportResponse';
import { handleFaq } from './nodes/handleFaq';
import { handleOrderStatus } from './nodes/handleOrderStatus';
import { handleRefund } from './nodes/handleRefund';
import { handlePayment } from './nodes/handlePayment';
import { handleAccount } from './nodes/handleAccount';
import { handleComplaint } from './nodes/handleComplaint';
import { handleBugReport } from './nodes/handleBugReport';
import { handleFeatureRequest } from './nodes/handleFeatureRequest';
import { handleUnknown } from './nodes/handleUnknown';
import { escalateToHuman } from './nodes/escalateToHuman';

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

const defaultErrorHandler = (_state: unknown, error: NodeError) => {
  console.log(`handled: ${error.error.message}`);
  return {
    response: '',
  };
};

export const supportGraph = new StateGraph(SupportState)
  .setNodeDefaults({
    retryPolicy: { maxAttempts: 3 },
    errorHandler: defaultErrorHandler,
  })
  .addNode('readCustomerQuestion', ReadCustomerQuestionNode)
  .addNode('analyzeSupportRequest', analyzeSupportRequest, {
    ends: ['routeSupportRequest', 'requestClarification'],
  })
  .addNode('routeSupportRequest', routeSupportRequest, {
    ends: [
      'handleFaq',
      'handleOrderStatus',
      'handleRefund',
      'handlePayment',
      'handleAccount',
      'handleComplaint',
      'handleBugReport',
      'handleFeatureRequest',
      'escalateToHuman',
      'handleUnknown',
    ],
  })
  .addNode('requestClarification', requestClarification)
  .addNode('generateSupportResponse', generateSupportResponse)

  // Handlers
  .addNode('handleFaq', handleFaq)
  .addNode('handleOrderStatus', handleOrderStatus)
  .addNode('handleRefund', handleRefund)
  .addNode('handlePayment', handlePayment)
  .addNode('handleAccount', handleAccount)
  .addNode('handleComplaint', handleComplaint)
  .addNode('handleBugReport', handleBugReport)
  .addNode('handleFeatureRequest', handleFeatureRequest)
  .addNode('escalateToHuman', escalateToHuman)
  .addNode('handleUnknown', handleUnknown)

  .addEdge(START, 'readCustomerQuestion')
  .addEdge('readCustomerQuestion', 'analyzeSupportRequest')
  .addEdge('requestClarification', 'analyzeSupportRequest')

  // Each handler eventually goes to response generation
  .addEdge('handleFaq', 'generateSupportResponse')
  .addEdge('handleOrderStatus', 'generateSupportResponse')
  .addEdge('handleRefund', 'generateSupportResponse')
  .addEdge('handlePayment', 'generateSupportResponse')
  .addEdge('handleAccount', 'generateSupportResponse')
  .addEdge('handleComplaint', 'generateSupportResponse')
  .addEdge('handleBugReport', 'generateSupportResponse')
  .addEdge('handleFeatureRequest', 'generateSupportResponse')
  .addEdge('escalateToHuman', 'generateSupportResponse')
  .addEdge('handleUnknown', 'generateSupportResponse')
  .addEdge('generateSupportResponse', END)

  .compile({
    checkpointer,
    store,
  });
