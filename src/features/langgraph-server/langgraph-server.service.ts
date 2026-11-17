import {
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@langchain/langgraph-sdk';
import type { StreamMode, ThreadState } from '@langchain/langgraph-sdk';
import type { SupportStateType } from '../../ai/state.js';

export interface LangGraphThread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

type SupportGraphInput = Pick<SupportStateType, 'customerQuestion'>;

@Injectable()
export class LangGraphServerService {
  private readonly logger = new Logger(LangGraphServerService.name);
  private readonly client: Client;

  constructor(configService: ConfigService) {
    this.client = new Client({
      apiUrl: configService.getOrThrow<string>('LANGGRAPH_API_URL'),
      apiKey: null,
      callerOptions: { maxRetries: 0 },
    });
  }

  async getGraphMetadata(): Promise<Record<string, unknown>> {
    try {
      const graph = await this.client.assistants.getGraph('agent', {
        signal: AbortSignal.timeout(10_000),
      });
      return { ...graph, graph_id: 'agent' };
    } catch (error) {
      throw this.toServiceUnavailable('retrieve graph metadata', error);
    }
  }

  async createThread(): Promise<LangGraphThread> {
    try {
      const thread = await this.client.threads.create({
        signal: AbortSignal.timeout(10_000),
      });
      return {
        thread_id: thread.thread_id,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        metadata: thread.metadata ?? {},
      };
    } catch (error) {
      throw this.toServiceUnavailable('create thread', error);
    }
  }

  async assertThreadExists(threadId: string): Promise<void> {
    try {
      await this.client.threads.get(threadId, {
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (this.getStatusCode(error) === 404) {
        throw new NotFoundException(`Thread ${threadId} was not found.`);
      }
      throw this.toServiceUnavailable('retrieve thread', error);
    }
  }

  async getThreadState(threadId: string): Promise<ThreadState> {
    try {
      return await this.client.threads.getState(threadId, undefined, {
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (this.getStatusCode(error) === 404) {
        throw new NotFoundException(`Thread ${threadId} was not found.`);
      }
      throw this.toServiceUnavailable('retrieve thread state', error);
    }
  }

  streamRun(
    threadId: string,
    input: SupportGraphInput,
    streamMode: StreamMode | StreamMode[],
    email: string,
  ): Promise<AsyncIterable<unknown>> {
    return Promise.resolve(
      this.streamRunEvents(threadId, input, streamMode, email),
    );
  }

  private async *streamRunEvents(
    threadId: string,
    input: SupportGraphInput,
    streamMode: StreamMode | StreamMode[],
    email: string,
  ): AsyncGenerator<unknown> {
    try {
      const stream = this.client.runs.stream(threadId, 'agent', {
        input,
        streamMode,
        config: { configurable: { email } },
        signal: AbortSignal.timeout(120_000),
      });
      for await (const event of stream) {
        yield event.data;
      }
    } catch (error) {
      this.logFailure('stream run', error);
      if (this.getStatusCode(error) === 404) {
        throw new NotFoundException(`Thread ${threadId} was not found.`);
      }
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException('LangGraph run timed out.');
      }
      if (error instanceof TypeError) {
        throw new ServiceUnavailableException(
          'LangGraph service is unavailable.',
        );
      }
      throw error;
    }
  }

  private toServiceUnavailable(operation: string, error: unknown) {
    this.logFailure(operation, error);
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    ) {
      return new GatewayTimeoutException(
        'The LangGraph service request timed out.',
      );
    }
    return new ServiceUnavailableException('LangGraph service is unavailable.');
  }

  private logFailure(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `Failed to ${operation} with LangGraph: ${message}`,
      error instanceof Error ? error.stack : undefined,
    );
  }

  private getStatusCode(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }
    if (
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'status' in error.response &&
      typeof error.response.status === 'number'
    ) {
      return error.response.status;
    }
    return undefined;
  }
}
