import { IEnv_schema } from '../shared/schemas/env.validation';

export const appConfig = () => ({
  PORT: Number(process.env.PORT),
  AGENT: {
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  },
  DATABASE_URL: process.env.DATABASE_URL,
});
