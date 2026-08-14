"use client";

import { useState } from "react";
import { FiUsers, FiSearch, FiMail, FiBookOpen } from "react-icons/fi";

const mockStudents = [
  { id: "1", name: "Alex Johnson", email: "alex.johnson@student.edu", course: "Computer Science 101", progress: 88, status: "Active" },
  { id: "2", name: "Sarah Miller", email: "sarah.m@student.edu", course: "Data Structures & Algorithms", progress: 94, status: "Active" },
  { id: "3", name: "David Chen", email: "david.c@student.edu", course: "Database Management Systems", progress: 76, status: "Active" },
  { id: "4", name: "Emily Watson", email: "emily.w@student.edu", course: "Computer Science 101", progress: 92, status: "Active" },
  { id: "5", name: "Michael Brown", email: "michael.b@student.edu", course: "Web Development Fundamentals", progress: 68, status: "Warning" },
  { id: "6", name: "Jessica Taylor", email: "jessica.t@student.edu", course: "Data Structures & Algorithms", progress: 85, status: "Active" },
];

export default function LecturerStudentsPage() {
  const [students] = useState<any[]>(mockStudents);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Enrolled Students Directory</h1>
          <p className="text-xs text-gray-400 mt-1">Students enrolled across your teaching courses</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7FAFC] text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFC] border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Enrolled Course</th>
                <th className="px-6 py-4">Course Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No students match your query
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FAFC] transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] font-bold flex items-center justify-center">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#111827]">{s.name}</p>
                          <p className="text-[11px] text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{s.course}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="font-bold text-[#2563EB]">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`mailto:${s.email}`} className="text-[#2563EB] hover:underline font-semibold flex items-center justify-end gap-1">
                        <FiMail /> Contact
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
