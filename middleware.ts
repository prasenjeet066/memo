// ===== MIDDLEWARE: middleware.ts =====
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define supported locales
const locales = ['en', 'fr', 'es']
const defaultLocale = 'en'

// Public routes that don't require authentication (without locales)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  '/auth/signin',
  '/auth/error',
  '/auth/signout',
  '/auth/callback',
  '/auth/verify-request',
]

// Function to extract path without locale
function getPathWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    } else if (pathname === `/${locale}`) {
      return '/'
    }
  }
  return pathname
}

// Function to check if path is public
function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname)
  return publicRoutes.some(route => {
    // Exact match or starts with for nested routes
    return pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
  })
}

// Function to check if path should skip processing
function shouldSkipProcessing(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') || // Skip all NextAuth API routes
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions (images, fonts, etc.)
  )
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    
    // Skip processing for static files, API routes, etc.
    if (shouldSkipProcessing(pathname)) {
      return NextResponse.next()
    }
    
    // Check if pathname has any locale
    const pathnameHasLocale = locales.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
    
    // Redirect root path to default locale
    if (pathname === '/' && !pathnameHasLocale) {
      return NextResponse.redirect(
        new URL(`/${defaultLocale}`, req.url)
      )
    }
    
    // For paths without locale (except root), continue without redirect
    // This prevents infinite redirects for auth pages and other routes
    if (!pathnameHasLocale && pathname !== '/') {
      return NextResponse.next()
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow access to NextAuth API routes and static files
        if (shouldSkipProcessing(pathname)) {
          return true
        }
        
        const pathWithoutLocale = getPathWithoutLocale(pathname)
        
        // Allow access to public routes
        if (isPublicPath(pathWithoutLocale)) {
          return true
        }
        
        // Protect admin routes - require ADMIN role
        if (pathWithoutLocale.startsWith('/admin')) {
          return token?.role === 'ADMIN' || (Array.isArray(token?.role) && token.role.includes('ADMIN'))
        }
        
        // Protect create routes - require IP role
        if (pathWithoutLocale.startsWith('/create')) {
          return token?.role === 'IP' || (Array.isArray(token?.role) && token.role.includes('IP')) || !!token
        }
        
        // Protect account routes - require any authenticated user
        if (pathWithoutLocale.startsWith('/account')) {
          return !!token
        }
        
        // Protect user dashboard - require any authenticated user
        if (pathWithoutLocale.startsWith('/dashboard')) {
          return !!token
        }
        
        // Protect other API routes
        if (pathWithoutLocale.startsWith('/api/protected')) {
          return !!token
        }
        
        // Allow all other routes by default (change to !!token if you want to protect all routes)
        return true
      },
    },
    pages: {
      signIn: '/login', // Redirect to your login page
      error: '/auth/error',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static files)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}