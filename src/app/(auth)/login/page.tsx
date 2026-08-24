"use client";

import Link from 'next/link';
import Image from 'next/image'; 
import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { signIn, getSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Call NextAuth's signIn method
      const res = await signIn('credentials', {
        redirect: false, 
        email, 
        password 
      });

      // 2. Handle login errors returned from NextAuth
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // 3. If login is successful, determine the redirect based on user role
      if (res?.ok) {
        setSuccess('Login successful! Redirecting...');
        
        // Fetch the session to get the user role securely
        const session = await getSession();
        const userRole = (session?.user as any)?.role;

        setTimeout(() => {
          // Role-Based Redirection (Simplified to Student and Lecturer)
          if (userRole === 'super_admin') {
            router.push('/admin');
          } else if (userRole === 'lecturer') {
            router.push('/lecturer'); // Redirecting to lecturer dashboard
          } else {
            router.push('/student'); // Default redirect for students
          }
        }, 1000);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage); 
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Please log in to your student portal</p>
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-50 p-3 rounded border border-green-100">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email / Student ID
              </label>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email or ID"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2 cursor-pointer" />
                <label htmlFor="remember" className="text-gray-600 cursor-pointer">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-black font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-4 disabled:opacity-70"
            >
              {loading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-black font-bold hover:underline">
              Sign Up
            </Link>
          </div>

        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden md:flex w-1/2 relative bg-slate-900 items-center justify-center flex-col text-center px-12">
        <div className="relative z-20 text-white flex flex-col items-center">
          <div className="mb-8">
              <Image 
                  src="/logo2.png" 
                  alt="Wise East University Logo"
                  width={100} 
                  height={100}
                  className="object-contain"
              />
          </div>
          <h1 className="text-4xl font-bold mb-4 uppercase tracking-wider">Wise East University</h1>
          <p className="text-lg font-light text-gray-300">
            Access your courses, grades, and campus resources. <br/> 
            Education is not just preparation for life &mdash; it is life itself.
          </p>
        </div>
      </div>

    </div>
  );
}