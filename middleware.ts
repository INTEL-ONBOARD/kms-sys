import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This is our route guard (Middleware)
export async function middleware(req: NextRequest) {
  // 1. Get the token from the browser cookies
  const token = req.cookies.get('token')?.value;
  const path = req.nextUrl.pathname;

  // 2. Define which routes are public and which need protection 
  const isPublicRoute = path === '/login' || path === '/signup' || path === '/forgot-password';
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/instructor') || path.startsWith('/student') || path.startsWith('/profile');

  // 3. If attempting to access a protected route without a token -> redirect directly to Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. If a token exists, verify its authenticity and handle Role-Based Access Control (RBAC)
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      
      // Verify the token and extract the payload (which contains the user role)
      const { payload } = await jwtVerify(token, secret);
      const userRole = payload.role as string;

      // 4.1 If a logged-in user tries to access public pages (like login), redirect them to their specific dashboard
      if (isPublicRoute) {
        if (userRole === 'super_admin') return NextResponse.redirect(new URL('/admin', req.url));
        if (userRole === 'instructor') return NextResponse.redirect(new URL('/instructor', req.url));
        return NextResponse.redirect(new URL('/student', req.url)); // Default fallback for students
      }

      // 4.2 Check permissions for protected routes
      if (isProtectedRoute) {
        // Prevent non-admins from accessing /admin routes
        if (path.startsWith('/admin') && userRole !== 'super_admin') {
          return NextResponse.redirect(new URL(`/${userRole === 'student' ? 'student' : userRole}`, req.url));
        }

        // Prevent non-instructors from accessing /instructor routes
        if (path.startsWith('/instructor') && userRole !== 'instructor') {
          // Send super admins to admin dashboard, students to student dashboard
          return NextResponse.redirect(new URL(`/${userRole === 'super_admin' ? 'admin' : 'student'}`, req.url));
        }

        // Prevent other roles from accessing specific /student routes
        if (path.startsWith('/student') && userRole !== 'student') {
          return NextResponse.redirect(new URL(`/${userRole === 'super_admin' ? 'admin' : 'instructor'}`, req.url));
        }
      }

      // If the token is valid and the user has the right permissions, allow access to the requested route
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

  // Allow unrestricted access to all other public routes (e.g., landing page)
  return NextResponse.next();
}

// Define the specific URLs where this Middleware should be executed
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/student/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
    '/forgot-password'
  ], 
};