import { Command, GraphNode } from '@langchain/langgraph';
import { SupportStateType } from '../state';
import { getSupportModel } from '../model';
import { HumanMessage, SystemMessage } from 'langchain';
import { Pinecone } from '@pinecone-database/pinecone';

export const handleFaq: GraphNode<SupportStateType> = async (
  state,
  _config,
) => {
  //get the question from the state
  const question = state.customerQuestion;

  //INITIATE PINECONE
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY ?? '' });

  // 2. Create an index configured for use with a particular embedding model
  // const indexModel = await pc.indexes.createForModel({
  //   name: 'customer-support',
  //   cloud: 'aws',
  //   region: 'us-east-1',
  //   embed: {
  //     model: 'multilingual-e5-large',
  //     fieldMap: { text: 'chunk_text' },
  //   },
  //   waitUntilReady: true,
  // });

  // console.log('index model and host:', indexModel);

  // 3. Target the index
  const index = pc.index({
    host: 'https://soaring-alder-i72f43o.svc.aped-4627-b74a.pinecone.io',
  });

  // 5. Search for similar records using text queries
  // Pinecone handles embedding the query and optionally re-ranking results
  const searchResponse = await index.searchRecords({
    query: {
      inputs: { text: question },
      topK: 5,
    },
    rerank: {
      model: 'bge-reranker-v2-m3',
      topN: 2,
      rankFields: ['text'],
    },
  });

  console.log('PINECONE SEARCH RESPONSE:', searchResponse);

  return new Command({
    update: {
      response: '',
    },
  });
};
