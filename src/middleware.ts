
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of common file extensions and filenames targeted by scanners
const BLOCKED_PATTERNS = [
    '.php',
    '.env',
    'wp-login',
    'wp-admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block requests for common vulnerability scan targets
  for (const pattern of BLOCKED_PATTERNS) {
    if (pathname.includes(pattern)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Unexpected POST requests to the root path can be from health checks or scanners.
  // Replying with 200 OK satisfies them without crashing the application.
  if (request.method === 'POST' && pathname === '/') {
    return new NextResponse('OK', { status: 200 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*', // Apply this middleware to all routes
};
