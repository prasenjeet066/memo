import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'
import { NEXTAUTH_SECRET } from '@/lib/auth/secret'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request as any, secret: NEXTAUTH_SECRET })
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/')
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-auth-status', token ? 'authenticated' : 'unauthenticated')
  
  // Handle auth pages (prevent authenticated users from accessing login/register)
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Super access route protection
  const isSuperAccessRoute = request.nextUrl.pathname.startsWith('/super-access')
  
  if (isSuperAccessRoute) {
    // Check if user is not logged in
    if (!token) {
      const signInUrl = new URL('/auth/sign-in', request.url)
      signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    // Check if user doesn't have superAccess role
    if (!token.superAccess || !token.superAccess.role) {
      // Redirect to unauthorized page or home page
      return NextResponse.redirect(new URL('/', request.url))
      // Or redirect to home: return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Protected routes logic
  const isProtectedRoute = [
    '/dashboard',
    '/profile',
    '/settings',
    // Add more protected routes here
  ].some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // Set CORS headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  response.headers.set('Access-Control-Allow-Origin', '*') // Change '*' to specific domains if needed
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle OPTIONS requests for preflight checks
  if (request.method === 'OPTIONS') {
    return response // Return early for preflight requests
  }
  
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/auth/:path*',
    '/super-access/:path*', // Added super-access to matcher
    // Add more paths that need middleware protection
  ]
}