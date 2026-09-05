// import { ChatOpenAI } from "@langchain/openai";
// import { wrapOpenAI } from "langsmith/wrappers";

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

let modelPromise: ReturnType<typeof initChatModel> | null = null;

export const getModel = () => {
  if (!modelPromise) {
    modelPromise = initChatModel('gpt-5.5', {
      configPrefix: 'https://models.github.ai/inference',
      modelProvider: 'openai',
      temperature: 0,
      timeout: 30_000,
      maxTokens: 512,
    });
  }

  return modelPromise;
};
