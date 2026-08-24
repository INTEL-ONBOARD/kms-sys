import Link from "next/link";
import { FiSearch, FiHome, FiArrowLeft } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gray-50/50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-3xl mx-auto shadow-sm border border-indigo-100">
          <FiSearch />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-[#5A67D8] uppercase tracking-wider">Error 404</span>
          <h2 className="text-2xl font-black text-gray-900">Page Not Found</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FiHome className="text-sm" /> Go to Home
          </Link>
          <Link
            href="/student"
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="text-sm" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
