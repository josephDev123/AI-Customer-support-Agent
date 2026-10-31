import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { HumanMessage } from '@langchain/core/messages';
import { CustomerQuestionSchema } from '../dto/customer-question.dto';
import {
  CUSTOMER_SUPPORT_REPOSITORY,
  type CustomerSupportRepository,
} from '../infrastructure/customer-support.repository';
import { supportGraph } from '../../../ai/graph';

export type SupportStreamInput = {
  customerQuestion: string;
};

export type SupportStreamOptions = {
  threadId: string;
  streamMode?: Array<
    'values' | 'updates' | 'messages' | 'tasks' | 'checkpoints'
  >;
  signal?: AbortSignal;
};

@Injectable()
export class CustomerSupportService {
  constructor(
    @Inject(CUSTOMER_SUPPORT_REPOSITORY)
    private readonly customerSupportRepository: CustomerSupportRepository,
  ) {}

  async handleCustomerQuestion(payload: unknown) {
    const parsed = CustomerQuestionSchema.safeParse(payload);

    if (!parsed.success) {
      throw new BadRequestException('question is required');
    }

    const { customerQuestion, threadId } = parsed.data;

    const result = await supportGraph.invoke(
      {
        customerQuestion: customerQuestion,
      },
      { configurable: { thread_id: threadId } },
    );
    return result;
  }

  async streamCustomerQuestion(
    input: SupportStreamInput,
    options: SupportStreamOptions,
  ): Promise<AsyncIterable<unknown>> {
    return supportGraph.stream(input, {
      configurable: { thread_id: options.threadId },
      streamMode: options.streamMode ?? ['values', 'updates', 'messages'],
      signal: options.signal,
    });
  }
}
