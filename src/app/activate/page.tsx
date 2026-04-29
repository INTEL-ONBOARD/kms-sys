"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ActivationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Extract the token from the URL

  // States to manage the UI based on activation progress
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your activation link...');

  // Automatically call the API when the component mounts
  useEffect(() => {
    // Wrap all logic inside an async function to avoid synchronous state updates in the effect body
    const initializeActivation = async () => {
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid activation link. No token found in the URL.');
        return;
      }

      try {
        // Call our new activation API
        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Activation failed');
        }

        
        setStatus('success');
        setMessage('Your account has been successfully activated! You can now log in.');

      } catch (error) { 
        
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setMessage(errorMessage);
      }
    };

    
    initializeActivation();
  }, [token]); 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center">
        
        {/* University Logo */}
        <div className="mb-6 flex justify-center">
          <Image 
            src="/logo2.png" 
            alt="Wise East University Logo" 
            width={80} 
            height={80} 
            className="object-contain" 
          />
        </div>

        <h2 className="text-2xl font-bold text-black mb-6">Account Activation</h2>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-blue-600 font-medium animate-pulse">
            {message}
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div>
            <div className="mb-8 text-green-700 font-semibold bg-green-50 p-4 rounded-lg border border-green-200">
              {message}
            </div>
            <Link 
              href="/login" 
              className="inline-block w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300"
            >
              PROCEED TO LOGIN
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div>
            <div className="mb-8 text-red-600 font-semibold bg-red-50 p-4 rounded-lg border border-red-200">
              {message}
            </div>
            <Link 
              href="/signup" 
              className="inline-block w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300"
            >
              BACK TO SIGN UP
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-sans">Loading activation...</div>}>
      <ActivationContent />
    </Suspense>
  );
}