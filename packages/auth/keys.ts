import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      // Better Auth secret for signing sessions
      BETTER_AUTH_SECRET: z.string().min(32),
      // Database URL (if not using shared database config)
      DATABASE_URL: z.string().url().optional(),
      // Optional: Social provider secrets
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      // Optional: Email provider configuration
      EMAIL_FROM: z.string().email().optional(),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: z.string().optional(),
      SMTP_USER: z.string().optional(),
      SMTP_PASSWORD: z.string().optional(),
    },
    client: {
      // Public app URL for Better Auth
      NEXT_PUBLIC_APP_URL: z.string().url(),
    },
    runtimeEnv: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      EMAIL_FROM: process.env.EMAIL_FROM,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
  });
