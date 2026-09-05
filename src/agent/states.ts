import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

export const AgentIntents = [
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

export const AgentNextSteps = [
  'clarify-question',
  'emit-result',
] as const;

export const AgentIntentSchema = z.enum(AgentIntents);
export const AgentNextStepSchema = z.enum(AgentNextSteps);

export const AgentState = new StateSchema({
  messages: MessagesValue,
  customerQuestion: z.string().min(1).default(''),
  intent: AgentIntentSchema.default('unknown'),
  confidence: z.number().min(0).max(1).default(0),
  needsClarification: z.boolean().default(false),
  clarificationPrompt: z.string().default(''),
  nextStep: AgentNextStepSchema.default('emit-result'),
});

export type AgentStateType = typeof AgentState.State;
export type AgentUpdateType = typeof AgentState.Update;
export type AgentIntent = z.infer<typeof AgentIntentSchema>;
export type AgentNextStep = z.infer<typeof AgentNextStepSchema>;
