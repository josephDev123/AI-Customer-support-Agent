export const appConfig = () => ({
  PORT: Number(process.env.PORT),
  LANGGRAPH_API_URL: process.env.LANGGRAPH_API_URL,
  AGENT: {
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  },

  // DB
  DATABASE_URL: process.env.DATABASE_URL,
});
