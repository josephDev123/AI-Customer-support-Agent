import { ChatOpenAI } from '@langchain/openai';
import { initChatModel } from 'langchain';

// let modelPromise: ChatOpenAI | null = null;

// export const getSupportModel = () => {
//   if (!modelPromise) {
//     modelPromise = new ChatOpenAI({
//       model: 'Qwen/Qwen3-4B-Instruct-2507:nscale',
//       apiKey: process.env.HF_API_KEY!,
//       configuration: {
//         baseURL: 'https://router.huggingface.co/v1',
//       },
//       temperature: 0.2,
//       maxTokens: 1000,
//     });
//   }

//   return modelPromise;
// };

export async function getSupportModel() {
  const model = await initChatModel('google:gemini-3.5-flash-lite');
  return model;
}
