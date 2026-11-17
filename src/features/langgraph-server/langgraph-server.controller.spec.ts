import { NotFoundException } from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { LangGraphServerController } from './langgraph-server.controller.js';
import { LangGraphServerService } from './langgraph-server.service.js';

jest.mock('./langgraph-server.service.js', () => ({
  LangGraphServerService: class LangGraphServerService {},
}));

describe('LangGraphServerController', () => {
  let app: INestApplication<App>;
  const service = {
    getGraphMetadata: jest.fn(),
    createThread: jest.fn(),
    getThreadState: jest.fn(),
    assertThreadExists: jest.fn(),
    streamRun: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service.getGraphMetadata.mockResolvedValue({
      graph_id: 'agent',
      nodes: [],
      edges: [],
    });
    service.createThread.mockReturnValue({
      thread_id: 'e14d3ef8-9d69-4a63-99ea-451e04a3fabb',
      created_at: '2026-11-14T00:00:00.000Z',
      updated_at: '2026-11-14T00:00:00.000Z',
      metadata: {},
    });
    service.getThreadState.mockResolvedValue({ values: {} });
    service.assertThreadExists.mockReturnValue({});
    service.streamRun.mockResolvedValue(
      (function* () {
        yield { response: 'A helpful answer.' };
      })(),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [LangGraphServerController],
      providers: [{ provide: LangGraphServerService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns graph metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/assistants/agent/graph')
      .expect(200);

    expect(response.body).toEqual({
      graph_id: 'agent',
      nodes: [],
      edges: [],
    });
    expect(service.getGraphMetadata).toHaveBeenCalled();
  });

  it('creates a thread', async () => {
    const response = await request(app.getHttpServer())
      .post('/threads')
      .expect(201);

    const thread: unknown = response.body;
    expect(thread).toMatchObject({
      thread_id: 'e14d3ef8-9d69-4a63-99ea-451e04a3fabb',
      created_at: '2026-11-14T00:00:00.000Z',
    });
  });

  it('returns the saved state for a thread', async () => {
    const response = await request(app.getHttpServer())
      .get('/threads/thread-123/state')
      .expect(200);

    expect(response.body).toEqual({ values: {} });
    expect(service.getThreadState).toHaveBeenCalledWith('thread-123');
  });

  it('streams graph chunks and forwards input, mode, and email', async () => {
    const response = await request(app.getHttpServer())
      .post('/threads/thread-123/runs/stream')
      .send({
        input: { customerQuestion: 'Where is my order?' },
        config: { configurable: { email: 'customer@example.com' } },
      })
      .buffer(true)
      .parse((res, callback) => {
        const chunks: string[] = [];
        res.on('data', (chunk) => chunks.push(String(chunk)));
        res.on('end', () => callback(null, chunks.join('')));
      })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);

    expect(response.body).toContain(
      `data: ${JSON.stringify({ response: 'A helpful answer.' })}\n\n`,
    );
    expect(response.body).toContain('data: [DONE]\n\n');
    expect(service.streamRun).toHaveBeenCalledWith(
      'thread-123',
      { customerQuestion: 'Where is my order?' },
      'values',
      'customer@example.com',
    );
  });

  it('returns 404 for an unknown thread before opening the stream', async () => {
    service.assertThreadExists.mockImplementation(() => {
      throw new NotFoundException();
    });

    await request(app.getHttpServer())
      .post('/threads/unknown/runs/stream')
      .send({
        input: { customerQuestion: 'Where is my order?' },
        config: { configurable: { email: 'customer@example.com' } },
      })
      .expect(404);

    expect(service.streamRun).not.toHaveBeenCalled();
  });

  it('sends graph failures as SSE error data', async () => {
    service.streamRun.mockRejectedValue(new Error('Graph failed.'));

    const response = await request(app.getHttpServer())
      .post('/threads/thread-123/runs/stream')
      .send({
        input: { customerQuestion: 'Where is my order?' },
        config: { configurable: { email: 'customer@example.com' } },
      })
      .buffer(true)
      .parse((res, callback) => {
        const chunks: string[] = [];
        res.on('data', (chunk) => chunks.push(String(chunk)));
        res.on('end', () => callback(null, chunks.join('')));
      })
      .expect(200);

    expect(response.body).toContain(
      `data: ${JSON.stringify({ error: 'Graph failed.' })}\n\n`,
    );
  });
});
