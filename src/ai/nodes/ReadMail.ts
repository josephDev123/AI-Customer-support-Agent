import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, interrupt, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';

import { type SupportStateType } from '../state';
import { getSupportModel } from '../model';

const LlmQuestionSchema = z.object({
  customerQuestion: z.string(),
  email: z.string(),
});

export const ReadCustomerQuestionNode: GraphNode<SupportStateType> = async (
  state,
) => {
  const model = await getSupportModel();

  const llmWithStructuredOutput = model.withStructuredOutput(LlmQuestionSchema);

  const result = await llmWithStructuredOutput.invoke([
    new SystemMessage(`
    You are a customer question content extractor.

Extract these fields from the customer's message:

- customerQuestion
- email

Rules:

1. customerQuestion must contain the customer's actual support question.
2. If the customer provides an email address, extract it exactly.
3. Do not invent an email address.
4. Return only the structured output.
  `),

    new HumanMessage(state.customerQuestion),
  ]);

  console.log('what was return form reading customer question', result);

  const emailSchema = z.email();

  let customerMail = result.email;

  if (!customerMail) {
    const providedEmail = interrupt({
      reason: 'Customer email is required',
    });

    customerMail = emailSchema.parse(providedEmail);
  }

  return new Command({
    update: {
      customerQuestion: result.customerQuestion,
      customerMail,
    },

    goto: 'analyzeSupportRequest',
  });
};
