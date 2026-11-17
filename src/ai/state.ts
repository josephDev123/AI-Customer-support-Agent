import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

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

const ToolResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().nullable(),
  error: z.string().nullable(),
});

export const SupportState = new StateSchema({
  // messages: MessagesValue,
  customerQuestion: z.string().min(1),
  // customerMail: z.email().optional(),
  intent: SupportIntentSchema.default('unknown'),
  confidence: z.number().min(0).max(1).default(0),
  needsClarification: z.boolean().default(false),
  missingInformation: z.array(z.string()),
  toolResult: ToolResultSchema.default({
    success: false,
    data: null,
    error: null,
  }),

  response: z.string().default(''),
});

export type SupportStateType = typeof SupportState.State;
export type SupportUpdateType = typeof SupportState.Update;
export type SupportIntent = z.infer<typeof SupportIntentSchema>;
export type SupportNextStep = z.infer<typeof SupportNextStepSchema>;
// export type SupportCustomerInfo = z.infer<typeof CustomerInfo>;

export const ConfigSchema = z.object({
  email: z.email(),
});

export type IConfigSchema = z.infer<typeof ConfigSchema>;

// josephuzuegbu55@gmail.com
// The product i bought is not working

// ('the product i bought is not working');

// ('the laptop model is Hp, it was purchased on 10-09-2026 and the issue with the laptop is, it is not booting. the order number is 0000055');

// CURL
// curl -i http://localhost:8123/health

// Then send a test question:

// curl -N -X POST http://localhost:8123/runs/stream \
//   -H "Content-Type: application/json" \
//   -d '{
//     "assistant_id": "agent",
//     "input": {
//       "customerQuestion": "How can I reset my password?"
//     },
//     "stream_mode": "values"
//   }'

// You should see streamed agent output containing the route and generated response.

// You can also use the non-streaming endpoint:

// curl -X POST http://localhost:8123/runs/wait \
//   -H "Content-Type: application/json" \
//   -d '{
//     "assistant_id": "agent",
//     "input": {
//       "customerQuestion": "What is your refund policy?"
//     }
//   }'
