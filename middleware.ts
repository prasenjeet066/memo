// ===== MIDDLEWARE: middleware.ts =====
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define supported locales
const locales = ['en', 'fr', 'es'] // Add your supported locales here
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
  // Add other public routes here
]

// Function to check if path is public
function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname)
  return publicRoutes.some(route => pathWithoutLocale === route)
}

// Function to extract path without locale
function getPathWithoutLocale(pathname: string): string {
  // Remove locale prefix if present
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) // Remove '/en/' etc.
    } else if (pathname === `/${locale}`) {
      return '/'
    }
  }
  return pathname
}

// Function to check if path should skip locale processing
function shouldSkipLocaleProcessing(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    /\..*$/.test(pathname) // Files with extensions
  )
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    
    // Skip locale processing for static files, API routes, etc.
    if (shouldSkipLocaleProcessing(pathname)) {
      return NextResponse.next()
    }
    
    // Check if pathname has any locale
    const pathnameHasLocale = locales.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
    
    // Redirect to default locale only for root path without locale
    if (!pathnameHasLocale && pathname === '/') {
      return NextResponse.redirect(
        new URL(`/${defaultLocale}`, req.url)
      )
    }
    
    // For other paths without locale, let Next.js handle them
    // This prevents infinite redirects
    if (!pathnameHasLocale && pathname !== '/') {
      return NextResponse.next()
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Skip auth for static files and API routes (except protected ones)
        if (shouldSkipLocaleProcessing(pathname)) {
          return true
        }
        
        const pathWithoutLocale = getPathWithoutLocale(pathname)
        
        // Check if the path is public
        if (isPublicPath(pathWithoutLocale)) {
          return true
        }
        
        // Protect admin routes
        if (pathWithoutLocale.startsWith('/admin')) {
          return token?.role?.includes('ADMIN') ?? false
        }
        
        // Protect create routes
        if (pathWithoutLocale.startsWith('/create')) {
          return token?.role?.includes('IP') ?? true
        }
        
        // Protect account routes
        if (pathWithoutLocale.startsWith('/account')) {
          return !!token
        }
        
        // Protect user dashboard
        if (pathWithoutLocale.startsWith('/dashboard')) {
          return !!token
        }
        
        // Protect API routes
        if (pathWithoutLocale.startsWith('/api/protected')) {
          return !!token
        }
        
        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Match all paths except static files and specific excluded paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ]
}