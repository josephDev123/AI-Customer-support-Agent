import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, interrupt, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { type SupportStateType } from '../state';
import { getSupportModel } from '../model';
import { Runtime } from 'langchain';

const LlmQuestionSchema = z.object({
  customerQuestion: z.string(),
  email: z.string(),
});

const ConfigSchema = z.object({
  email: z.email(),
});

type IConfigSchema = z.infer<typeof ConfigSchema>;

export const ReadCustomerQuestionNode: GraphNode<
  SupportStateType,
  any
> = async (state, runtime) => {
  const namespace = ['mail'];
  const config = runtime?.configurable;
  const configEmail = config?.email;
  // console.log('context', config);

  if (!configEmail) {
    throw new Error('Customer mail is required');
  }

  // const store = runtime.store;
  // const storeMail = await store?.search(namespace);
  // const storeExtractedMail = storeMail
  //   ? storeMail[storeMail.length - 1].value?.mail
  //   : null;
  // console.log('store', storeExtractedMail);

  return new Command({
    update: {
      customerQuestion: state.customerQuestion,
    },

    goto: 'analyzeSupportRequest',
  });

  //   const model = await getSupportModel();

  //   const llmWithStructuredOutput = model.withStructuredOutput(LlmQuestionSchema);

  //   const result = await llmWithStructuredOutput.invoke([
  //     new SystemMessage(`
  //     You are a customer question content extractor.

  // Extract these fields from the customer's message:

  // - customerQuestion
  // - email

  // Rules:

  // 1. customerQuestion must contain the customer's actual support question.
  // 2. If the customer provides an email address, extract it exactly.
  // 3. Do not invent an email address.
  // 4. Return only the structured output.
  //   `),

  //     new HumanMessage(state.customerQuestion),
  //   ]);

  // const emailSchema = z.email();

  // let customerMail = result.email;
  // let customerMail = state.customerMail || result.email;

  // if (!customerMail) {
  //   const providedEmail = interrupt({
  //     reason: 'Customer email is required',
  //   });
  //   console.log('interupt :', providedEmail);

  // customerMail = emailSchema.parse(providedEmail);
  // const id = randomUUID();
  // await store?.put(namespace, id, { mail: providedEmail });
  // }

  // return new Command({
  //   update: {
  //     // customerQuestion: result.customerQuestion,
  //     // customerMail,
  //   },

  //   goto: 'analyzeSupportRequest',
  // });
};
