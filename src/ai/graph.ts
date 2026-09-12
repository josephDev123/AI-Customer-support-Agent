import {
  END,
  START,
  InMemoryStore,
  MemorySaver,
  StateGraph,
} from '@langchain/langgraph';
import { classifyIntent } from './nodes/classifyIntent';
import { clarifyQuestion } from './nodes/clarifyQuestion';
import { SupportState } from './state';
import { ReadCustomerQuestionNode } from './nodes/ReadMail';

const handleRouting = async () => ({
  route: 'Routing handled',
});
const checkpointer = new MemorySaver();
const store = new InMemoryStore();

export const supportGraph = new StateGraph(SupportState)
  .addNode('readCustomerQuestion', ReadCustomerQuestionNode)
  .addNode('classify-intent', classifyIntent, {
    ends: ['clarify-question', 'handle-routing'],
  })
  .addNode('clarify-question', clarifyQuestion, {
    // ends: ['handle-routing'],
  })
  .addNode('handle-routing', handleRouting)

  .addEdge(START, 'readCustomerQuestion')
  .addEdge('readCustomerQuestion', 'classify-intent')

  .addEdge('clarify-question', END)
  .addEdge('handle-routing', END)
  .compile({
    checkpointer,
    store,
  });
