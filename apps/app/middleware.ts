import { createAuthMiddleware } from '@repo/auth/middleware';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@repo/security/middleware';
import type { NextMiddleware, NextRequest, NextResponse } from 'next/server';
import { env } from './env';

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

// Create the auth middleware instance
const authMiddleware = createAuthMiddleware();

const middleware: NextMiddleware = async (request: NextRequest) => {
  // First, run auth middleware
  const authResponse = await authMiddleware(request);
  
  // If auth middleware returns a redirect (not authenticated), return it
  if (authResponse.status === 307 || authResponse.status === 302) {
    return authResponse;
  }

  // Then apply security headers
  return securityHeaders();
};

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
