"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiBookOpen,
  FiUsers,
  FiClipboard,
  FiVideo,
  FiEdit,
  FiCheckCircle,
  FiPlus
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";
import QuickActionModal from "./QuickActionModal";

interface CourseManageModalProps {
  course: {
    _id: string;
    title: string;
    category: string;
    description?: string;
    studentCount: number;
    avgCompletion: number;
    assignmentCount: number;
    status?: string;
    published?: boolean;
  };
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CourseManageModal({ course, onClose, onUpdate }: CourseManageModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "classes" | "students">("overview");

  // Form states
  const [description, setDescription] = useState(course.description || "Comprehensive course curriculum.");
  const [published, setPublished] = useState(course.published ?? true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Quick Action Modal state for course-specific action
  const [quickModalType, setQuickModalType] = useState<"assignment" | "class" | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoadingData(true);
      try {
        const [assignRes, classRes] = await Promise.all([
          fetch("/api/lecturer/assignments?limit=50"),
          fetch("/api/lecturer/schedule?all=true"),
        ]);

        if (assignRes.ok) {
          const assignData = await assignRes.json();
          const filteredAssign = (assignData.assignments || []).filter(
            (a: any) => a.courseId?._id === course._id || a.courseId === course._id
          );
          setAssignments(filteredAssign);
        }

        if (classRes.ok) {
          const classData = await classRes.json();
          const filteredClasses = (classData.schedule || []).filter(
            (c: any) => c.courseId?._id === course._id || c.courseId === course._id
          );
          setLiveClasses(filteredClasses);
        }

        // Mock enrolled students for this course
        setStudents([
          { id: "1", name: "Alex Johnson", email: "alex.johnson@student.edu", progress: 88 },
          { id: "2", name: "Sarah Miller", email: "sarah.m@student.edu", progress: 94 },
          { id: "3", name: "David Chen", email: "david.c@student.edu", progress: 76 },
        ]);
      } catch (err) {
        console.error("Failed to load course detail data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCourseDetails();
  }, [course._id]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      toast.success(`Course "${course.title}" updated successfully!`);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in font-sans">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#F7FAFC]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EEF2FF] text-[#5A67D8]">
                  {course.category}
                </span>
                <span className="text-xs text-[#A0AEC0] font-semibold">
                  WISE-{course._id.substring(0, 4).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#2D3748]">{course.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 px-6 bg-white text-xs font-bold text-gray-500 gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-[#5A67D8] text-[#5A67D8]"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              <FiBookOpen /> Overview & Settings
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === "assignments"
                  ? "border-[#5A67D8] text-[#5A67D8]"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              <FiClipboard /> Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`py-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === "classes"
                  ? "border-[#5A67D8] text-[#5A67D8]"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              <FiVideo /> Live Classes ({liveClasses.length})
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`py-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === "students"
                  ? "border-[#5A67D8] text-[#5A67D8]"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              <FiUsers /> Students ({course.studentCount || students.length})
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.studentCount}</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Enrolled Students</p>
                  </div>
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.avgCompletion}%</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Avg Completion</p>
                  </div>
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.assignmentCount}</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Total Tasks</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">Course Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3748]">Course Visibility</h4>
                    <p className="text-[11px] text-[#A0AEC0]">Allow enrolled students to access learning materials</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A67D8]"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: ASSIGNMENTS */}
            {activeTab === "assignments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#2D3748]">Course Assignments</h3>
                  <button
                    onClick={() => setQuickModalType("assignment")}
                    className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1"
                  >
                    <FiPlus /> Create Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-xs text-[#A0AEC0] text-center py-8">No assignments created for this course yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div key={a._id} className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-[#2D3748]">{a.title}</p>
                          <span className="text-[10px] text-[#A0AEC0]">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#5A67D8] rounded font-bold text-[10px]">
                          {a.submissionsCount || 0} Submissions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LIVE CLASSES */}
            {activeTab === "classes" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#2D3748]">Scheduled Live Classes</h3>
                  <button
                    onClick={() => setQuickModalType("class")}
                    className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1"
                  >
                    <FiPlus /> Schedule Class
                  </button>
                </div>

                {liveClasses.length === 0 ? (
                  <p className="text-xs text-[#A0AEC0] text-center py-8">No live classes scheduled for this course.</p>
                ) : (
                  <div className="space-y-2">
                    {liveClasses.map((c) => (
                      <div key={c._id} className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-[#2D3748]">{c.title}</p>
                          <span className="text-[10px] text-[#A0AEC0]">
                            {new Date(c.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px] uppercase">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STUDENTS */}
            {activeTab === "students" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#2D3748]">Enrolled Students Roster</h3>
                {students.map((s) => (
                  <div key={s.id} className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#2D3748]">{s.name}</p>
                      <p className="text-[10px] text-[#A0AEC0]">{s.email}</p>
                    </div>
                    <span className="font-bold text-[#5A67D8]">{s.progress}% Progress</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-[#F7FAFC] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
            >
              Close
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-5 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Course Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Modal Trigger inside CourseManageModal */}
      {quickModalType && (
        <QuickActionModal
          type={quickModalType}
          onClose={() => setQuickModalType(null)}
          onSuccess={() => {
            // refresh data
            toast.success("Action completed!");
          }}
        />
      )}
    </>
  );
}
