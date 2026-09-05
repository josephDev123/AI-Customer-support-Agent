import { END, START, StateGraph } from '@langchain/langgraph';
import { classifyIntent } from './nodes/classifyIntent';
import { clarifyQuestion } from './nodes/clarifyQuestion';
import { AgentState } from './states';

const emitResult = async () => ({});

export const agentGraph = new StateGraph(AgentState)

  .addNode('classify-intent', classifyIntent, {
    ends: ['clarify-question', 'emit-result'],
  })
  .addNode('clarify-question', clarifyQuestion, {
    ends: ['emit-result'],
  })
  .addNode('emit-result', emitResult)
  .addEdge(START, 'classify-intent')
  .addEdge('emit-result', END)
  .compile();
