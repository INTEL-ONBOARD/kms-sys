import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Get the NextAuth token from the request
  // IMPORTANT: We explicitly pass the secret to ensure it can decrypt the token correctly
  const token = await getToken({ 
    req, 
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET 
  });

  // 2. Define our routes
  const isPublicAuthRoute = path === '/login' || path === '/signup' || path === '/forgot-password';

  // 3. SECURE GUARD: If user is NOT logged in and trying to access a protected route
  if (!token && !isPublicAuthRoute) {
    // Redirect them immediately to the login page
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. If user IS logged in and trying to access login/signup pages
  if (token && isPublicAuthRoute) {
    if (token.role === 'super_admin') return NextResponse.redirect(new URL('/admin', req.url));
    if (token.role === 'lecturer') return NextResponse.redirect(new URL('/lecturer', req.url));
    return NextResponse.redirect(new URL('/student', req.url)); // Default fallback
  }

  // 5. Role-Based Access Control (RBAC) for protected routes
  if (token) {
    // Protect Admin routes
    if (path.startsWith("/admin") && token.role !== "super_admin") {
      const redirectUrl = token.role === 'lecturer' ? '/lecturer' : '/student';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    
    // Protect Lecturer routes
    if (path.startsWith("/lecturer") && token.role !== "lecturer") {
      const redirectUrl = token.role === 'super_admin' ? '/admin' : '/student';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // Protect Student routes
    if (path.startsWith("/student") && token.role !== "student") {
      const redirectUrl = token.role === 'super_admin' ? '/admin' : '/lecturer';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  // If all security checks pass, allow the request to proceed!
  return NextResponse.next();
}

// Define the specific URLs where this Middleware should be executed
export const config = {
  matcher: [
    '/admin/:path*',
    '/lecturer/:path*',
    '/student/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
    '/forgot-password'
  ], 
};