
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
