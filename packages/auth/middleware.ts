import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from './server';


const isProtectedRoute = (pathname: string) => {
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  return protectedRoutes.some(route => pathname.startsWith(route));
};


export const createAuthMiddleware = () => {
  return async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    if (!isProtectedRoute(pathname)) {
      return NextResponse.next();
    }

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      const signInUrl = new URL('/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }
  };
};
