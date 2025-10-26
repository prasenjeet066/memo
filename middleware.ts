// middleware.ts - Next.js 16 compatible
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'bn', 'hi', 'ar', 'zh', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

// Protected and auth routes
const PROTECTED_ROUTES = ['/account'];
const AUTH_ROUTES = ['/login', '/register', '/signup', '/signin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Early handle OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
  
  // Skip static / API / internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Extract and validate language
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLang = pathSegments[0];
  let lang = DEFAULT_LANGUAGE;
  let restOfPath = pathname;
  
  if (potentialLang && SUPPORTED_LANGUAGES.includes(potentialLang)) {
    lang = potentialLang;
    restOfPath = '/' + pathSegments.slice(1).join('/');
  } else if (potentialLang && !SUPPORTED_LANGUAGES.includes(potentialLang)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    return NextResponse.redirect(url);
  }
  
  // Get auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const isAuthenticated = !!token;
  const normalizedPath = restOfPath === '' ? '/' : restOfPath;
  
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => normalizedPath.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => normalizedPath.startsWith(route));
  
  // Unauthenticated user accessing protected route
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/login`;
    url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(url);
  }
  
  // Authenticated user accessing auth routes
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/account`;
    return NextResponse.redirect(url);
  }
  
  // Build response with CORS and language headers
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('x-current-lang', lang);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};