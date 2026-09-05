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

const emitResult = async () => ({});
const checkpointer = new MemorySaver();
const store = new InMemoryStore();

export const supportGraph = new StateGraph(SupportState)
  .addNode('readCustomerQuestion', ReadCustomerQuestionNode)
  .addNode('classify-intent', classifyIntent, {
    ends: ['clarify-question', 'emit-result'],
  })
  .addNode('clarify-question', clarifyQuestion, {
    ends: ['emit-result'],
  })
  .addNode('emit-result', emitResult)
  .addEdge(START, 'readCustomerQuestion')
  .addEdge('readCustomerQuestion', 'classify-intent')
  .addEdge('emit-result', END)
  .compile({
    checkpointer,
    store,
  });
