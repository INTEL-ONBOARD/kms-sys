"use client";

import Link from 'next/link';
import { useState } from 'react';
import { FiBell, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { MdEventNote } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function DashboardPage() {
  
  // --- Real Calendar Logic States ---
  // We use the current date to initialize the calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate the number of days in the current month and what day the month starts on
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Functions to navigate months
  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Function to check if a specific day is exactly "today"
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };


  return (
    // Main background based on the softer light gray/blue from the design
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Custom CSS for breathing animation */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .animate-breathe-delayed {
          animation: breathe 4s ease-in-out infinite 2s;
        }
        .animate-breathe-fast {
          animation: breathe 3.5s ease-in-out infinite 1s;
        }
      `}</style>

      {/* Rendering the separated Left Sidebar Component */}
      <Sidebar />
  
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Rendering the separated Top Header Component */}
        <Header />
    
        {/* DASHBOARD SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748]">Dashboard</h1>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* --- LEFT SECTION --- */}
            <div className="xl:col-span-2 space-y-6">
                
                {/* 1. TOP SECTION: Split into 2 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT PANEL: Your Rating */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
                        <div className="w-full text-left">
                           <h3 className="font-bold text-[#2D3748]">Your Rating</h3>
                           <p className="text-xs text-[#A0AEC0] mt-1 mb-8">Track your overall academic performance <br /> and progress</p>
                        </div>
                        
                        {/* Overlapping Circles Container */}
                        <div className="relative w-full h-48 flex items-center justify-center mt-4">
                            
                            {/* Purple Circle (Credits) - Added animate-breathe */}
                            <div className="absolute z-20 -top-4 left-6 w-24 h-24 rounded-full bg-[#857BE4] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(133,123,228,0.4)] animate-breathe">
                                <span className="text-xl font-bold">42</span>
                                <span className="text-[10px] font-medium opacity-90 tracking-wide mt-0.5">Credits</span>
                            </div>

                            {/* Orange Circle (Current GPA) - Added animate-breathe-delayed */}
                            <div className="absolute z-30 top-6 right-4 w-32 h-32 rounded-full bg-[#F39B40] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(243,155,64,0.4)] animate-breathe-delayed">
                                <span className="text-3xl font-bold">3.8</span>
                                <span className="text-[11px] font-medium opacity-90 tracking-wide mt-1">Current GPA</span>
                            </div>

                            {/* Cyan Circle (Attendance) - Added animate-breathe-fast */}
                            <div className="absolute z-20 -bottom-6 left-12 w-28 h-28 rounded-full bg-[#42C3DF] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(66,195,223,0.4)] animate-breathe-fast">
                                <span className="text-2xl font-bold">92%</span>
                                <span className="text-[11px] font-medium opacity-90 tracking-wide mt-0.5">Attendance</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Upcoming Events */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <h3 className="font-bold text-[#2D3748] mb-4">Upcoming Events</h3>
                        
                        {/* Functional Calendar Representation */}
                        <div className="bg-[#F7FAFC] rounded-lg p-4 mb-4 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-[#2D3748]">
                                  {monthNames[currentMonth]} {currentYear}
                                </span>
                                <div className="flex space-x-2 text-gray-400">
                                    {/* Added click handlers for Next and Previous months */}
                                    <FiChevronLeft className="cursor-pointer hover:text-gray-800 transition" onClick={handlePrevMonth} />
                                    <FiChevronRight className="cursor-pointer hover:text-gray-800 transition" onClick={handleNextMonth} />
                                </div>
                            </div>
                            {/* Calendar Days Header */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#A0AEC0] mb-3">
                                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                            </div>
                            {/* Dynamic Calendar Grid */}
                            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-xs font-medium text-gray-600">
                                {/* Empty slots before the 1st of the month */}
                                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                                    <div key={`empty-${index}`} className="text-transparent">0</div>
                                ))}
                                {/* Actual days of the month */}
                                {Array.from({ length: daysInMonth }).map((_, index) => {
                                    const day = index + 1;
                                    const isCurrentDay = isToday(day);
                                    return (
                                        <div 
                                          key={day} 
                                          className={`flex items-center justify-center mx-auto w-7 h-7 transition ${
                                            isCurrentDay 
                                              ? 'bg-[#5A67D8] text-white rounded-full shadow-md font-bold' 
                                              : 'hover:bg-[#EEF2FF] hover:text-[#5A67D8] cursor-pointer rounded-full'
                                          }`}
                                        >
                                          {day}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="pt-2">
                            <p className="text-[#A0AEC0] text-sm leading-relaxed">
                                There are no upcoming events <br/>
                                <Link href="#" className="text-[#5A67D8] hover:underline inline-block mt-0.5">go to calendar</Link>
                            </p>
                        </div>
                    </div>

                </div>

                {/* Bottom Grid: My Courses & Class Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* My Courses */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-[#2D3748]">My Courses</h3>
                            <Link href="#" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                        </div>
                        <div className="p-2">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex justify-between items-center p-4 hover:bg-[#F7FAFC] rounded-lg transition">
                                    <div className="flex items-center text-sm font-semibold text-[#4A5568]">
                                        <div className="w-8 h-8 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-3">
                                          <MdEventNote className="text-lg" />
                                        </div>
                                        <span className="truncate w-40">Animation Studies I</span>
                                    </div>
                                    <button className="text-[#A0AEC0] font-medium text-xs hover:text-[#5A67D8] transition">
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Class Scheduled Today */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-[#2D3748]">Class Scheduled</h3>
                            <span className="text-xs font-medium text-[#A0AEC0]">06 Dec, 2026</span>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex flex-col pb-4 border-b border-gray-50">
                                <span className="text-sm font-bold text-[#2D3748] mb-1">Animation Studies I</span>
                                <div className="flex justify-between text-xs text-[#A0AEC0] font-medium">
                                  <span>9:00 am - 3:00 pm</span>
                                  <span>Hall no 13</span>
                                </div>
                            </div>
                            <div className="pb-4 border-b border-gray-50"></div>
                            <div className="pb-4 border-b border-gray-50"></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- RIGHT SECTION --- */}
            <div className="space-y-6">
                
                {/* Upcoming Assignments Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-[#2D3748]">Upcoming Assignments</h3>
                        <Link href="#" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                    </div>
                    
                    <div className="flex flex-col p-2">
                        {/* Assignment Items */}
                        <div className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                                    <span className="w-2 h-2 rounded-full bg-[#ED8936] mr-3"></span>
                                    Project Due
                                </div>
                                <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">2 Days (2026-02-09)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                                    <span className="w-2 h-2 rounded-full bg-[#ED8936] mr-3"></span>
                                    Quiz Tomorrow
                                </div>
                                <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">(2026-02-07)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                                    <span className="w-2 h-2 rounded-full bg-[#A0AEC0] mr-3"></span>
                                    Essay Due
                                </div>
                                <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">4 Days (2026-02-11)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                                    <span className="w-2 h-2 rounded-full bg-[#A0AEC0] mr-3"></span>
                                    Design Report Due
                                </div>
                                <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">6 Days (2026-02-13)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                                    <span className="w-2 h-2 rounded-full bg-[#A0AEC0] mr-3"></span>
                                    Animation Final
                                </div>
                                <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">2 weeks (2026-02-20)</span>
                            </div>
                        </div>

                        {/* Overdue Section */}
                        <div className="mt-2 mb-1 px-4 flex justify-between items-center">
                             <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Overdue</h4>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg cursor-pointer transition">
                            <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-red-600">
                                    <span className="w-2 h-2 rounded-full bg-red-500 mr-3"></span>
                                    Animation Report
                                </div>
                                <span className="text-xs text-red-400 ml-5 mt-0.5">1 day (2026-02-06)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Announcements Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-[#2D3748]">Announcements</h3>
                        <Link href="#" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                    </div>
                    
                    <div className="flex flex-col p-2">
                        <div className="flex items-start p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                                <FiBell className="text-lg" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#2D3748]">Batch event update</h4>
                                <p className="text-xs font-medium text-[#A0AEC0] mt-1">1 hour ago</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                            <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                                <FiFileText className="text-lg" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#2D3748]">Exam Schedule Posted</h4>
                                <p className="text-xs font-medium text-[#A0AEC0] mt-1">3 days ago</p>
                            </div>
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