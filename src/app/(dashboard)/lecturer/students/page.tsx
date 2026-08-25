"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiSearch, FiMail, FiBookOpen, FiRefreshCw } from "react-icons/fi";

interface EnrolledStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  courseId: string;
  courseCategory?: string;
  progress: number;
  status: string;
  enrolledAt?: string;
}

export default function LecturerStudentsPage() {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/lecturer/students", window.location.origin);
      if (selectedBatch !== "all") {
        url.searchParams.set("batch", selectedBatch);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/lecturer/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedBatch]);

  // Unique list of courses for the dropdown filter
  const courseList = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === "all" || s.course === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#111827]">Enrolled Students Directory</h1>
            <span className="bg-[#EEF2FF] text-[#5A67D8] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Students enrolled across your teaching courses</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Batch Filter Dropdown */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full sm:w-48 bg-[#F7FAFC] border border-gray-200 text-xs text-gray-700 rounded-xl py-2.5 px-3 outline-none focus:ring-1 focus:ring-[#5A67D8]"
          >
            <option value="all">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>

          {/* Course Filter Dropdown */}
          {courseList.length > 0 && (
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full sm:w-48 bg-[#F7FAFC] border border-gray-200 text-xs text-gray-700 rounded-xl py-2.5 px-3 outline-none focus:ring-1 focus:ring-[#5A67D8]"
            >
              <option value="all">All Courses</option>
              {courseList.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search student by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAFC] border border-gray-200 text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[#5A67D8]"
            />
          </div>

          <button
            onClick={fetchStudents}
            title="Refresh list"
            className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-[#F7FAFC] border border-gray-200 hover:border-[#5A67D8] rounded-xl transition"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto w-full">
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="space-y-1">
                          <div className="h-3.5 bg-gray-200 rounded w-28" />
                          <div className="h-2.5 bg-gray-100 rounded w-36" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-full w-14" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiUsers className="text-3xl text-gray-300" />
                      <p className="font-semibold text-gray-500">
                        {students.length === 0
                          ? "No students are currently enrolled in your courses."
                          : "No students match your query."}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCourse("all");
                          }}
                          className="text-xs text-[#5A67D8] font-bold hover:underline mt-1"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FAFC] transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#5A67D8] font-bold flex items-center justify-center text-xs">
                          {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <p className="font-bold text-[#111827]">{s.name}</p>
                          <p className="text-[11px] text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{s.course}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const progressVal = Math.min(100, Math.max(0, typeof s.progress === "number" ? s.progress : Number(s.progress) || 0));
                        return (
                          <div className="flex items-center gap-2.5">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progressVal >= 100
                                    ? "bg-emerald-500"
                                    : progressVal > 0
                                    ? "bg-[#5A67D8]"
                                    : "bg-gray-300"
                                }`}
                                style={{ width: `${progressVal}%` }}
                              />
                            </div>
                            <span className={`font-bold ${progressVal >= 100 ? "text-emerald-600" : progressVal > 0 ? "text-[#5A67D8]" : "text-gray-400"}`}>
                              {progressVal}%
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.email ? (
                        <a
                          href={`mailto:${s.email}`}
                          className="text-[#5A67D8] hover:underline font-semibold inline-flex items-center justify-end gap-1"
                        >
                          <FiMail /> Contact
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
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
