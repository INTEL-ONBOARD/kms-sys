"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiSearch, FiMail, FiBell, FiHelpCircle, FiChevronDown, FiBook, FiCalendar, FiBarChart2, FiUser, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { MdDashboard, MdOutlineAssignment } from 'react-icons/md';

export default function CoursesPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle the logout process
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  // Course Data Array to map through the grid
  const coursesData = [
    {
      id: 1,
      title: "Animation Studies I (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#4AA59C]",
      bannerText: (
        <div className="text-center font-black text-2xl leading-tight text-white uppercase tracking-wider">
          Learn the basics<br/>of animation 2D!
        </div>
      )
    },
    {
      id: 2,
      title: "DESIGN PRINCIPLES I (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#3B5446]",
      bannerText: (
        <div className="text-center text-white font-serif italic text-xl">
          <span className="font-sans font-bold not-italic text-2xl block mb-1">Strong design</span>
          starts with these <br/> 13 principles
        </div>
      )
    },
    {
      id: 3,
      title: "Design Theories (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#71A5E8]",
      bannerText: (
        <div className="text-center font-black text-3xl text-[#F9D658] uppercase tracking-wide">
          Learning<br/>Theories
        </div>
      )
    },
    {
      id: 4,
      title: "Drawing and Illustration (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#F3EBE0]",
      bannerText: (
        <div className="text-center font-serif text-4xl text-[#3A453C] tracking-tight">
          Drawing<br/>Foundations
        </div>
      )
    },
    {
      id: 5,
      title: "Film Language & Video Production (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#111111]",
      bannerText: (
        <div className="text-center font-bold text-2xl text-white font-sans">
          Introduction to<br/>Film Production
        </div>
      )
    },
    {
      id: 6,
      title: "Introduction to Photography (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-white border-b border-gray-200",
      bannerText: (
        <div className="text-center">
          <div className="font-serif italic text-sm text-gray-500 mb-1">Photography Basics</div>
          <div className="font-black text-3xl text-black tracking-tighter">introduction</div>
        </div>
      )
    },
    {
      id: 7,
      title: "Introduction to Advertising (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#E61F5B]",
      bannerText: (
        <div className="text-center">
          <div className="font-black text-4xl text-[#F9D658] uppercase shadow-sm tracking-widest">Advertising</div>
          <div className="text-[10px] text-white tracking-widest mt-1 font-bold">A COMPLETE INTERACTIVE UNIT</div>
        </div>
      )
    },
    {
      id: 8,
      title: "Principals of Script Writing (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#F9F9FB] border-b border-gray-200",
      bannerText: (
        <div className="text-center font-serif tracking-[0.3em] text-[#3A3F58] font-bold text-2xl uppercase">
          Script<br/>Writing
        </div>
      )
    },
    {
      id: 9,
      title: "Final Project (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      bannerBg: "bg-[#FCF5EB]",
      bannerText: (
        <div className="text-center font-black text-2xl text-[#CE662B] uppercase">
          <span className="text-[#344F89] font-serif italic normal-case text-xl block mb-1">Best Final Year</span>
          Project
        </div>
      )
    }
  ];

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
          {/* Dashboard - Inactive */}
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <MdDashboard className="mr-4 text-xl" />
            Dashboard
          </Link>
          
          {/* Courses - ACTIVE */}
          <Link href="/courses" className="flex items-center px-4 py-3 bg-[#2E68FF] text-white rounded-lg font-medium shadow-md shadow-blue-200 transition">
            <FiBook className="mr-4 text-xl" />
            Courses
          </Link>
          
          {/* Other Inactive Items */}
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <MdOutlineAssignment className="mr-4 text-xl" />
            Assignments
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiCalendar className="mr-4 text-xl" />
            Calendar
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiBarChart2 className="mr-4 text-xl" />
            Grades
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition">
            <FiUser className="mr-4 text-xl" />
            Profile
          </Link>
        </nav>

        {/* Log Out Button */}
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
             <div className="flex items-center space-x-4 text-gray-500">
                <button className="hover:text-gray-800 transition"><FiMail className="text-xl" /></button>
                <button className="relative hover:text-gray-800 transition">
                  <FiBell className="text-xl" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="hover:text-gray-800 transition"><FiHelpCircle className="text-xl" /></button>
             </div>

            <div className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  {/* Using standard img tag to prevent unconfigured host error */}
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

    
        {/* COURSES SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
          
          {/* Section Title */}
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Courses Overview
          </h2>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            {/* Specific Course Search */}
            <div className="relative w-full md:w-[400px]">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Courses" 
                className="w-full bg-white text-sm text-gray-700 rounded-full py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-200 border border-gray-100 shadow-sm"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex space-x-3 w-full md:w-auto">
              {/* All Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                  <option>All</option>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                  <option>Sort by</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>A-Z</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* COURSES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coursesData.map((course) => (
              <div key={course.id} className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                {/* Course Banner (CSS Based instead of image) */}
                <div className={`h-36 ${course.bannerBg} flex flex-col justify-center items-center p-4 relative overflow-hidden`}>
                  {course.bannerText}
                </div>
                
                {/* Course Details */}
                <div className="p-5">
                  <h3 className="text-[13px] font-bold text-[#2B3674] leading-snug group-hover:text-blue-600 transition">
                    {course.title}
                  </h3>
                  <p className="text-[11px] font-medium text-gray-400 mt-1">
                    {course.code}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-end mt-8 text-sm font-medium text-gray-500">
             <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                <button className="hover:text-blue-600 transition"><FiChevronLeft className="text-lg" /></button>
                <span className="text-blue-600 font-bold">1</span>
                <button className="hover:text-blue-600 transition"><FiChevronRight className="text-lg" /></button>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}