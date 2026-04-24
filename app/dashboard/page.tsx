"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiSearch, FiMail, FiBell, FiHelpCircle, FiChevronDown, FiBook, FiFileText, FiCalendar, FiBarChart2, FiUser, FiLogOut } from 'react-icons/fi';
import { MdDashboard, MdOutlineAssignment, MdEventNote } from 'react-icons/md';

export default function DashboardPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle the logout process (Logic completely untouched)
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
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans text-gray-800">
      
    
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20">
        
        {/* University Logo Area */}
        <div className="p-8 flex flex-col items-center border-b border-gray-100 mb-6">
          <Image 
            src="/logo2.png" 
            alt="Wise East University Logo" 
            width={50} 
            height={50} 
            className="object-contain mb-3"
          />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black text-center">
            Wise East<br/>University
          </h2>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-2">
          {/* Active Item */}
          <Link href="/dashboard" className="flex items-center px-4 py-3 bg-[#2E68FF] text-white rounded-lg font-medium shadow-md shadow-blue-200 transition">
            <MdDashboard className="mr-4 text-xl" />
            Dashboard
          </Link>
          
          {/* Inactive Items */}
          <Link href="./courses" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiBook className="mr-4 text-xl" />
            Courses
          </Link>
          <Link href="./assignments" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <MdOutlineAssignment className="mr-4 text-xl" />
            Assignments
          </Link>
          <Link href="./calendar" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiCalendar className="mr-4 text-xl" />
            Calendar
          </Link>
          <Link href="./grades" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiBarChart2 className="mr-4 text-xl" />
            Grades
          </Link>
          <Link href="./profile" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiUser className="mr-4 text-xl" />
            Profile
          </Link>
        </nav>

        {/* Log Out Button at the bottom of the sidebar */}
        <div className="p-6 mt-auto border-t border-gray-100">
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center px-4 py-2 text-gray-500 hover:text-red-500 font-medium transition w-full disabled:opacity-50"
          >
            <FiLogOut className="mr-4 text-xl" />
            {loggingOut ? 'Logging Out...' : 'Log Out'}
          </button>
        </div>
      </aside>

  
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="bg-white m-4 mb-2 rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
          
          {/* Left: Search Bar */}
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input 
              type="text" 
              placeholder="Search anything" 
              className="w-full bg-[#F4F7FE] text-sm text-gray-700 rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-200 transition placeholder-gray-400"
            />
          </div>

          {/* Right: User Controls & Profile */}
          <div className="flex items-center space-x-6">
             {/* Icon Buttons */}
             <div className="flex items-center space-x-4 text-gray-500">
                <button className="hover:text-gray-800 transition"><FiMail className="text-xl" /></button>
                <button className="relative hover:text-gray-800 transition">
                  <FiBell className="text-xl" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="hover:text-gray-800 transition"><FiHelpCircle className="text-xl" /></button>
             </div>

            {/* Profile Dropdown Area */}
            <div className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                {/* Profile Image Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img src="./propic.png" alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="mr-2 hidden md:block text-left">
                    <p className="text-sm font-bold text-[#2B3674]">Aster Seawalker</p>
                    <p className="text-xs text-gray-400">asterseawalker.022.wise@gmail.com</p>
                </div>
                <FiChevronDown className="text-gray-400" />
            </div>
          </div>
        </header>

    
        {/* DASHBOARD SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#2B3674]">Welcome, Aster!</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">DASHBOARD</p>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* --- LEFT SECTION (Spans 2 columns on large screens) --- */}
            <div className="xl:col-span-2 space-y-6">
                
                {/* 1. Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-8 text-center flex-1 flex items-center justify-center">
                            <span className="text-5xl font-bold text-[#2B3674]">3.8</span>
                        </div>
                        <div className="bg-[#2E68FF] py-2 text-center text-white text-sm font-medium">
                            Current GPA
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-8 text-center flex-1 flex items-center justify-center">
                            <span className="text-5xl font-bold text-[#2B3674] mr-1">45</span>
                            <span className="text-lg text-gray-500 font-medium mt-3">credits</span>
                        </div>
                        <div className="bg-[#2E68FF] py-2 text-center text-white text-sm font-medium">
                            Credits
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-8 text-center flex-1 flex items-center justify-center">
                            <span className="text-5xl font-bold text-[#2B3674]">92 %</span>
                        </div>
                        <div className="bg-[#2E68FF] py-2 text-center text-white text-sm font-medium">
                            Attendance
                        </div>
                    </div>
                </div>

                {/* 2. Upcoming Events Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#2E68FF] px-5 py-3 text-white font-medium">
                        Upcoming Events
                    </div>
                    <div className="p-6 h-32">
                        <p className="text-gray-400 text-sm">
                            There are no upcoming events <br/>
                            <Link href="#" className="underline hover:text-gray-600 transition">go to calendar....</Link>
                        </p>
                    </div>
                </div>

                {/* 3. Bottom Grid: My Courses & Class Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* My Courses */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#2E68FF] px-5 py-3 flex justify-between items-center text-white">
                            <h3 className="font-medium text-sm">My Courses</h3>
                            <Link href="#" className="text-xs underline hover:text-gray-200">View All</Link>
                        </div>
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex justify-between items-center">
                                    <div className="flex items-center text-sm font-medium text-gray-700">
                                        <MdEventNote className="text-gray-400 mr-3 text-lg" />
                                        Animation Studies I (WISE-25.1F/CO)
                                    </div>
                                    <button className="bg-gray-400 hover:bg-gray-500 text-white text-xs px-4 py-1 rounded transition">
                                        view
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Class Scheduled Today */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#2E68FF] px-5 py-3 flex justify-between items-center text-white">
                            <h3 className="font-medium text-sm">Class Scheduled Today</h3>
                            <span className="text-xs">2026 feb 06</span>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center text-sm font-medium text-[#2B3674] pb-4 border-b border-gray-100">
                                <span>Animation Studies I - 9.00 am - 3.00pm</span>
                                <span className="text-gray-400 font-normal">Hall no 13</span>
                            </div>
                            <div className="pb-4 mt-4 border-b border-gray-100"></div>
                            <div className="pb-4 mt-4 border-b border-gray-100"></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- RIGHT SECTION (Spans 1 column) --- */}
            <div className="space-y-6">
                
                {/* Upcoming Assignments Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#2E68FF] px-5 py-3 flex justify-between items-center text-white">
                        <h3 className="font-medium text-sm">Upcoming Assignments</h3>
                        <Link href="#" className="text-xs underline hover:text-gray-200">View All</Link>
                    </div>
                    
                    <div className="flex flex-col">
                        {/* Assignment Items */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-medium text-[#D97706]">
                                <span className="w-2 h-2 rounded-full bg-orange-400 mr-3 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                                Project Due in 2 Days ( 2026 - 02 - 09 )
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500">{'>'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-medium text-[#D97706]">
                                <span className="w-2 h-2 rounded-full bg-orange-400 mr-3 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                                Quiz Tommorow ( 2026 - 02 - 07 )
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500">{'>'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gray-700 mr-3 shadow-[0_0_5px_rgba(55,65,81,0.5)]"></span>
                                Essay Due in 4 Days ( 2026 - 02 - 11 )
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500">{'>'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gray-700 mr-3 shadow-[0_0_5px_rgba(55,65,81,0.5)]"></span>
                                Design Report Due in 6 Days ( 2026 - 02 - 13 )
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500">{'>'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gray-700 mr-3 shadow-[0_0_5px_rgba(55,65,81,0.5)]"></span>
                                Animation final project Due in 2 weeks ( 2026 - 02 - 20 )
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500">{'>'}</span>
                        </div>

                        {/* Overdue Section */}
                        <div className="bg-red-50 px-4 py-2 flex justify-between items-center text-red-500 text-sm font-bold border-b border-gray-100">
                            Overdue
                            <Link href="#" className="text-xs font-normal underline hover:text-red-700">View All</Link>
                        </div>
                        <div className="flex items-center justify-between p-4 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center text-sm font-bold text-red-500">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-3 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                Animation Report Overdue in 1 day ( 2026 - 02 - 06 )
                            </div>
                            <span className="text-red-400 group-hover:text-red-600">{'>'}</span>
                        </div>
                    </div>
                </div>

                {/* Announcements Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#2E68FF] px-5 py-3 flex justify-between items-center text-white">
                        <h3 className="font-medium text-sm">Announcements</h3>
                        <Link href="#" className="text-xs underline hover:text-gray-200">View All</Link>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-start justify-between p-5 border-b border-gray-100 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-start">
                                <div className="w-2 h-2 rounded-full bg-gray-700 mr-4 mt-1.5"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#2B3674]">Batch event update</h4>
                                    <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                                </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500 mt-1">{'>'}</span>
                        </div>

                        <div className="flex items-start justify-between p-5 group cursor-pointer hover:bg-gray-50">
                            <div className="flex items-start">
                                <div className="w-2 h-2 rounded-full bg-gray-700 mr-4 mt-1.5"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#2B3674]">Exam Schedule Posted</h4>
                                    <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                                </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500 mt-1">{'>'}</span>
                        </div>
                    </div>
                </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}