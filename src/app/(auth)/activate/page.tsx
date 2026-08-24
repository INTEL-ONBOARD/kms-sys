"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ActivationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'needsPassword' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your activation link...');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);

  useEffect(() => {
    const initializeActivation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid activation link. No token found in the URL.');
        return;
      }

      try {
        // First, check if the user needs to set a password
        const checkRes = await fetch(`/api/auth/check-activation?token=${token}`);
        const checkData = await checkRes.json();

        if (!checkRes.ok) {
          throw new Error(checkData.message || 'Activation failed');
        }

        if (checkData.needsPassword) {
          setNeedsPasswordSet(true);
          setStatus('needsPassword');
          setMessage('Please set your password to complete activation.');
          return;
        }

        // If no password needed, auto-activate
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    setMessage('Activating your account...');

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Activation failed');
      }

      setStatus('success');
      setMessage('Your account has been successfully activated! You can now log in.');
    } catch (error) {
      setStatus('needsPassword');
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="mb-6 flex justify-center">
          <Image src="/logo2.png" alt="Wise East University Logo" width={80} height={80} className="object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-black mb-6">Account Activation</h2>

        {status === 'loading' && (
          <div className="text-blue-600 font-medium animate-pulse">{message}</div>
        )}

        {status === 'needsPassword' && (
          <div>
            <div className="mb-6 text-[#5A67D8] font-semibold bg-[#EEF2FF] p-4 rounded-lg border border-[#C7D2FE]">
              {message}
            </div>
            <form onSubmit={handleSetPassword} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
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
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300"
              >
                ACTIVATE ACCOUNT
              </button>
            </form>
          </div>
        )}

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
