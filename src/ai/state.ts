import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

export const CustomerInfo = z.object({
  content: z.string().min(1),
  email: z.email().nullable(),
});

export const SupportIntents = [
  'faq',
  'order_status',
  'refund',
  'payment',
  'account',
  'complaint',
  'bug_report',
  'feature_request',
  'human_agent',
  'unknown',
] as const;

export const SupportNextSteps = ['clarify-question', 'emit-result'] as const;

export const SupportIntentSchema = z.enum(SupportIntents);
export const SupportNextStepSchema = z.enum(SupportNextSteps);

export const SupportState = new StateSchema({
  // messages: MessagesValue,
  customerQuestion: CustomerInfo,
  intent: SupportIntentSchema.default('unknown'),
  confidence: z.number().min(0).max(1).default(0),
  needsClarification: z.boolean().default(false),
  clarificationPrompt: z.string().default(''),
  nextStep: SupportNextStepSchema.default('emit-result'),
});

export type SupportStateType = typeof SupportState.State;
export type SupportUpdateType = typeof SupportState.Update;
export type SupportIntent = z.infer<typeof SupportIntentSchema>;
export type SupportNextStep = z.infer<typeof SupportNextStepSchema>;
export type SupportCustomerInfo = z.infer<typeof CustomerInfo>;
