"use client";

import { useState } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiBook, FiTag } from 'react-icons/fi';

export default function CoursesAdminPage() {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Mock data for courses based on the LMS specification
  const mockCourses = [
    { id: 1, title: "Animation Studies I", instructor: "Michael Scott", category: "Design", price: "Free", status: "published", enrollments: 124 },
    { id: 2, title: "Introduction to Film Production", instructor: "Sarah Jenkins", category: "Media", price: "$49.99", status: "published", enrollments: 89 },
    { id: 3, title: "Advanced React Patterns", instructor: "Dr. Jonathan Crane", category: "Computing", price: "$89.99", status: "draft", enrollments: 0 },
    { id: 4, title: "Drawing Foundations", instructor: "Pam Beesly", category: "Arts", price: "Free", status: "archived", enrollments: 450 },
    { id: 5, title: "Design Principles I", instructor: "Michael Scott", category: "Design", price: "$29.99", status: "published", enrollments: 210 },
  ];

  // Function to determine status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Course Management</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Manage all platform courses, categories, and tags</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300">
                <FiTag className="mr-2 text-lg text-indigo-500" />
                Categories
              </button>
              <button className="bg-[#5A67D8] hover:bg-[#434190] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300">
                <FiPlus className="mr-2 text-lg" />
                New Course
              </button>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mr-4">
                <FiBook className="text-indigo-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Courses</p>
                <h3 className="text-2xl font-extrabold text-gray-800">45</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mr-4">
                <FiBook className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Published</p>
                <h3 className="text-2xl font-extrabold text-gray-800">38</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mr-4">
                <FiBook className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">In Draft</p>
                <h3 className="text-2xl font-extrabold text-gray-800">7</h3>
              </div>
            </div>
          </div>

          {/* Table Controls (Search & Filter) */}
          <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <FiFilter className="text-gray-400" />
              <select 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition duration-150">
                      
                      {/* Course Info Column */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{course.enrollments} Enrollments</div>
                      </td>

                      {/* Instructor Column */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-700">{course.instructor}</div>
                      </td>

                      {/* Category Column */}
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">
                          {course.category}
                        </span>
                      </td>

                      {/* Price Column */}
                      <td className="px-6 py-4">
                        <span className={`font-bold ${course.price === 'Free' ? 'text-green-600' : 'text-gray-700'}`}>
                          {course.price}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${getStatusBadge(course.status)}`}>
                          {course.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Course">
                            <FiEye className="text-base" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Course">
                            <FiEdit className="text-base" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Course">
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Showing 1 to 5 of 45 entries</span>
              <div className="flex space-x-1">
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-medium">1</button>
                <button className="px-3 py-1 hover:bg-gray-50 border border-gray-200 rounded-md font-medium">2</button>
                <button className="px-3 py-1 hover:bg-gray-50 border border-gray-200 rounded-md font-medium">3</button>
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}