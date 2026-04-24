import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This is our route guard (Middleware)
export async function middleware(req: NextRequest) {
  // 1. Get the token from the browser cookies
  const token = req.cookies.get('token')?.value;

  // 2. Define which routes need protection 
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');

  // 3. If attempting to access a protected route without a token -> redirect directly to Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. If a token exists, verify its authenticity and ensure it hasn't expired
  if (isProtectedRoute && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      
      // If the token is valid, allow access to the requested route
      return NextResponse.next();
    } catch (error) {
      // If the token is invalid, tampered with, or expired
      console.error('Invalid token:', error);
      
      // Delete the invalid cookie and redirect the user back to the Login page
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Allow unrestricted access to all other public routes
  return NextResponse.next();
}

// Define the specific URLs where this Middleware should be executed
export const config = {
  matcher: ['/dashboard/:path*'], 
};