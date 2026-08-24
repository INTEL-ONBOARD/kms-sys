"use client";

import { useEffect } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="p-6 max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-rose-100 shadow-sm text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
        <FiAlertCircle />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-gray-900">Dashboard Section Error</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          We encountered an issue loading this dashboard section. You can try refreshing the data below.
        </p>
      </div>

      {error?.message && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left font-mono text-[11px] text-gray-600 overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-xs"
        >
          <FiRefreshCw className="text-xs" /> Retry Section
        </button>
      </div>
    </div>
  );
}
