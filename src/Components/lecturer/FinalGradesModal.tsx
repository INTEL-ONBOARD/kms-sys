"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiAward,
  FiUser,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiPercent,
  FiFileText,
  FiChevronDown
} from "react-icons/fi";

export interface StudentFinalGrade {
  enrollmentId: string;
  studentId: string;
  name: string;
  email: string;
  image?: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalExams: number;
  completedExams: number;
  allAssignmentsCompleted: boolean;
  finalExamCompleted: boolean;
  isCompleted: boolean;
  assignmentScores?: Array<{
    assignmentId: string;
    title: string;
    score: number | null;
    percentage: number | null;
    status: string;
  }>;
  assignmentAverageScore: number | null;
  finalGrade: number | null;
  finalLetterGrade: string;
  finalGradeColor: string;
  gpaPoint: number | null;
  status: string;
}

interface FinalGradesModalProps {
  students: StudentFinalGrade[];
  initialGradeFilter?: "A" | "B" | "C" | "D" | "F" | "ALL" | "IN_PROGRESS";
  onClose: () => void;
}

export default function FinalGradesModal({
  students,
  initialGradeFilter = "ALL",
  onClose,
}: FinalGradesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>(initialGradeFilter);
  const [courseFilter, setCourseFilter] = useState<string>("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.courseId && s.courseTitle) {
        map.set(s.courseId, s.courseTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [students]);

  const counts = useMemo(() => {
    const completed = students.filter((s) => s.isCompleted);
    return {
      ALL: completed.length,
      A: completed.filter((s) => s.finalLetterGrade === "A").length,
      B: completed.filter((s) => s.finalLetterGrade === "B").length,
      C: completed.filter((s) => s.finalLetterGrade === "C").length,
      D: completed.filter((s) => s.finalLetterGrade === "D").length,
      F: completed.filter((s) => s.finalLetterGrade === "F").length,
      IN_PROGRESS: students.filter((s) => !s.isCompleted).length,
      TOTAL: students.length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Course filter
      if (courseFilter !== "ALL" && s.courseId !== courseFilter) {
        return false;
      }

      // Grade tab filter
      if (gradeFilter === "ALL") {
        if (!s.isCompleted) return false;
      } else if (gradeFilter === "IN_PROGRESS") {
        if (s.isCompleted) return false;
      } else {
        if (s.finalLetterGrade !== gradeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesEmail = s.email.toLowerCase().includes(q);
        const matchesCourse = s.courseTitle.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCourse) return false;
      }

      return true;
    });
  }, [students, gradeFilter, courseFilter, searchQuery]);

  const gradeTabs: Array<{ key: string; label: string; count: number; color: string }> = [
    { key: "ALL", label: "All Completed", count: counts.ALL, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { key: "A", label: "Grade A", count: counts.A, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { key: "B", label: "Grade B", count: counts.B, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { key: "C", label: "Grade C", count: counts.C, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { key: "D", label: "Grade D", count: counts.D, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { key: "F", label: "Grade F", count: counts.F, color: "text-rose-700 bg-rose-50 border-rose-200" },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS, color: "text-gray-700 bg-gray-100 border-gray-200" },
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              <FiAward />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1E293B]">
                Final Course Grades & Student Breakdown
              </h2>
              <p className="text-xs text-gray-400">
                Individual final scores, GPA points, and completion metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3 shrink-0">
          {/* Top row: Search and Course selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-xs text-gray-700 rounded-xl py-2 pl-8 pr-3 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-medium"
              />
            </div>

            {uniqueCourses.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Course:</span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Assigned Courses</option>
                  {uniqueCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Grade filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {gradeTabs.map((tab) => {
              const isActive = gradeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGradeFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Roster List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FiUser className="text-3xl text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">No Students Found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {searchQuery
                  ? `No students match "${searchQuery}"`
                  : `No students in "${gradeFilter}" category.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-1 text-[10px] font-bold uppercase text-gray-400">
                <div className="col-span-4">Student & Course</div>
                <div className="col-span-3 text-center">Requirements Status</div>
                <div className="col-span-2 text-center">Final Score</div>
                <div className="col-span-1 text-center">Grade</div>
                <div className="col-span-2 text-right">GPA Point</div>
              </div>

              {filteredStudents.map((student, idx) => {
                return (
                  <div
                    key={student.enrollmentId || student.studentId || idx}
                    className="p-3.5 bg-white rounded-xl border border-gray-200 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:items-center hover:border-gray-300 transition shadow-2xs"
                  >
                    {/* Student Info */}
                    <div className="sm:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-100">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{student.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded truncate max-w-[200px]">
                          {student.courseTitle}
                        </span>
                      </div>
                    </div>

                    {/* Requirements Status */}
                    <div className="sm:col-span-3 flex flex-col items-start sm:items-center justify-center text-xs">
                      {student.isCompleted ? (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                          <FiCheckCircle className="text-emerald-600" />
                          <span>All Requirements Done</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                          <FiClock className="text-amber-600" />
                          <span>
                            {student.completedAssignments}/{student.totalAssignments} Tasks
                            {student.totalExams > 0 && ` & ${student.completedExams}/${student.totalExams} Exam`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Final Score */}
                    <div className="sm:col-span-2 flex flex-col items-start sm:items-center justify-center">
                      {student.finalGrade !== null ? (
                        <div>
                          <span className="text-sm font-black text-gray-900">
                            {student.finalGrade}%
                          </span>
                          <span className="text-[10px] text-gray-400 block font-medium">Final Course Mark</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">In Progress</span>
                      )}
                    </div>

                    {/* Letter Grade */}
                    <div className="sm:col-span-1 flex items-center sm:justify-center">
                      {student.isCompleted ? (
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-black border uppercase text-center min-w-[32px] ${student.finalGradeColor}`}
                        >
                          {student.finalLetterGrade}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                          —
                        </span>
                      )}
                    </div>

                    {/* GPA Point */}
                    <div className="sm:col-span-2 flex items-center justify-end">
                      {student.gpaPoint !== null ? (
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            {student.gpaPoint.toFixed(1)} / 4.0
                          </span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 font-medium">Grade Points</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-white shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredStudents.length}</strong> of {students.length} enrolled student(s)
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
