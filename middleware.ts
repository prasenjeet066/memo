// ===== MIDDLEWARE: middleware.ts =====
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role?.includes('ADMIN') ?? false
        }
        
        if (req.nextUrl.pathname.startsWith('/create')){
          return token?.role?.includes('IP') ?? true
        }
        // Protect user dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*']
}