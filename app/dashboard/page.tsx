"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiHome, FiBookOpen, FiFileText, FiBell, FiSearch, FiLogOut } from 'react-icons/fi';
import { PiStudentFill } from "react-icons/pi";

export default function DashboardPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle the logout process (Logic untouched)
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Call the logout API to clear the HTTP-only cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Redirect the user back to the login page
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex font-sans text-gray-800">
      
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10">
        
        {/* Logo Area */}
        <div className="p-6 flex items-center mb-4">
          <Image 
            src="/logo2.png" 
            alt="Wise East University Logo" 
            width={40} 
            height={40} 
            className="object-contain mr-3"
          />
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#0F172A] leading-tight">Wise East</h2>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#0F172A] leading-tight">University</h2>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-4 py-3 bg-[#EBF4FF] text-[#2563EB] rounded-xl font-semibold transition group">
            <FiHome className="mr-3 text-lg" />
            Dashboard
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition group">
            <FiBookOpen className="mr-3 text-lg group-hover:text-blue-500 transition-colors" />
            My Courses
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition group">
            <FiFileText className="mr-3 text-lg group-hover:text-blue-500 transition-colors" />
            Grades & Results
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition group">
            <FiBell className="mr-3 text-lg group-hover:text-blue-500 transition-colors" />
            Announcements
          </Link>
        </nav>

        {/* Info Banner at bottom of sidebar */}
        <div className="p-4 m-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start">
            <div className="text-yellow-500 mr-2 mt-0.5">ℹ️</div>
            <p className="text-xs text-gray-500 leading-relaxed">
                If you encounter any issues with the dashboard, please contact IT support at <br/>
                <span className="text-blue-600 font-medium">support@weu.edu</span>
            </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white px-8 py-5 flex justify-between items-center z-10 border-b border-transparent shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          {/* Search Bar */}
          <div className="relative w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search courses, grades, or resources..." 
              className="w-full bg-[#F3F4F6] text-sm text-gray-700 rounded-full py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-5">
             <button className="relative text-gray-500 hover:text-gray-700 transition">
                <FiBell className="text-xl" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>

             {/* Logout Button */}
             <button 
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log Out"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 flex items-center justify-center transition disabled:opacity-50"
             >
                {loggingOut ? <span className="text-xs">...</span> : <FiLogOut className="text-lg" />}
             </button>

            {/* User Profile */}
            <div className="flex items-center pl-4 border-l border-gray-200">
                <div className="mr-3 text-right">
                    <p className="text-sm font-bold text-gray-800">Annette Black</p>
                    <p className="text-xs text-gray-500">Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 overflow-hidden">
                    {/* Placeholder for User Image */}
                    <div className="w-full h-full flex items-center justify-center bg-[#EBF4FF] text-[#2563EB]">
                        <PiStudentFill className="text-2xl" />
                    </div>
                </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
            <p className="text-sm text-gray-500">Welcome back to your dashboard</p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Spans 2 cols on lg screens) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Enrolled Courses Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">Enrolled Courses</h3>
                        <Link href="#" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl mr-4">
                                💻
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Web Design</h4>
                                <p className="text-xs text-gray-500 mt-1">Instructor: John Doe</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100">
                            ACTIVE
                        </span>
                    </div>
                </div>

                {/* Bottom Row inside Left Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ongoing Course Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-1">Ongoing Course</h3>
                            <h2 className="text-2xl font-black text-gray-900 mt-4 mb-2">Python</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Master Python programming from basics to advanced. Covers syntax, data structures, algorithms, and web development.
                            </p>
                        </div>
                        <button className="mt-6 w-full py-2.5 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition">
                            Continue Learning
                        </button>
                    </div>

                    {/* Current GPA Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
                        <h3 className="font-bold text-gray-800 text-lg mb-4 relative z-10">Current GPA</h3>
                        <div className="relative z-10 flex items-end">
                            <span className="text-5xl font-black text-gray-900 tracking-tight">3.85</span>
                            <span className="ml-3 mb-1 text-sm font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded flex items-center">
                                ↑ 0.05
                            </span>
                        </div>
                        {/* Decorative Background Element */}
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50 rounded-full opacity-50 z-0"></div>
                    </div>
                </div>

            </div>

            {/* Right Column (Spans 1 col) */}
            <div className="space-y-6">
                
                {/* Upcoming Deadlines Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">Upcoming Deadlines</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3"></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">Assignment 2</h4>
                                <p className="text-xs text-gray-500 mt-1">Due: Oct 25, 11:59 PM</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 mr-3"></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">Final Quiz</h4>
                                <p className="text-xs text-gray-500 mt-1">Due: Nov 2, 11:59 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Links</h3>
                    
                    <div className="space-y-2">
                        <Link href="#" className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition">
                            📅 Class Schedule
                        </Link>
                        <Link href="#" className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition">
                            📚 Library Resources
                        </Link>
                        <Link href="#" className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition">
                            📌 Academic Calendar
                        </Link>
                    </div>
                </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}