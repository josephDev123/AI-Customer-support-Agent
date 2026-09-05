import { z } from 'zod';

export const CustomerQuestionSchema = z.object({
  question: z.string().trim().min(1),
});

export type CustomerQuestionDto = z.infer<typeof CustomerQuestionSchema>;
