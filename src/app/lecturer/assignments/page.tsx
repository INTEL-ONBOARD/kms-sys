"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiClipboard, 
  FiPlus, 
  FiFilter, 
  FiLayers, 
  FiCheckCircle, 
  FiClock, 
  FiEdit3, 
  FiBookOpen, 
  FiPercent,
  FiSearch,
  FiFileText
} from "react-icons/fi";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";
import CourseManageModal from "@/Components/lecturer/CourseManageModal";

interface CourseItem {
  _id: string;
  title: string;
  category?: string;
  description?: string;
  published?: boolean;
  instructor?: string;
  assessmentItems?: Array<{
    name: string;
    type: string;
    weight: number;
  }>;
}

interface AssignmentItem {
  _id: string;
  title: string;
  category?: string;
  courseId?: { 
    _id: string; 
    title: string; 
    category?: string;
    assessmentItems?: Array<{ name: string; type: string; weight: number }>;
  };
  dueDate: string;
  maxPoints?: number;
  weight?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  submissionsCount?: number;
  gradedCount?: number;
  status: string;
}

export default function LecturerAssignmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseItem | null>(null);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Homework", "Lab Report", "Project", "Quiz", "Essay", "Case Study"];

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lecturer/assignments?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        if (data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturerCourses = async () => {
    try {
      const res = await fetch("/api/lecturer/courses?limit=50");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchLecturerCourses();
  }, []);

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
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Lab Report":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "Quiz":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Essay":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Case Study":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  // Filter assignments based on category, course, and search
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesCat = selectedCategory === "All" || a.category === selectedCategory;
      const aCourseId = typeof a.courseId === "object" ? a.courseId?._id : a.courseId;
      const matchesCourse = selectedCourseId === "All" || aCourseId === selectedCourseId;
      const matchesSearch = !searchQuery.trim() || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.courseId?.title && a.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesCourse && matchesSearch;
    });
  }, [assignments, selectedCategory, selectedCourseId, searchQuery]);

  // Active course selected for the Breakdown panel
  const activeCourse = useMemo(() => {
    if (selectedCourseId !== "All") {
      return courses.find((c) => c._id === selectedCourseId) || null;
    }
    return courses.length > 0 ? courses[0] : null;
  }, [courses, selectedCourseId]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">
              Curriculum & Coursework
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              Course Grade Breakdown Synced
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]">Assignment Manager</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, categorize, and manage assignments directly connected to Course Assessment & Grade Breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeCourse && (
            <button
              onClick={() => {
                setSelectedCourseForModal(activeCourse);
                setShowCourseModal(true);
              }}
              className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E293B] border border-gray-200 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <FiLayers className="text-blue-600 text-sm" />
              <span>Manage Grade Breakdown</span>
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FiPlus className="text-base" /> Create Assignment
          </button>
        </div>
      </div>

      {/* Course Assessment & Grade Breakdown Sync Panel */}
      {activeCourse && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                <FiLayers />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#1E293B] flex items-center gap-2">
                  <span>Course Assessment & Grade Breakdown</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {activeCourse.title}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  Assessment components configured for this course. Click on any component to create or update its assignment brief.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCourseForModal(activeCourse);
                setShowCourseModal(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <FiEdit3 className="text-xs" /> Edit Breakdown Weights
            </button>
          </div>

          {/* Breakdown Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {(!activeCourse.assessmentItems || activeCourse.assessmentItems.length === 0) ? (
              <div className="col-span-full py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No custom assessment components configured yet for this course. Click &quot;Edit Breakdown Weights&quot; to configure.
              </div>
            ) : (
              activeCourse.assessmentItems.map((item, idx) => {
                const hasCreatedAssignment = assignments.some(
                  (a) => a.title.toLowerCase() === item.name.toLowerCase()
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      hasCreatedAssignment 
                        ? "bg-blue-50/40 border-blue-100" 
                        : "bg-gray-50/60 border-dashed border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="truncate pr-1">
                        <span className="text-[10px] font-black uppercase text-gray-400">
                          Item #{idx + 1} &bull; {item.type}
                        </span>
                        <p className="text-xs font-bold text-[#1E293B] truncate" title={item.name}>
                          {item.name}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 shrink-0">
                        {item.weight}%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100/60 flex items-center justify-between text-[11px]">
                      {hasCreatedAssignment ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                          <FiCheckCircle className="text-xs" /> In Assignment Manager
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowModal(true)}
                          className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiPlus className="text-xs" /> Configure Brief
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400 font-semibold capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
            <FiFilter className="text-blue-600" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Filter & Search */}
        <div className="flex items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 text-xs font-medium text-gray-700 rounded-xl py-2 pl-9 pr-3 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Course Selector */}
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-6 hover:bg-gray-100 transition max-w-[180px] truncate"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs flex flex-col items-center">
          <FiClipboard className="text-5xl text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#1E293B]">No assignments found</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {selectedCategory === "All"
              ? "Create your first assignment or add one to Course Assessment & Grade Breakdown"
              : `No assignments categorized under "${selectedCategory}"`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition cursor-pointer"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((a) => (
            <div
              key={a._id}
              className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${getCategoryBadgeClass(
                        a.category
                      )}`}
                    >
                      {a.category || "Homework"}
                    </span>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {a.weight || 20}% Weight
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 shrink-0">
                    Due {formatDate(a.dueDate)}
                  </span>
                </div>

                <h3 className="font-extrabold text-[#1E293B] text-base leading-snug">{a.title}</h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <FiBookOpen className="text-xs text-blue-500" />
                  <span className="truncate">{a.courseId?.title || "General Course"}</span>
                </p>

                {a.attachmentUrl && (
                  <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <a
                      href={`/api/student/assignments/${a._id}/attachment?action=view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 transition"
                    >
                      <FiFileText className="text-xs" />
                      <span>{a.attachmentName || "View Assignment PDF Brief"}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {a.submissionsCount || 0} Submissions
                </span>
                <a href="/lecturer/grades" className="text-blue-600 font-bold hover:underline">
                  Review & Grade &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Modal (Create Assignment) */}
      {showModal && (
        <QuickActionModal
          type="assignment"
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchAssignments();
            fetchLecturerCourses();
          }}
        />
      )}

      {/* Course Assessment & Grade Breakdown Modal */}
      {showCourseModal && selectedCourseForModal && (
        <CourseManageModal
          course={selectedCourseForModal as any}
          initialTab="breakdown"
          onClose={() => {
            setShowCourseModal(false);
            setSelectedCourseForModal(null);
          }}
          onUpdate={() => {
            fetchAssignments();
            fetchLecturerCourses();
          }}
        />
      )}
    </div>
  );
}
