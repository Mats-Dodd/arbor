import { database } from '@repo/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { keys } from './keys';

const env = keys();

export const auth = betterAuth({
  database: prismaAdapter(database, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  plugins: [
    nextCookies(),
  ],
  baseURL: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ],
});
