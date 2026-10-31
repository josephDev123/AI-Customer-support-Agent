import z from 'zod';

const Env_schema = z.object({
  PORT: z.coerce.number(),
  LANGSMITH_API_KEY: z.string(),
  HF_API_KEY: z.string(),
  PINECONE_API_KEY: z.string(),
  PINECONE_HOST: z.string(),
  DATABASE_URL: z.url(),
});

export type IEnv_schema = z.infer<typeof Env_schema>;

export function Env_validation(config: Record<string, unknown>) {
  const validation = Env_schema.safeParse({
    PORT: config.PORT,
    LANGSMITH_API_KEY: config.LANGSMITH_API_KEY,
    HF_API_KEY: config.HF_API_KEY,
    PINECONE_API_KEY: config.PINECONE_API_KEY,
    PINECONE_HOST: config.PINECONE_HOST,
    DATABASE_URL: config.DATABASE_URL,
  });
  if (!validation.success) {
    throw new Error(z.prettifyError(validation.error));
  }
  return validation.data;
}
