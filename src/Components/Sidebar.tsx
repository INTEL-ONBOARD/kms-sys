"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBook, FiCalendar, FiBarChart2, FiVideo, FiFileText } from 'react-icons/fi';
import { MdDashboard, MdOutlineAssignment, MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';

export default function Sidebar() {
  // Get the current route path
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20">
      
      {/* University Logo Area */}
      <div className="p-8 flex flex-col items-center mb-2 mt-2">
        <Image 
          src="/logo2.png" 
          alt="Wise East University Logo" 
          width={45} 
          height={45} 
          className="object-contain mb-3"
        />
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#2D3748] text-center">
          Wise East<br/>University
        </h2>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1">
        
        {/* Dashboard Link */}
        <Link
          href="/student"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/student'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <MdDashboard className="mr-4 text-xl" />
          Dashboard
        </Link>

        {/* Courses Link */}
        <Link
          href="/courses"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/courses'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <FiBook className="mr-4 text-xl" />
          Courses
        </Link>

        {/* Assignments Link */}
        <Link
          href="/assignments"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/assignments'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <MdOutlineAssignment className="mr-4 text-xl" />
          Assignments
        </Link>

        {/* Live & Upcoming Classes Link */}
        <Link
          href="/live-classes"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/live-classes'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <MdOutlineLiveTv className="mr-4 text-xl" />
          Live Classes
        </Link>

        {/* Missed Sessions & Playback Link */}
        <Link
          href="/recordings"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/recordings'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <MdVideoLibrary className="mr-4 text-xl" />
          Recordings & Playback
        </Link>

        {/* Timetable Calendar Link */}
        <Link
          href="/calendar"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/calendar'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <FiCalendar className="mr-4 text-xl" />
          Timetable Calendar
        </Link>

        {/* Grades Link */}
        <Link
          href="/grades"
          className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
            pathname === '/grades'
              ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
              : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
          }`}
        >
          <FiBarChart2 className="mr-4 text-xl" />
          Grades
        </Link>

      </nav>

      {/* Log out is in Header Dropdown */}
      <div className="p-6 mt-auto"></div>
    </aside>
  );
}