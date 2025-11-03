// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NEXTAUTH_SECRET } from '@/lib/secret';
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'bn', 'hi', 'ar', 'zh', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

const PROTECTED_ROUTES = ['/account'];
const AUTH_ROUTES = ['/login', '/register', '/signup', '/signin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
  }
  
  // Skip static / api / internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Detect language prefix
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
  
  // --- Identify route types before auth check ---
  const isRoot = pathname === '/' || pathname === '';
  
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.endsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    restOfPath.startsWith(route)
  );
  
  // --- Auth token ---
  const token = await getToken({
    req: request,
    secret: NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;
  
  // --- Auth protection ---
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/login`;
    url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(url);
  }
  
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/account`;
    return NextResponse.redirect(url);
  }
  
  // --- Language redirect logic ---
  const isMissingLang = !SUPPORTED_LANGUAGES.includes(potentialLang);
  
  // ✅ Do NOT add lang prefix for auth routes or blank root
  if (isMissingLang && !isAuthRoute && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    return NextResponse.redirect(url);
  }
  
  // --- Add headers ---
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('x-current-lang', lang);
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
};