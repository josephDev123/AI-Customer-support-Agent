import { ChatOpenAI } from '@langchain/openai';

// export const model = new ChatOpenAI({
//   model: "openai/gpt-4.1",
//   apiKey: process.env.OPENAI_API_KEY!,
//   configuration: {
//     baseURL: "https://models.github.ai/inference",
//   },
//   temperature: 0.2,
//   maxTokens: 1000,
// });

import { initChatModel } from 'langchain';

// let modelPromise: ReturnType<typeof initChatModel> | null = null;

let modelPromise: ChatOpenAI | null = null;

// export const getSupportModel = () => {
//   if (!modelPromise) {
//     modelPromise = initChatModel('gpt-4.1', {
//       baseUrl: 'https://models.github.ai/inference',
//       apiKey: process.env.OPENAI_API_KEY,
//       modelProvider: 'openai',
//       temperature: 0,
//       timeout: 30_000,
//       maxTokens: 512,
//     });
//   }

//   return modelPromise;
// };

export const getSupportModel = () => {
  if (!modelPromise) {
    modelPromise = new ChatOpenAI({
      model: 'Qwen/Qwen3-4B-Instruct-2507:nscale',
      apiKey: process.env.HF_API_KEY!,
      configuration: {
        baseURL: 'https://router.huggingface.co/v1',
      },
      temperature: 0.2,
      maxTokens: 1000,
    });
  }

  return modelPromise;
};

// import { OpenAI } from "openai";

// const client = new OpenAI({
// 	baseURL: "https://router.huggingface.co/v1",
// 	apiKey: process.env.HF_TOKEN,
// });

// const chatCompletion = await client.chat.completions.create({
// 	model: "Qwen/Qwen3-4B-Instruct-2507:nscale",
//     messages: [
//         {
//             role: "user",
//             content: "What is the capital of France?",
//         },
//     ],
// });

// console.log(chatCompletion.choices[0].message);
