import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from './server';

/**
 * Check if a route should be protected
 */
const isProtectedRoute = (pathname: string) => {
  // Add your protected routes here
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  return protectedRoutes.some(route => pathname.startsWith(route));
};

/**
 * Better Auth middleware for Next.js
 * This middleware checks session status for protected routes
 */
export const createAuthMiddleware = () => {
  return async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    // Skip auth check for non-protected routes
    if (!isProtectedRoute(pathname)) {
      return NextResponse.next();
    }

    try {
      // Get session from Better Auth
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // If no session and trying to access protected route, redirect to sign-in
      if (!session) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Session exists, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      // On error, redirect to sign-in as a safety measure
      const signInUrl = new URL('/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }
  };
};
