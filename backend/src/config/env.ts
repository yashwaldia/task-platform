import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// backend/src/config/env.ts — what it should read
export const env = {
  NODE_ENV:              process.env.NODE_ENV ?? 'development',
  PORT:                  Number(process.env.PORT) || 4000,
  MONGO_URI:             process.env.MONGO_URI!,
  JWT_ACCESS_SECRET:     process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET:    process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  FRONTEND_URL:          process.env.FRONTEND_URL ?? 'http://localhost:5173',
  BCRYPT_ROUNDS:         Number(process.env.BCRYPT_ROUNDS) || 10,
  RATE_LIMIT_WINDOW_MS:  Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX:        Number(process.env.RATE_LIMIT_MAX) || 100,
} as const;


export type Env = typeof env;
