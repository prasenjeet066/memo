// middleware.ts - Next.js 16 compatible
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'bn', 'hi', 'ar', 'zh', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/account'];

// Auth routes that authenticated users shouldn't access
const AUTH_ROUTES = ['/login', '/register', '/signup', '/signin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }
  
  // Extract language from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLang = pathSegments[0];
  
  // Validate language
  let lang = DEFAULT_LANGUAGE;
  let restOfPath = pathname;
  
  if (potentialLang && SUPPORTED_LANGUAGES.includes(potentialLang)) {
    lang = potentialLang;
    restOfPath = '/' + pathSegments.slice(1).join('/');
  } else if (potentialLang && pathSegments.length > 0) {
    // Invalid language detected, redirect to default language
    const newPathname = `/${DEFAULT_LANGUAGE}${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = newPathname;
    return NextResponse.redirect(url);
  }
  
  // Get authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const isAuthenticated = !!token;
  
  // Normalize the rest of path for route matching
  const normalizedPath = restOfPath === '' ? '/' : restOfPath;
  
  // Check if the current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );
  
  // Check if the current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );
  
  // Handle unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/login`;
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Handle authenticated users trying to access auth routes
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    // Redirect to account page or home page
    url.pathname = `/${lang}/account`;
    return NextResponse.redirect(url);
  }
  
  // Add language to response headers for use in components
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  response.headers.set('Access-Control-Allow-Origin', '*') // Change '*' to specific domains if needed
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('x-current-lang', lang);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle OPTIONS requests for preflight checks
  if (request.method === 'OPTIONS') {
    return response // Return early for preflight requests
  }
  
  return response
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};