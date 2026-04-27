"use client";

import { FiCalendar, FiCheck } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function ProfilePage() {
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
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#2D3748] uppercase tracking-widest">Profile</h1>
          </div>

          {/* Top Section: Profile Info and Edit Profile */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            
            {/* Left Column: Profile Card */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                
                {/* Profile Image */}
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-[#F7FAFC] shadow-sm">
                  <img src="./propic.png" alt="Aster Seawalker" className="w-full h-full object-cover" />
                </div>
                
                {/* Profile Details */}
                <h2 className="text-xl font-bold text-[#2D3748]">Aster Seawalker</h2>
                <p className="text-sm font-semibold text-[#A0AEC0] mb-6">Student</p>
                
                <div className="w-full text-left space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#4A5568]">Student ID :</span>
                    <span className="font-medium text-[#718096]">1234567891108</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#4A5568]">Department :</span>
                    <span className="font-medium text-[#718096]">Computing</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Edit Profile Form */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full flex flex-col">
                <h3 className="text-lg font-bold text-[#2D3748] mb-6">Edit Profile</h3>
                
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1">
                  
                  {/* Name Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Name</label>
                    <input 
                      type="text" 
                      defaultValue="Aster Seawalker"
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                    />
                  </div>

                  {/* Student ID Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Student ID</label>
                    <input 
                      type="text" 
                      defaultValue="1234567891108"
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 text-[#A0AEC0] font-medium text-sm rounded-lg py-2.5 px-4 cursor-not-allowed"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="asterseawalker.022.wise@gmail.com"
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input 
                      type="text" 
                      defaultValue="( 94 ) 456 - 7890"
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                    />
                  </div>

                  {/* Date of Birth Input */}
                  <div className="flex flex-col relative">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Date of Birth</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        defaultValue="January 15 , 2003"
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                      />
                      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Home Address Input */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Home Address</label>
                    <input 
                      type="text" 
                      defaultValue="123 elm street , colombo 05"
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                    />
                  </div>

                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end space-x-4 mt-auto pt-4">
                  <button className="px-8 py-2.5 bg-white border border-[#A0AEC0] text-[#4A5568] font-bold text-sm rounded-lg hover:bg-gray-50 transition">
                    Discard
                  </button>
                  <button className="px-10 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-100 transition">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Bottom Section: Account Settings */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3748] mb-6">Account Settings</h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Change Password */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full">
                  <h3 className="text-lg font-bold text-[#2D3748] mb-6">Change Password</h3>
                  
                  <div className="space-y-5 mb-8">
                    {/* Current Password */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Current Password</label>
                      <input 
                        type="password" 
                        defaultValue="••••••••••••"
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                      />
                    </div>

                    {/* New Password */}
                    <div className="flex flex-col relative">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">New Password</label>
                      <input 
                        type="password" 
                        defaultValue="••••••••••••"
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                      />
                    </div>

                    {/* Confirm New Password */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                      <input 
                        type="password" 
                        defaultValue="••••••••••••"
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition"
                      />
                    </div>
                  </div>

                  {/* Password Action Buttons */}
                  <div className="flex space-x-4 mt-auto">
                    <button className="flex-1 py-2.5 bg-white border border-[#A0AEC0] text-[#4A5568] font-bold text-sm rounded-lg hover:bg-gray-50 transition">
                      Discard
                    </button>
                    <button className="flex-1 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-100 transition">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Notifications */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full">
                  <h3 className="text-lg font-bold text-[#2D3748] mb-6">Notifications</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Reusable Checkbox Item Component Style */}
                    {[
                      "Assignment deadlines",
                      "Dashboard Alerts",
                      "Grade Updates",
                      "Timetable Reminders",
                      "Announcements",
                      "Exam Reminders",
                      "Messages From Lectures"
                    ].map((item, index) => (
                      <label key={index} className="flex items-center p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <div className="relative flex items-center justify-center w-5 h-5 mr-4 border-2 border-[#5A67D8] bg-[#5A67D8] rounded">
                          <FiCheck className="text-white text-sm" />
                          <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" defaultChecked />
                        </div>
                        <span className="text-sm font-bold text-[#4A5568]">{item}</span>
                      </label>
                    ))}

                    {/* Two Factor Authentication Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <span className="text-sm font-bold text-[#4A5568]">Two-Factor Authentication</span>
                      
                      {/* Toggle Switch UI */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A67D8]"></div>
                      </label>
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