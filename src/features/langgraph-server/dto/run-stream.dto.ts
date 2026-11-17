import { z } from 'zod';

const StreamModeSchema = z.union([
  z.enum([
    'values',
    'updates',
    'debug',
    'messages',
    'checkpoints',
    'tasks',
    'custom',
    'tools',
  ]),
  z.array(
    z.enum([
      'values',
      'updates',
      'debug',
      'messages',
      'checkpoints',
      'tasks',
      'custom',
      'tools',
    ]),
  ),
]);

export const RunStreamRequestSchema = z.object({
  input: z.object({
    customerQuestion: z.string().trim().min(1),
  }),
  streamMode: StreamModeSchema.default('values'),
  config: z.object({
    configurable: z.object({
      email: z.email(),
    }),
  }),
});

export type RunStreamRequest = z.infer<typeof RunStreamRequestSchema>;
