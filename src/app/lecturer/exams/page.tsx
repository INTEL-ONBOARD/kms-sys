"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiFileText, 
  FiPlus, 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiCheckCircle, 
  FiLayers,
  FiBookOpen,
  FiEdit3,
  FiSearch
} from "react-icons/fi";
import CreateExamModal from "@/Components/lecturer/CreateExamModal";
import CourseManageModal from "@/Components/lecturer/CourseManageModal";
import { useToast } from "@/Components/ToastProvider";

interface CourseItem {
  _id: string;
  title: string;
  category?: string;
  assessmentItems?: Array<{
    name: string;
    type: string;
    weight: number;
  }>;
}

interface ExamItem {
  _id: string;
  title: string;
  courseId?: {
    _id: string;
    title: string;
    category?: string;
  };
  date: string;
  duration: number;
  location?: string;
  type: string;
  status: string;
  weight?: number;
}

export default function LecturerExamsPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseItem | null>(null);

  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/lecturer/exams?limit=50");
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
        if (data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
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
    fetchExams();
    fetchLecturerCourses();
  }, []);

  const handlePublishResults = async (examId: string, title: string) => {
    setPublishingId(examId);
    try {
      const res = await fetch("/api/lecturer/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          publishResults: true,
        }),
      });

      if (res.ok) {
        toast.success(`Results published for "${title}"! Students notified.`);
        fetchExams();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to publish exam results");
      }
    } catch {
      toast.error("Error publishing results");
    } finally {
      setPublishingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const eCourseId = typeof e.courseId === "object" ? e.courseId?._id : e.courseId;
      const matchesCourse = selectedCourseId === "All" || eCourseId === selectedCourseId;
      const matchesSearch = !searchQuery.trim() ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.courseId?.title && e.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCourse && matchesSearch;
    });
  }, [exams, selectedCourseId, searchQuery]);

  const activeCourse = useMemo(() => {
    if (selectedCourseId !== "All") {
      return courses.find((c) => c._id === selectedCourseId) || null;
    }
    return courses.length > 0 ? courses[0] : null;
  }, [courses, selectedCourseId]);

  const activeCourseExams = useMemo(() => {
    return (activeCourse?.assessmentItems || []).filter((i: any) => i.type === "exam");
  }, [activeCourse]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 text-purple-600 border border-purple-100">
              Exam Administration
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              Course Grade Breakdown Synced
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]">Exam Manager</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Schedule, configure, and publish exams based on configured Course Assessment & Grade Breakdowns.
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
              <FiLayers className="text-purple-600 text-sm" />
              <span>Manage Grade Breakdown</span>
            </button>
          )}

          <button
            onClick={() => {
              if (courses.length === 0) {
                toast.warning("Action Blocked: You must be assigned to a course by an administrator before scheduling exams.");
                return;
              }
              setEditingExam(null);
              setShowModal(true);
            }}
            disabled={courses.length === 0}
            title={courses.length === 0 ? "Course assignment required from Admin" : "Schedule New Exam"}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 ${
              courses.length === 0
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-95"
            }`}
          >
            <FiPlus className="text-base" /> Schedule New Exam
          </button>
        </div>
      </div>

      {/* Locked Notice if no assigned courses */}
      {!loading && courses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold">
            🔒
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Exam Scheduling Locked</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              You are not assigned to any courses yet. Once an administrator assigns courses to your profile from the Admin Panel, you will be able to schedule, manage, and publish exam results.
            </p>
          </div>
        </div>
      )}

      {/* Course Grade Breakdown Exam Components Panel */}
      {activeCourse && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                <FiLayers />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#1E293B] flex items-center gap-2">
                  <span>Exam Components in Grade Breakdown</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {activeCourse.title}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  Lecturer-configured exam components. Exams created must correspond to these allocated items.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCourseForModal(activeCourse);
                setShowCourseModal(true);
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <FiEdit3 className="text-xs" /> Edit Breakdown Weights
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {activeCourseExams.length === 0 ? (
              <div className="col-span-full py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No exam components configured yet for this course. Click &quot;Edit Breakdown Weights&quot; to add a Final Exam or Midterm Exam.
              </div>
            ) : (
              activeCourseExams.map((item, idx) => {
                const isScheduled = exams.some(
                  (e) => e.title.toLowerCase() === item.name.toLowerCase()
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      isScheduled 
                        ? "bg-purple-50/40 border-purple-100" 
                        : "bg-gray-50/60 border-dashed border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-600">
                          Exam Component #{idx + 1}
                        </span>
                        <p className="text-xs font-bold text-[#1E293B] mt-0.5">
                          {item.name}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-100 shrink-0">
                        {item.weight}% Weight
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      {isScheduled ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                          <FiCheckCircle className="text-xs" /> Scheduled in Exam Manager
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExam(null);
                            setShowModal(true);
                          }}
                          className="text-[10px] text-purple-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiPlus className="text-xs" /> Schedule Date & Venue
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">
                        Exam
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
        
        {/* Search */}
        <div className="relative flex-1 sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search scheduled exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 text-xs font-medium text-gray-700 rounded-xl py-2 pl-9 pr-3 border border-transparent focus:bg-white focus:border-purple-500 outline-none transition"
          />
        </div>

        {/* Course Filter */}
        <div className="relative">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-6 hover:bg-gray-100 transition max-w-[200px] truncate"
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

      {/* Exams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs flex flex-col items-center">
          <FiFileText className="text-5xl text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#1E293B]">No exams scheduled yet</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">Click below to schedule an exam from Course Assessment & Grade Breakdown</p>
          <button
            onClick={() => {
              setEditingExam(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition cursor-pointer"
          >
            Schedule New Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((e) => {
            const isCompleted = e.status === "completed";
            return (
              <div
                key={e._id}
                className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">
                          {e.type}
                        </span>
                        <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {e.weight || 40}% Weight
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[#1E293B] text-base mt-1">{e.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <FiBookOpen className="text-xs text-purple-600" />
                        <span className="truncate">{e.courseId?.title || "General Course"}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : e.status === "ongoing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-semibold bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="flex items-center gap-1.5"><FiCalendar className="text-purple-600" /> {formatDate(e.date)}</span>
                    <span className="flex items-center gap-1.5"><FiClock className="text-purple-600" /> {e.duration} mins</span>
                    <span className="flex items-center gap-1.5"><FiMapPin className="text-purple-600" /> {e.location || "Online"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingExam(e);
                      setShowModal(true);
                    }}
                    className="px-3.5 py-2 bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-100 transition border border-gray-200 cursor-pointer"
                  >
                    Edit Parameters
                  </button>
                  <button
                    onClick={() => handlePublishResults(e._id, e.title)}
                    disabled={publishingId === e._id || isCompleted}
                    className={`px-3.5 py-2 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-600 cursor-default"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {publishingId === e._id ? (
                      "Publishing..."
                    ) : isCompleted ? (
                      <>
                        <FiCheckCircle /> Results Published
                      </>
                    ) : (
                      "Publish Results"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {showModal && (
        <CreateExamModal
          initialExam={editingExam}
          onClose={() => {
            setShowModal(false);
            setEditingExam(null);
          }}
          onSuccess={() => {
            fetchExams();
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
            fetchExams();
            fetchLecturerCourses();
          }}
        />
      )}
    </div>
  );
}
