import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Get the NextAuth token from the request
  const token = await getToken({ 
    req, 
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET 
  });

  // 2. Define public auth routes
  const isPublicAuthRoute = 
    path === '/login' || 
    path === '/signup' || 
    path === '/forgot-password' || 
    path === '/activate';

  // 3. SECURE GUARD: If user is NOT logged in and trying to access a protected route
  if (!token && !isPublicAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. If user IS logged in and trying to access login/signup/auth pages
  if (token && isPublicAuthRoute) {
    if (token.role === 'super_admin' || token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    if (token.role === 'lecturer') {
      return NextResponse.redirect(new URL('/lecturer', req.url));
    }
    return NextResponse.redirect(new URL('/student', req.url));
  }

  // 5. Role-Based Access Control (RBAC) for protected routes
  if (token) {
    const isAdmin = token.role === "super_admin" || token.role === "admin";
    const isLecturer = token.role === "lecturer";

    // Protect Admin routes
    if (path.startsWith("/admin") && !isAdmin) {
      const redirectUrl = isLecturer ? '/lecturer' : '/student';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    
    // Protect Lecturer routes
    if (path.startsWith("/lecturer") && !isLecturer && !isAdmin) {
      return NextResponse.redirect(new URL('/student', req.url));
    }

    // Protect Student routes
    const isStudentSection = 
      path.startsWith("/student") ||
      path.startsWith("/courses") ||
      path.startsWith("/assignments") ||
      path.startsWith("/calendar") ||
      path.startsWith("/grades");

    if (isStudentSection && token.role !== "student" && !isAdmin) {
      const redirectUrl = isLecturer ? '/lecturer' : '/admin';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  // If all security checks pass, allow the request to proceed
  return NextResponse.next();
}

// Support backwards compatibility
export const middleware = proxy;

// Define URLs where Proxy executes
export const config = {
  matcher: [
    '/admin/:path*',
    '/lecturer/:path*',
    '/student/:path*',
    '/courses/:path*',
    '/courses',
    '/assignments/:path*',
    '/assignments',
    '/calendar/:path*',
    '/calendar',
    '/grades/:path*',
    '/grades',
    '/profile/:path*',
    '/profile',
    '/login',
    '/signup',
    '/forgot-password',
    '/activate',
  ], 
};
