"use client";

import { useState } from 'react';
import { FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { MdOutlineAssignment, MdOutlineNotificationsActive } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function AssignmentsPage() {
  // State to manage the active tab in the assignments view
  const [activeTab, setActiveTab] = useState('All');

  // Mock data for upcoming assignments
  const upcomingAssignments = [
    {
      id: 1,
      title: "Drawing Project",
      course: "Drawing and Illustration (WISE-25.1F/CO)",
      dueDate: "February 09",
      timeLeft: "2 Days",
      isUrgent: true,
    },
    {
      id: 2,
      title: "Essay",
      course: "Effective communication Skills (WISE-25.1F/CO)",
      dueDate: "February 11",
      timeLeft: "5 Days",
      isUrgent: false,
    },
    {
      id: 3,
      title: "Design Report",
      course: "Design Principle I (WISE-25.1F/CO)",
      dueDate: "February 13",
      timeLeft: "6 Days",
      isUrgent: false,
    },
    {
      id: 4,
      title: "Animation final project",
      course: "Design Principle I (WISE-25.1F/CO)",
      dueDate: "February 20",
      timeLeft: "2 weeks",
      isUrgent: false,
    }
  ];

  // Mock data for overdue assignments
  const overdueAssignments = [
    {
      id: 101,
      title: "Animation Report Overdue in 1 day ( 2026 - 02 - 06 )",
      course: "Animation Studies (WISE-25.1F/CO)",
      dueDate: "February 06",
      timeOverdue: "1 day",
    }
  ];

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
          
          {/* Page Header and Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Assignments</h1>
            </div>
            
            {/* Course Filter Dropdown */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50 min-w-[160px]">
                <option>All courses</option>
                <option>Animation Studies I</option>
                <option>Design Principles I</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8 px-2">
              {['All', 'Pending', 'Submitted', 'Graded'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold border-b-2 transition-colors duration-200 ${
                    activeTab === tab
                      ? 'border-[#5A67D8] text-[#5A67D8]'
                      : 'border-transparent text-[#A0AEC0] hover:text-[#4A5568] hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Upcoming Assignments Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-[#2D3748] mb-4">
              Upcoming <span className="text-[#A0AEC0] ml-1 font-medium">({upcomingAssignments.length})</span>
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col">
                {upcomingAssignments.map((assignment, index) => (
                  <div 
                    key={assignment.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-6 transition hover:bg-[#F7FAFC] ${
                      index !== upcomingAssignments.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    {/* Assignment Info */}
                    <div className="flex items-start mb-4 md:mb-0">
                      {/* Icon */}
                      <div className={`mt-1 mr-4 text-2xl ${assignment.isUrgent ? 'text-[#ED8936]' : 'text-[#5A67D8]'}`}>
                        {assignment.isUrgent ? <MdOutlineNotificationsActive /> : <MdOutlineAssignment />}
                      </div>
                      
                      {/* Text Details */}
                      <div>
                        <h3 className="font-bold text-[#2D3748] text-base">{assignment.title}</h3>
                        <p className="text-xs font-medium text-[#A0AEC0] mt-1">{assignment.course}</p>
                        <div className="flex items-center text-xs font-semibold mt-2">
                          <span className="text-[#A0AEC0] mr-2">Due : {assignment.dueDate}</span>
                          <span className={assignment.isUrgent ? 'text-[#ED8936]' : 'text-[#5A67D8]'}>
                            {assignment.timeLeft}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 ml-10 md:ml-0">
                      <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-[#4A5568] text-sm font-bold rounded-lg transition">
                        View
                      </button>
                      <button 
                        className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition ${
                          assignment.isUrgent 
                            ? 'bg-[#ED8936] hover:bg-[#DD6B20] shadow-[0_4px_10px_rgba(237,137,54,0.3)]' 
                            : 'bg-[#A0AEC0] hover:bg-[#718096]'
                        }`}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overdue Assignments Section */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#2D3748] mb-4">
              Overdue <span className="text-[#A0AEC0] ml-1 font-medium">({overdueAssignments.length})</span>
            </h2>
            
            <div className="bg-[#FFF5F5] rounded-2xl border border-red-100 overflow-hidden">
              <div className="flex flex-col">
                {overdueAssignments.map((assignment, index) => (
                  <div 
                    key={assignment.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-6 transition hover:bg-[#FEEDED] ${
                      index !== overdueAssignments.length - 1 ? 'border-b border-red-50' : ''
                    }`}
                  >
                    {/* Assignment Info */}
                    <div className="flex items-start mb-4 md:mb-0">
                      {/* Icon */}
                      <div className="mt-1 mr-4 text-2xl text-red-500">
                        <FiAlertCircle />
                      </div>
                      
                      {/* Text Details */}
                      <div>
                        <h3 className="font-bold text-[#2D3748] text-base">{assignment.title}</h3>
                        <p className="text-xs font-medium text-red-400 mt-1">{assignment.course}</p>
                        <div className="flex items-center text-xs font-semibold mt-2">
                          <span className="text-red-400 mr-2">Due : {assignment.dueDate}</span>
                          <span className="text-red-500 bg-red-100 px-2 py-0.5 rounded">
                            {assignment.timeOverdue}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 ml-10 md:ml-0">
                      <button className="px-5 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg transition">
                        View
                      </button>
                      <button className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_10px_rgba(239,68,68,0.3)] text-sm font-bold rounded-lg transition">
                        Submit Late
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}