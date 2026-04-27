"use client";

import Link from 'next/link';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function CoursesPage() {
  
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
    
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Rendering the separated Left Sidebar Component */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Rendering the separated Top Header Component */}
        <Header />

        {/* COURSES SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          
          {/* Section Title - Updated styling to match theme */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3748]">
              Courses Overview
            </h2>
            <p className="text-sm text-[#A0AEC0] mt-1">Manage and view all your enrolled modules</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
            
            {/* Specific Course Search */}
            <div className="relative w-full md:w-[400px]">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Courses" 
                className="w-full bg-white text-sm text-gray-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8] border border-gray-100 shadow-sm transition"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex space-x-4 w-full md:w-auto">
              {/* All Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50">
                  <option>All</option>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50">
                  <option>Sort by</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>A-Z</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* COURSES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coursesData.map((course) => (
              <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                
                {/* Course Banner */}
                <div className={`h-40 ${course.bannerBg} flex flex-col justify-center items-center p-4 relative overflow-hidden`}>
                  {course.bannerText}
                </div>
                
                {/* Course Details - Colors updated to theme */}
                <div className="p-5 bg-white">
                  <h3 className="text-sm font-bold text-[#2D3748] leading-snug group-hover:text-[#5A67D8] transition">
                    {course.title}
                  </h3>
                  <p className="text-xs font-medium text-[#A0AEC0] mt-1.5">
                    {course.code}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Updated to theme colors */}
          <div className="flex justify-end mt-8 text-sm font-medium text-[#A0AEC0]">
             <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                <button className="hover:text-[#5A67D8] transition"><FiChevronLeft className="text-lg" /></button>
                <span className="text-[#5A67D8] font-bold">1</span>
                <button className="hover:text-[#5A67D8] transition"><FiChevronRight className="text-lg" /></button>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}