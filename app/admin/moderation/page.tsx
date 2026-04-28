"use client";

import { useState } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiCheck, FiX, FiEye, FiAlertCircle, FiMessageSquare, FiBookOpen } from 'react-icons/fi';

export default function ModerationPage() {
  
  // Mock Data for Pending Courses
  const [pendingCourses] = useState([
    { id: 1, title: "Advanced React Patterns", instructor: "Michael Scott", submittedAt: "2026-04-27", status: "pending" },
    { id: 2, title: "UI/UX Fundamentals", instructor: "Sarah Jenkins", submittedAt: "2026-04-26", status: "pending" },
  ]);

  // Mock Data for Flagged Forum Posts
  const [reportedPosts] = useState([
    { id: 101, course: "Animation Studies I", author: "Emma Watson", content: "Can someone share the final exam answers here?", reason: "Cheating/Academic Dishonesty", reports: 3 },
    { id: 102, course: "Design Principles", author: "John Doe", content: "This lecture was completely useless and the teacher is an idiot.", reason: "Harassment/Abusive Language", reports: 5 },
  ]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <DashHeader />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Header Area */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Content Moderation</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">Review courses and moderate community forums</p>
          </div>

          {/* Section 1: Course Approvals */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <FiBookOpen className="text-xl text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Pending Course Approvals</h2>
              <span className="ml-3 bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs font-bold">{pendingCourses.length} Pending</span>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Course Title</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingCourses.length > 0 ? pendingCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 font-bold text-gray-900">{course.title}</td>
                      <td className="px-6 py-4">{course.instructor}</td>
                      <td className="px-6 py-4 text-gray-500">{course.submittedAt}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition tooltip-container" title="Preview Course">
                            <FiEye className="text-base" />
                          </button>
                          <button className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition" title="Approve">
                            <FiCheck className="text-base" />
                          </button>
                          <button className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Reject">
                            <FiX className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No courses pending approval.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Flagged Forum Posts */}
          <div>
            <div className="flex items-center mb-4">
              <FiMessageSquare className="text-xl text-orange-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Reported Forum Posts</h2>
              <span className="ml-3 bg-orange-100 text-orange-700 py-0.5 px-2.5 rounded-full text-xs font-bold">{reportedPosts.length} Reports</span>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Post Content & Course</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Reason for Report</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportedPosts.length > 0 ? reportedPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 mb-1">&quot;{post.content}&quot;</div>
                        <div className="text-xs text-indigo-500 font-bold">{post.course}</div>
                      </td>
                      <td className="px-6 py-4">{post.author}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-orange-600 font-bold text-xs bg-orange-50 w-max px-2.5 py-1 rounded-md">
                          <FiAlertCircle className="mr-1.5" />
                          {post.reason} ({post.reports} reports)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            Dismiss
                          </button>
                          <button className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                            Delete Post
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No reported posts. Good job!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}