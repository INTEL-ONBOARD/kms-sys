"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';


function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token'); // Get the token from the URL

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!token) {
      return setError('Invalid password reset link. Token is missing.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      // Handled error without using 'any' type
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Create New Password</h2>
            <p className="text-gray-500 text-sm">Your new password must be different from previous used passwords.</p>
          </div>

          {error && <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-50 p-3 rounded">{success}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || success !== ''}
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-4 disabled:opacity-70"
            >
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            <Link href="/login" className="text-black font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 relative bg-slate-900 items-center justify-center flex-col text-center px-12">
        <div className="relative z-20 text-white flex flex-col items-center">
            <div className="mb-8">
                <Image src="/logo2.png" alt="Wise East University Logo" width={100} height={100} className="object-contain" />
            </div>
          <h1 className="text-4xl font-bold mb-4 uppercase tracking-wider">Wise East University</h1>
          <p className="text-lg font-light text-gray-300">
            Access your courses, grades, and campus resources. <br/> 
            {/* Replaced unescaped dash with &mdash; */}
            Education is not just preparation for life &mdash; it is life itself.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense for Next.js 13+ compatibility
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}