"use client";

import { useState, useEffect } from "react";
import { FiClipboard, FiPlus, FiFilter, FiTag } from "react-icons/fi";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";

interface AssignmentItem {
  _id: string;
  title: string;
  category?: string;
  courseId?: { title: string };
  dueDate: string;
  submissionsCount?: number;
  status: string;
}

export default function LecturerAssignmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Homework", "Lab Report", "Project", "Quiz", "Essay", "Case Study"];

  const fetchAssignments = async (category: string = "All") => {
    setLoading(true);
    try {
      const url = category && category !== "All"
        ? `/api/lecturer/assignments?category=${encodeURIComponent(category)}&limit=50`
        : `/api/lecturer/assignments?limit=50`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(selectedCategory);
  }, [selectedCategory]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case "Project":
        return "bg-amber-100 text-amber-700";
      case "Lab Report":
        return "bg-teal-100 text-teal-700";
      case "Quiz":
        return "bg-purple-100 text-purple-700";
      case "Essay":
        return "bg-pink-100 text-pink-700";
      case "Case Study":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3748]">Assignment Manager</h1>
          <p className="text-xs text-[#A0AEC0] mt-1">Create, categorize, grade, and review course coursework</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#434190] transition flex items-center gap-2"
        >
          <FiPlus className="text-base" /> Create Assignment
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mr-2">
          <FiFilter className="text-[#5A67D8]" /> Filter Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? "bg-[#5A67D8] text-white shadow-sm"
                : "bg-[#F7FAFC] text-gray-600 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <FiClipboard className="text-5xl text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#2D3748]">No assignments found</h3>
          <p className="text-xs text-[#A0AEC0] mt-1 mb-4">
            {selectedCategory === "All"
              ? "Create your first assignment for students"
              : `No assignments categorized under "${selectedCategory}"`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] transition"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignments.map((a) => (
            <div
              key={a._id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getCategoryBadgeClass(
                        a.category
                      )}`}
                    >
                      {a.category || "Homework"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.status === "graded"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#A0AEC0] shrink-0">
                    Due {formatDate(a.dueDate)}
                  </span>
                </div>

                <h3 className="font-bold text-[#2D3748] text-base leading-snug">{a.title}</h3>
                <p className="text-xs text-[#A0AEC0] mt-1">{a.courseId?.title || "General Course"}</p>
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                <span className="text-[#4A5568] font-semibold">
                  {a.submissionsCount || 0} Submissions
                </span>
                <a href="/lecturer/grades" className="text-[#5A67D8] font-bold hover:underline">
                  Review & Grade
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <QuickActionModal
          type="assignment"
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchAssignments(selectedCategory)}
        />
      )}
    </div>
  );
}
