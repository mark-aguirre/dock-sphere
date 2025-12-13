import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserService } from '../database';
import { logger } from '../logger';

/**
 * Enhanced authentication middleware that checks database registration
 */
export async function authMiddleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Allow access to auth pages and public assets
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // If no token, redirect to sign in
  if (!token || !token.email) {
    logger.debug('No token found, redirecting to sign in', { pathname });
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check if user is registered and active in database
  try {
    const isRegistered = await UserService.isUserRegistered(token.email as string);
    
    if (!isRegistered) {
      logger.warn('Unregistered user blocked from accessing:', { 
        email: token.email, 
        pathname 
      });
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    // User is authenticated and registered, allow access
    logger.debug('Authenticated user accessing:', { 
      email: token.email, 
      pathname 
    });
    
    // Add headers to prevent caching of authenticated responses
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    logger.error('Error in auth middleware:', { 
      email: token.email, 
      pathname, 
      error: error instanceof Error ? error.message : String(error)
    });
    
    // For API routes, return JSON error instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }
    
    // On database error, redirect to sign in to be safe
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('error', 'DatabaseError');
    return NextResponse.redirect(signInUrl);
  }
}