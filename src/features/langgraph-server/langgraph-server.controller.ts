import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RunStreamRequestSchema } from './dto/run-stream.dto.js';
import { LangGraphServerService } from './langgraph-server.service.js';

@Controller()
export class LangGraphServerController {
  constructor(
    private readonly langGraphServerService: LangGraphServerService,
  ) {}

  @Get('assistants/agent/graph')
  getGraphMetadata() {
    return this.langGraphServerService.getGraphMetadata();
  }

  @Post('threads')
  createThread() {
    return this.langGraphServerService.createThread();
  }

  @Get('threads/:thread_id/state')
  getThreadState(@Param('thread_id') threadId: string) {
    return this.langGraphServerService.getThreadState(threadId);
  }

  @Post('threads/:thread_id/runs/stream')
  @HttpCode(HttpStatus.OK)
  async streamRun(
    @Param('thread_id') threadId: string,
    @Body() body: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const parsed = RunStreamRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    await this.langGraphServerService.assertThreadExists(threadId);

    response.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    response.flushHeaders();

    const { input, streamMode, config } = parsed.data;
    try {
      const stream = await this.langGraphServerService.streamRun(
        threadId,
        input,
        streamMode,
        config.configurable.email,
      );
      for await (const chunk of stream) {
        response.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      response.write('data: [DONE]\n\n');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      response.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      response.end();
    }
  }
}
