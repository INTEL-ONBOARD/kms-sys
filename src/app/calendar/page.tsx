"use client";

import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function CalendarPage() {
  // State to manage the active view toggle
  const [activeView, setActiveView] = useState('Week');

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Calendar / Timetable</h1>
            </div>
            
            {/* Course Filter Dropdown */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 shadow-sm text-sm font-semibold text-[#4A5568] py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50 min-w-[160px]">
                <option>All courses</option>
                <option>Animation Studies</option>
                <option>Photography</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Main Timetable Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            
            {/* Timetable Controls Bar */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-white space-y-4 md:space-y-0">
              
              {/* View Toggles (Week / Monthly) */}
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button 
                  onClick={() => setActiveView('Week')}
                  className={`px-5 py-1.5 text-sm font-bold rounded-md transition ${
                    activeView === 'Week' 
                      ? 'bg-[#5A67D8] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setActiveView('Monthly')}
                  className={`px-5 py-1.5 text-sm font-bold rounded-md transition ${
                    activeView === 'Monthly' 
                      ? 'bg-[#5A67D8] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Date Navigator */}
              <div className="flex items-center space-x-4">
                <button className="p-1 hover:bg-gray-100 rounded transition text-gray-500">
                  <FiChevronLeft className="text-xl" />
                </button>
                <span className="text-base font-bold text-[#2D3748]">2026 February 06</span>
                <button className="p-1 hover:bg-gray-100 rounded transition text-gray-500">
                  <FiChevronRight className="text-xl" />
                </button>
              </div>

              {/* Empty placeholder to balance the flex layout */}
              <div className="w-32 hidden md:block"></div>
            </div>

            {/* Timetable Grid Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[900px]">
                
                {/* Table Headers */}
                <thead>
                  <tr className="bg-[#F7FAFC] border-b border-gray-200 text-[#4A5568] text-sm">
                    <th className="py-4 border-r border-gray-200 font-bold w-24">Time</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Monday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Tuesday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Wednesday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Thursday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Friday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Saturday</th>
                    <th className="py-4 border-r border-gray-200 font-bold w-40">Sunday</th>
                    <th className="py-4 font-bold w-32">Notes</th>
                  </tr>
                </thead>

                {/* Table Body (Time Slots) */}
                <tbody className="text-sm">
                  
                  {/* 08:00 AM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">08.00 am</td>
                    {/* Monday - Spans 2 hours */}
                    <td rowSpan={2} className="border-r border-gray-200 bg-[#A5E095] border-l-4 border-l-[#2F855A] p-2 align-middle">
                      <div className="font-bold text-[#1C4532] leading-tight">Animation<br/>Studies</div>
                      <div className="text-[11px] text-[#276749] mt-1 font-medium">hall 15</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 09:00 AM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">09.00 am</td>
                    {/* Monday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 10:00 AM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">10.00 am</td>
                    {/* Monday Break */}
                    <td className="border-r border-gray-200 bg-[#FDE8EF] text-[#D53F8C] font-bold">break</td>
                    <td className="border-r border-gray-200"></td>
                    {/* Wednesday - Spans 3 hours */}
                    <td rowSpan={3} className="border-r border-gray-200 bg-[#F6B05C] border-l-4 border-l-[#C05621] p-2 align-middle">
                      <div className="font-bold text-white leading-tight">Drawing<br/>&<br/>Illustration</div>
                      <div className="text-[11px] text-orange-100 mt-1 font-medium">Art room</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday - Spans 3 hours */}
                    <td rowSpan={3} className="border-r border-gray-200 bg-[#5CB5F9] border-l-4 border-l-[#2B6CB0] p-2 align-middle">
                      <div className="font-bold text-white leading-tight">Photography</div>
                      <div className="text-[11px] text-blue-100 mt-1 font-medium">Hall 1</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 11:00 AM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">11.00 am</td>
                    {/* Monday - Spans 2 hours */}
                    <td rowSpan={2} className="border-r border-gray-200 bg-[#A5E095] border-l-4 border-l-[#2F855A] p-2 align-middle">
                      <div className="font-bold text-[#1C4532] leading-tight">Animation<br/>Studies</div>
                      <div className="text-[11px] text-[#276749] mt-1 font-medium">hall 15</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    {/* Wednesday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 12:00 PM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">12.00 pm</td>
                    {/* Monday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    {/* Wednesday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 13:00 PM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">13.00 pm</td>
                    {/* Monday Break */}
                    <td className="border-r border-gray-200 bg-[#FDE8EF] text-[#D53F8C] font-bold">break</td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday Break */}
                    <td className="border-r border-gray-200 bg-[#FDE8EF] text-[#D53F8C] font-bold">break</td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 14:00 PM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">14.00 pm</td>
                    {/* Monday - Spans 2 hours */}
                    <td rowSpan={2} className="border-r border-gray-200 bg-[#A5E095] border-l-4 border-l-[#2F855A] p-2 align-middle">
                      <div className="font-bold text-[#1C4532] leading-tight">Animation<br/>Studies</div>
                      <div className="text-[11px] text-[#276749] mt-1 font-medium">hall 15</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday - Spans 2 hours */}
                    <td rowSpan={2} className="border-r border-gray-200 bg-[#5CB5F9] border-l-4 border-l-[#2B6CB0] p-2 align-middle">
                      <div className="font-bold text-white leading-tight">Photography</div>
                      <div className="text-[11px] text-blue-100 mt-1 font-medium">Hall 1</div>
                    </td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 15:00 PM Row */}
                  <tr className="border-b border-gray-200 h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">15.00 pm</td>
                    {/* Monday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    {/* Saturday is covered by previous rowSpan */}
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                  {/* 16:00 PM Row */}
                  <tr className="h-20">
                    <td className="border-r border-gray-200 text-[#A0AEC0] font-medium">16.00 pm</td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>

                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}