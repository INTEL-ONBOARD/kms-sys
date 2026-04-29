"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle the password reset form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Call the API to send a reset link
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Show success message if email is sent
      setMessage(data.message);
      setEmail(''); // Clear the input

    } catch (err) {
      // Handle error without using 'any' type to satisfy TypeScript strict rules
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Forgot Password Form Container */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Reset Password</h2>
            <p className="text-gray-500 text-sm">
              {/* Used &apos; instead of ' to avoid ESLint unescaped entity error */}
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Alert messages for status feedback */}
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-50 p-3 rounded border border-green-100">
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-4 disabled:opacity-70"
            >
              {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="text-black font-bold hover:underline">
              Back to Login
            </Link>
          </div>

        </div>
      </div>

      {/* Right Side - University Branding Section */}
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
            {/* Used &mdash; for the dash to keep the markup clean and professional */}
            Education is not just preparation for life &mdash; it is life itself.
          </p>
        </div>
      </div>

    </div>
  );
}