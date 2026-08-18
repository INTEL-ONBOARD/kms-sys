"use client";

import { useState, useEffect } from "react";
import { FiBookOpen, FiUsers, FiClipboard, FiPlus, FiSearch, FiUploadCloud } from "react-icons/fi";
import CourseCardLecturer from "@/Components/lecturer/CourseCardLecturer";
import MaterialUploadModal from "@/Components/lecturer/MaterialUploadModal";

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, hasMore: false });

  const fetchCourses = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lecturer/courses?page=${page}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.data || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1);
  }, []);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">My Teaching Courses</h1>
          <p className="text-xs text-gray-400 mt-1">Manage curriculum, lecture materials, student rosters, and assignments</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAFC] text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition shrink-0"
          >
            <FiUploadCloud className="text-sm" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <FiBookOpen className="text-5xl text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">No teaching courses found</h3>
          <p className="text-xs text-gray-400 mt-1">Courses assigned to you by admin will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCardLecturer key={course._id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-between items-center pt-4 text-xs font-semibold text-gray-500">
          <span>Showing {courses.length} of {pagination.total} courses</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchCourses(pagination.page - 1)}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={!pagination.hasMore}
              onClick={() => fetchCourses(pagination.page + 1)}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <MaterialUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => fetchCourses(pagination.page)}
        />
      )}
    </div>
  );
}
