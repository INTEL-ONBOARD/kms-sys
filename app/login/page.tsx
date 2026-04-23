"use client";

import Link from 'next/link';
import Image from 'next/image'; 
import { useState } from 'react';

export default function LoginPage() {
  // States to hold form data and response messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle the login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default page reload
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Call the Login API we created
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If the API returns an error (e.g., Invalid email or password)
        throw new Error(data.message || 'Login failed');
      }

      // If login is successful
      setSuccess('Login successful!');
      setEmail('');
      setPassword('');

    } catch (err: any) {
      setError(err.message); // Set the error message to display
    } finally {
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

          {/* Display error message if login fails */}
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded border border-red-100">
              {error}
            </div>
          )}

          {/* Display success message if login is successful */}
          {success && (
            <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-50 p-3 rounded border border-green-100">
              {success}
            </div>
          )}

          {/* Added onSubmit handler to the form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email / Student ID Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email / Student ID
              </label>
              <input 
                type="text" 
                value={email} // Bound to state
                onChange={(e) => setEmail(e.target.value)} // Update state on typing
                placeholder="Enter your email or ID"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password} // Bound to state
                onChange={(e) => setPassword(e.target.value)} // Update state on typing
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2 cursor-pointer" />
                <label htmlFor="remember" className="text-gray-600 cursor-pointer">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-black font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={loading} // Disable button while checking credentials
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-4 disabled:opacity-70"
            >
              {loading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          {/* Navigation link to Sign Up page added below the form */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
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
            Access your courses, grades, and campus resources. <br/> Education is not just preparation for life — it is life itself.
          </p>
        </div>
      </div>

    </div>
  );
}