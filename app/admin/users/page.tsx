"use client";

import { useState } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiSearch, FiEdit2, FiTrash2, FiMoreVertical, FiUserPlus, FiFilter } from 'react-icons/fi';

export default function UserAdminPage() {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Mock data for users 
  const mockUsers = [
    { id: 1, name: "Aster Seawalker", email: "asterseawalker.022.wise@gmail.com", role: "student", status: "active", joined: "2026-01-15" },
    { id: 2, name: "Dr. Jonathan Crane", email: "j.crane@wiseeast.edu", role: "instructor", status: "active", joined: "2025-11-20" },
    { id: 3, name: "System Admin", email: "admin@wiseeast.edu", role: "super_admin", status: "active", joined: "2026-04-10" },
    { id: 4, name: "Emma Watson", email: "emma.w@student.edu", role: "student", status: "suspended", joined: "2026-02-28" },
    { id: 5, name: "Michael Scott", email: "m.scott@wiseeast.edu", role: "instructor", status: "inactive", joined: "2026-03-05" },
  ];

  // Function to determine status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Function to determine role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700';
      case 'instructor': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">User Administration</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Manage platform users, roles, and access</p>
            </div>
            <button className="mt-4 md:mt-0 bg-[#5A67D8] hover:bg-[#434190] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300">
              <FiUserPlus className="mr-2 text-lg" />
              Add New User
            </button>
          </div>

          {/* Table Controls (Search & Filter) */}
          <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <FiFilter className="text-gray-400" />
              <select 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="super_admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                      
                      {/* User Info Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg mr-3">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex w-max items-center ${getStatusBadge(user.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-500' : user.status === 'suspended' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                          {user.status}
                        </span>
                      </td>

                      {/* Joined Date Column */}
                      <td className="px-6 py-4 text-gray-500">
                        {user.joined}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <FiEdit2 className="text-base" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <FiTrash2 className="text-base" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                            <FiMoreVertical className="text-base" />
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
              <span>Showing 1 to 5 of 5 entries</span>
              <div className="flex space-x-1">
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-medium">1</button>
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}