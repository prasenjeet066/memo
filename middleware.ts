// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'bn', 'hi', 'ar', 'zh', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

// Route groups
const PROTECTED_ROUTES = ['/account'];
const AUTH_ROUTES = ['/login', '/register', '/signup', '/signin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // --- Handle OPTIONS (CORS preflight) ---
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
  }
  
  // --- Skip internal/static/api files ---
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // --- Parse language from URL ---
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLang = pathSegments[0];
  let lang = DEFAULT_LANGUAGE;
  let restOfPath = pathname;
  
  if (potentialLang && SUPPORTED_LANGUAGES.includes(potentialLang)) {
    lang = potentialLang;
    restOfPath = '/' + pathSegments.slice(1).join('/');
  } else if (potentialLang && !SUPPORTED_LANGUAGES.includes(potentialLang)) {
    // Redirect unknown language to default
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    return NextResponse.redirect(url);
  }
  
  // --- Auth token ---
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;
  
  const normalizedPath = restOfPath === '' ? '/' : restOfPath;
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => normalizedPath.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => normalizedPath.startsWith(r));
  
  // --- Protect routes ---
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/login`;
    url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(url);
  }
  
  // --- Authenticated user visiting auth routes ---
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/account`;
    return NextResponse.redirect(url);
  }
  
  // --- Language normalization ---
  const isMissingLang = !SUPPORTED_LANGUAGES.includes(potentialLang);
  
  // ✅ এখানে শর্ত:
  // যদি route টা blank ('/') বা auth route হয়, তাহলে language prefix যোগ করো না।
  const isRoot = pathname === '/' || pathname === '';
  const shouldSkipLangPrefix = isAuthRoute || isRoot;
  
  if (isMissingLang && !shouldSkipLangPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    return NextResponse.redirect(url);
  }
  
  // --- Response headers ---
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