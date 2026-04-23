"use client"; 

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function SignupPage() {
  // State variables to hold form data and UI states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default page reload
    setError('');
    setSuccess('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Call our new Signup API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // If successful, show message and clear form
      setSuccess('Account created successfully! You can now log in.');
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 font-sans">
      
      {/* Left Side - Registration Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-black mb-2">Create an Account</h2>
            <p className="text-gray-500 text-sm">Join the Wise East University student portal</p>
          </div>

          {/* Show error or success messages */}
          {error && <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
          {success && <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-50 p-2 rounded">{success}</div>}

          {/* Connect the form to our handleSubmit function */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            {/* Change button text while loading */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-6 disabled:opacity-70"
            >
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-black font-bold hover:underline">
              Log In
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