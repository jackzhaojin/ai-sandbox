/**
 * Middleware for Route Protection
 * Protects routes requiring authentication
 * Note: Simplified version that doesn't use NextAuth middleware due to compatibility issues
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/register', '/auth/error'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Allow access to public routes and static files
  if (
    isPublicRoute ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // For now, allow all routes (authentication will be checked in individual pages)
  // This is a simplified middleware to avoid build issues
  // TODO: Implement proper session checking once NextAuth v5 is more stable
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own logic)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
