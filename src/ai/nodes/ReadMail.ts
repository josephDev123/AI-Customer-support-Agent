import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, interrupt, type GraphNode } from '@langchain/langgraph';
import { z } from 'zod';

import { SupportState, type SupportStateType } from '../state';
import { getSupportModel } from '../model';

const LlmQuestionSchema = z.object({
  customerQuestion: z.string(),
  email: z.string().nullable(),
});

export const ReadCustomerQuestionNode: GraphNode<SupportStateType> = async (
  state,
) => {
  const model = getSupportModel();

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
3. If the customer does NOT provide an email address, email MUST be null.
4. Do not invent an email address.
5. Return only the structured output.
  `),

    new HumanMessage(state.customerQuestion.content),
  ]);

  console.log('what was return form reading customer question', result);

  if (!result.email) {
    interrupt({
      reason: 'Customer email is required',
    });
  }

  return new Command({
    update: {
      customerQuestion: {
        content: result.customerQuestion,
        email: result.email,
      },
    },

    goto: 'classify-intent',
  });
};
