import { Command, GraphNode } from '@langchain/langgraph';
import { SupportStateType } from '../state.js';
import { Pinecone } from '@pinecone-database/pinecone';

export const handleFaq: GraphNode<SupportStateType> = async (
  state,
  _config,
) => {
  //get the question from the state
  const question = state.customerQuestion;

  //INITIATE PINECONE
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY ?? '' });

  // 3. Target the index
  const index = pc.index({
    host: process.env.PINECONE_HOST ?? '',
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

  const results = searchResponse.result.hits
    ? searchResponse.result.hits.map((hit) => {
        console.log('UTUTUTUTUTUUTUTUT', JSON.stringify(hit.fields));
        const answer = hit.fields as { source: string; text: string };
        return {
          source: answer.source,
          text: answer.text,
        };
      })
    : [];

  console.log('ANSWER RESULTS:', JSON.stringify(results));

  return new Command({
    update: {
      toolResult: {
        success: results.length > 0,
        data: results,
        error: results.length === 0 ? 'No relevant FAQs found.' : null,
      },
    },
  });
};
