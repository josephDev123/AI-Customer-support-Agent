import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type SupportStateType } from '../../../ai/state';

export type CustomerSupportRunRecord = {
  id: string;
  threadId: string;
  question: string;
  createdAt: string;
  result?: SupportStateType;
};

export const CUSTOMER_SUPPORT_REPOSITORY = Symbol(
  'CUSTOMER_SUPPORT_REPOSITORY',
);

export abstract class CustomerSupportRepository {
  abstract createRun(
    question: string,
    threadId: string,
  ): Promise<CustomerSupportRunRecord>;
  abstract saveRun(
    record: CustomerSupportRunRecord,
  ): Promise<CustomerSupportRunRecord>;
}

@Injectable()
export class InMemoryCustomerSupportRepository implements CustomerSupportRepository {
  private readonly runs = new Map<string, CustomerSupportRunRecord>();

  async createRun(
    question: string,
    threadId: string,
  ): Promise<CustomerSupportRunRecord> {
    const record: CustomerSupportRunRecord = {
      id: randomUUID(),
      threadId,
      question,
      createdAt: new Date().toISOString(),
    };

    this.runs.set(record.id, record);
    return record;
  }

  async saveRun(
    record: CustomerSupportRunRecord,
  ): Promise<CustomerSupportRunRecord> {
    this.runs.set(record.id, record);
    return record;
  }
}
