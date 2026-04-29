"use client";

import { signOut } from "next-auth/react";

export default function LecturerDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] text-white">
      <h1 className="text-4xl font-bold text-[#b7ff00] mb-4">Lecturer Dashboard</h1>
      <p className="text-gray-400 mb-8">This page is currently under construction.</p>
      
      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
      >
        Force Log Out
      </button>
    </div>
  );
}