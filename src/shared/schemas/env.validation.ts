import z from 'zod';

const Env_schema = z.object({
  PORT: z.coerce.number(),
  GOOGLE_API_KEY: z.string(),
  LANGSMITH_API_KEY: z.string(),
  // HF_API_KEY: z.string(),
  PINECONE_API_KEY: z.string(),
  PINECONE_HOST: z.string(),
  DATABASE_URL: z.url(),
  LANGGRAPH_API_URL: z.url(),
  HUMAN_ESCALATION_SERVICE_URL: z.url().optional(),
});

export type IEnv_schema = z.infer<typeof Env_schema>;

export function Env_validation(config: Record<string, unknown>) {
  const validation = Env_schema.safeParse({
    PORT: config.PORT,
    GOOGLE_API_KEY: config.GOOGLE_API_KEY,
    LANGSMITH_API_KEY: config.LANGSMITH_API_KEY,
    HF_API_KEY: config.HF_API_KEY,
    PINECONE_API_KEY: config.PINECONE_API_KEY,
    PINECONE_HOST: config.PINECONE_HOST,
    DATABASE_URL: config.DATABASE_URL,
    LANGGRAPH_API_URL: config.LANGGRAPH_API_URL,
    HUMAN_ESCALATION_SERVICE_URL: config.HUMAN_ESCALATION_SERVICE_URL,
  });
  if (!validation.success) {
    throw new Error(z.prettifyError(validation.error));
  }
  return validation.data;
}
