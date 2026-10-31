import {
  END,
  START,
  InMemoryStore,
  MemorySaver,
  StateGraph,
  NodeError,
  Command,
} from '@langchain/langgraph';
import { analyzeSupportRequest } from './nodes/analyzeSupportRequest.js';
import { SupportState } from './state.js';
import { ReadCustomerQuestionNode } from './nodes/ReadMail.js';
import { requestClarification } from './nodes/requestClarification.js';
import { routeSupportRequest } from './nodes/routeSupportRequest.js';
import { generateSupportResponse } from './nodes/generateSupportResponse.js';
import { handleFaq } from './nodes/handleFaq.js';
import { handleOrderStatus } from './nodes/handleOrderStatus.js';
import { handleRefund } from './nodes/handleRefund.js';
import { handlePayment } from './nodes/handlePayment.js';
import { handleAccount } from './nodes/handleAccount.js';
import { handleComplaint } from './nodes/handleComplaint.js';
import { handleBugReport } from './nodes/handleBugReport.js';
import { handleFeatureRequest } from './nodes/handleFeatureRequest.js';
import { handleUnknown } from './nodes/handleUnknown.js';
import { escalateToHuman } from './nodes/escalateToHuman.js';

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
  .addNode('escalateToHuman', escalateToHuman())
  .addNode('handleUnknown', handleUnknown)

  .addEdge(START, 'readCustomerQuestion')
  // .addEdge('readCustomerQuestion', 'analyzeSupportRequest')
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
