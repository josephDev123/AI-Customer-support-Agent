import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type AgentStateType } from '../states';

export type AgentRunRecord = {
  id: string;
  question: string;
  createdAt: string;
  result?: AgentStateType;
};

export const AGENT_REPOSITORY = Symbol('AGENT_REPOSITORY');

export abstract class AgentRepository {
  abstract createRun(question: string): Promise<AgentRunRecord>;
  abstract saveRun(record: AgentRunRecord): Promise<AgentRunRecord>;
}

@Injectable()
export class InMemoryAgentRepository implements AgentRepository {
  private readonly runs = new Map<string, AgentRunRecord>();

  async createRun(question: string): Promise<AgentRunRecord> {
    const record: AgentRunRecord = {
      id: randomUUID(),
      question,
      createdAt: new Date().toISOString(),
    };

    this.runs.set(record.id, record);
    return record;
  }

  async saveRun(record: AgentRunRecord): Promise<AgentRunRecord> {
    this.runs.set(record.id, record);
    return record;
  }
}
