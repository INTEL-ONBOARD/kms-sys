"use client";

import { useState } from "react";
import { FiUsers, FiClipboard, FiArrowRight } from "react-icons/fi";
import CourseManageModal from "./CourseManageModal";

interface CourseCardLecturerProps {
  course: {
    _id: string;
    title: string;
    category: string;
    studentCount: number;
    avgCompletion: number;
    assignmentCount: number;
    description?: string;
    status?: string;
    published?: boolean;
    assessmentItems?: Array<{
      _id?: string;
      name: string;
      type?: string;
      weight: number;
    }>;
    gradingBreakdown?: {
      assignmentsWeight?: number;
      courseWorkWeight?: number;
      finalExamWeight?: number;
      attendanceWeight?: number;
    };
  };
  onUpdate?: () => void;
}

export default function CourseCardLecturer({ course, onUpdate }: CourseCardLecturerProps) {
  const [showManageModal, setShowManageModal] = useState(false);

  // Deterministic color banner generation
  const banners = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-teal-500 to-emerald-600",
    "from-amber-500 to-orange-600",
  ];
  const charCodeSum = course.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bannerGradient = banners[charCodeSum % banners.length];

  const courseCode = `WISE-${course._id.substring(0, 4).toUpperCase()} / ${course.category}`;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
        <div>
          {/* Banner */}
          <div className={`h-2 rounded-full bg-gradient-to-r ${bannerGradient} mb-4`} />

          <div className="flex justify-between items-start mb-2 gap-2">
            <div>
              <h4 className="font-bold text-[#2D3748] text-base line-clamp-1">{course.title}</h4>
              <p className="text-[11px] font-semibold text-[#A0AEC0] mt-0.5">{courseCode}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
              (course.published !== false && course.status !== "draft")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {(course.published !== false && course.status !== "draft") ? "Published" : "Draft (Hidden)"}
            </span>
          </div>

          {/* Completion Progress Bar */}
          <div className="my-4">
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-[#A0AEC0]">Class Avg. Progress</span>
              <span className="text-[#5A67D8]">{course.avgCompletion}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A67D8] rounded-full transition-all duration-500"
                style={{ width: `${course.avgCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs">
          <div className="flex items-center space-x-3 text-gray-500 font-medium">
            <span className="flex items-center gap-1 bg-[#F7FAFC] px-2 py-1 rounded-lg">
              <FiUsers className="text-[#A0AEC0]" /> {course.studentCount} Students
            </span>
            <span className="flex items-center gap-1 bg-[#F7FAFC] px-2 py-1 rounded-lg">
              <FiClipboard className="text-[#A0AEC0]" /> {course.assignmentCount} Tasks
            </span>
          </div>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1 text-[#5A67D8] font-bold hover:underline"
          >
            Manage <FiArrowRight className="text-xs" />
          </button>
        </div>
      </div>

      {/* Course Management Modal */}
      {showManageModal && (
        <CourseManageModal
          course={course}
          onClose={() => setShowManageModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
