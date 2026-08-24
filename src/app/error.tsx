"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Application Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-sm border border-rose-100">
          <FiAlertTriangle />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900">Something went wrong</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-left font-mono text-[11px] text-gray-600 overflow-x-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FiRefreshCw className="text-sm" /> Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <FiHome className="text-sm" /> Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
