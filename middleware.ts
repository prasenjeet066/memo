// /middleware.ts
import { NextResponse, NextRequest } from 'next/server';

// Import your modular middleware functions
import { withAuth } from './middleware/withAuth';
import { withI18n } from './middleware/withI18n';
import { withLogging } from './middleware/withLogging';
import { withSecurityHeaders } from './middleware/withSecurityHeaders';
import { withGeoRedirection } from './middleware/withGeoRedirection';

// Create a middleware stack or chain
// This allows you to apply multiple middleware functions sequentially
type Middleware = (req: NextRequest) => NextResponse | Promise<NextResponse>;

const stackMiddlewares = (
  middlewares: Middleware[],
  index = 0
): Middleware => {
  const current = middlewares[index];
  if (current) {
    const next = stackMiddlewares(middlewares, index + 1);
    return async (req) => {
      const response = await current(req);
      if (response instanceof NextResponse) {
        return next(req); // Pass to the next middleware
      }
      return response; // If a middleware returns a response, stop the chain
    };
  }
  return () => NextResponse.next(); // End of the chain
};

// Define the order of your middleware
// Order matters! Authentication should generally come before other logic.
const middlewares: Middleware[] = [
  withLogging,
  withAuth,
  withI18n,
  withGeoRedirection,
  withSecurityHeaders,
];

// The main middleware function
export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Pass the request through the middleware stack
  const chainedMiddleware = stackMiddlewares(middlewares);
  const response = await chainedMiddleware(req);

  // If a middleware returned a response (e.g., a redirect), return it
  if (response instanceof NextResponse) {
    return response;
  }

  // Otherwise, continue to the next handler
  return NextResponse.next();
}

// Configuration for Next.js middleware matcher
// This tells Next.js which paths should be processed by this middleware.
export const config = {
  matcher: [
    // Apply middleware to all pages and API routes except static files, Next.js internal files, etc.
    '/((?!_next/static|_next/image|favicon.ico|api|images|sitemap.xml).*)',
  ],
};
