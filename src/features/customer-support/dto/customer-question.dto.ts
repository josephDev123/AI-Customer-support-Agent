import { z } from 'zod';

export const CustomerQuestionSchema = z.object({
  customerQuestion: z.string().trim().min(1),
  threadId: z.string().trim().min(1).optional(),
});

export type CustomerQuestionDto = z.infer<typeof CustomerQuestionSchema>;

export const CreateHumanEscalationTicketSchema = z.object({
  customerEmail: z.email(),
  customerQuestion: z.string().trim().min(1),
  intent: z.string().trim().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type CreateHumanEscalationTicketDto = z.infer<
  typeof CreateHumanEscalationTicketSchema
>;
