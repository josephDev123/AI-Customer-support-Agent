import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CustomerSupportService } from '../application/customer-support.service';

type IBodyPayload = {
  id: number;
  method: string;
  params: {
    input: {
      customerQuestion: string;
    };
    config: {
      configurable: {
        thread_id: string;
      };
    };
    assistant_id: string;
  };
};

type StreamBody = {
  input?: {
    customerQuestion?: unknown;
  };
  stream_mode?: unknown;
};

const STREAM_MODES = [
  'values',
  'updates',
  'messages',
  'tasks',
  'checkpoints',
] as const;

@Controller()
export class CustomerSupportController {
  constructor(
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  @Post('threads/:threadId/runs/stream')
  async streamRun(
    @Param('threadId') threadId: string,
    @Body() body: StreamBody,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const customerQuestion = body.input?.customerQuestion;

    if (
      !threadId.trim() ||
      typeof customerQuestion !== 'string' ||
      !customerQuestion.trim()
    ) {
      throw new BadRequestException(
        'threadId and input.customerQuestion are required',
      );
    }

    const streamMode = this.parseStreamModes(body.stream_mode);
    const abortController = new AbortController();
    const onRequestClose = () => abortController.abort();

    request.once('close', onRequestClose);
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    let eventId = 0;
    const writeEvent = (event: string, data: unknown) => {
      if (response.writableEnded || response.destroyed) return;
      response.write(
        `id: ${++eventId}\n` +
          `event: ${event}\n` +
          `data: ${JSON.stringify(data)}\n\n`,
      );
    };

    try {
      response.write(': connected\n\n');
      const stream = await this.customerSupportService.streamCustomerQuestion(
        { customerQuestion: customerQuestion.trim() },
        {
          threadId: threadId.trim(),
          streamMode,
          signal: abortController.signal,
        },
      );

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        if (
          Array.isArray(chunk) &&
          chunk.length === 2 &&
          typeof chunk[0] === 'string'
        ) {
          writeEvent(chunk[0], {
            thread_id: threadId,
            mode: chunk[0],
            data: chunk[1],
          });
        } else {
          writeEvent('values', { thread_id: threadId, data: chunk });
        }
      }

      if (!abortController.signal.aborted) {
        writeEvent('done', { thread_id: threadId });
      }
    } catch (error) {
      if (!abortController.signal.aborted && !response.writableEnded) {
        writeEvent('error', {
          thread_id: threadId,
          error: error instanceof Error ? error.message : 'Stream failed',
        });
      }
    } finally {
      request.off('close', onRequestClose);
      if (!response.writableEnded) response.end();
    }
  }

  @Post('agent/question')
  async askQuestion(@Body() body: IBodyPayload) {
    console.log(body);
    const payload = {
      customerQuestion: body.params.input.customerQuestion,
      threadId: 'id',
    };
    const result =
      await this.customerSupportService.handleCustomerQuestion(payload);
    return result;
  }

  private parseStreamModes(value: unknown) {
    if (value === undefined) {
      return ['values', 'updates', 'messages'] as Array<
        (typeof STREAM_MODES)[number]
      >;
    }

    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException('stream_mode must be a non-empty array');
    }

    const modes = value.filter(
      (mode): mode is (typeof STREAM_MODES)[number] =>
        typeof mode === 'string' &&
        (STREAM_MODES as readonly string[]).includes(mode),
    );

    if (modes.length !== value.length) {
      throw new BadRequestException(
        `stream_mode must contain only: ${STREAM_MODES.join(', ')}`,
      );
    }

    return modes;
  }
}
