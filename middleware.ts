// ===== MIDDLEWARE: middleware.ts =====
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define supported locales
const locales = ['en', 'fr', 'es'] // Add your supported locales here
const defaultLocale = 'en'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  // Add other public routes here
]

// Function to check if path is public
function isPublicPath(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === `/${defaultLocale}${route}` ||
    pathname === route ||
    locales.some(locale => pathname === `/${locale}${route}`)
  )
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

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    
    // Handle locale detection and redirection
    const pathnameHasLocale = locales.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
    
    // Redirect to default locale if no locale is present and path is not an API route
    if (!pathnameHasLocale && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
      const locale = defaultLocale
      return NextResponse.redirect(
        new URL(`/${locale}${pathname === '/' ? '' : pathname}`, req.url)
      )
    }
    
    // Add any additional middleware logic here
    // For example, you can add headers, modify responses, etc.
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const pathWithoutLocale = getPathWithoutLocale(pathname)
        
        // Check if the path is public
        if (isPublicPath(pathWithoutLocale) || isPublicPath(pathname)) {
          return true
        }
        
        // Protect admin routes
        if (pathWithoutLocale.startsWith('/admin') || pathname.startsWith('/admin')) {
          return token?.role?.includes('ADMIN') ?? false
        }
        
        // Protect create routes
        if (pathWithoutLocale.startsWith('/create') || pathname.startsWith('/create')) {
          return token?.role?.includes('IP') ?? true
        }
        
        // Protect account routes
        if (pathWithoutLocale.startsWith('/account') || pathname.startsWith('/account')) {
          return !!token
        }
        
        // Protect user dashboard
        if (pathWithoutLocale.startsWith('/dashboard') || pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        // Protect API routes
        if (pathWithoutLocale.startsWith('/api/protected') || pathname.startsWith('/api/protected')) {
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
    // Match all paths except static files and API routes without protected prefix
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    
    // Specific protected routes (kept for backward compatibility)
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*',
    '/create/:path*',
    '/account/:path*'
  ]
}