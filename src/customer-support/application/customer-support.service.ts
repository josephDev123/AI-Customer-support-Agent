import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { HumanMessage } from '@langchain/core/messages';
import { CustomerQuestionSchema } from '../dto/customer-question.dto';
import {
  CUSTOMER_SUPPORT_REPOSITORY,
  type CustomerSupportRepository,
} from '../infrastructure/customer-support.repository';
import { supportGraph } from '../../ai/graph';
// import { SupportCustomerInfo, type SupportStateType } from '../../ai/state';

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

    const { question, threadId } = parsed.data;
    const run = await this.customerSupportRepository.createRun(
      question,
      threadId ?? randomUUID(),
    );

    const initialState =
      'I was charged twice for my subscription! This is urgent!';

    const result = await supportGraph.invoke({
      customerQuestion: initialState,
    });

    await this.customerSupportRepository.saveRun({
      ...run,
      result,
    });

    return {
      runId: run.id,
      ...result,
    };
  }
}
