import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:02071974@localhost:33000/nest_test',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? '',
  JWT_REFRESH_SECRET: process.env.JWT_ACCESS_SECRET ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
