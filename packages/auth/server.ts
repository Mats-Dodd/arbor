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
    autoSignIn: true, // Automatically sign in after sign up
    requireEmailVerification: false, // Disable email verification for now
  },
  socialProviders: {
    // Add your social providers here if needed
    // github: {
    //   clientId: env.GITHUB_CLIENT_ID!,
    //   clientSecret: env.GITHUB_CLIENT_SECRET!,
    // },
  },
  plugins: [
    nextCookies(),
    // organization() // if you want to use organization plugin
  ],
  // Important: Set your app's base URL
  baseURL: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Optional: Add trusted origins for CORS
  trustedOrigins: [
    env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ],
});
