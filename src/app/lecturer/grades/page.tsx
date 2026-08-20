"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiAward, 
  FiCheckCircle, 
  FiEdit3, 
  FiX, 
  FiFileText, 
  FiUser, 
  FiBook, 
  FiExternalLink, 
  FiDownload, 
  FiClock, 
  FiAlertCircle,
  FiPaperclip,
  FiTrendingUp,
  FiCheckSquare,
  FiRefreshCw,
  FiFilter,
  FiMessageSquare
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

export default function LecturerGradebookPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "graded">("pending");
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [gradedQueue, setGradedQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedGradeRange, setSelectedGradeRange] = useState("All");

  const [gradingItem, setGradingItem] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lecturer/grading-queue");
      if (res.ok) {
        const data = await res.json();
        const pending = data.pendingQueue || data.queue || [];
        const graded = data.gradedQueue || [];
        setPendingQueue(pending);
        setGradedQueue(graded);
      }
    } catch (err) {
      console.error("Failed to load gradebook:", err);
      toast.error("Failed to load gradebook data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenGradeModal = (item: any) => {
    setGradingItem(item);
    setGradeValue(item.grade !== undefined && item.grade !== null ? item.grade.toString() : "");
    setFeedback(item.feedback || "");
  };

  const handleCloseGradeModal = () => {
    setGradingItem(null);
    setGradeValue("");
    setFeedback("");
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingItem) return;

    const numGrade = Number(gradeValue);
    if (gradeValue.trim() === "" || isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Please enter a valid grade between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/grade-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingItem._id,
          grade: numGrade,
          feedback,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully saved grade for ${gradingItem.studentName}`);
        handleCloseGradeModal();
        await fetchQueue();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to submit grade");
      }
    } catch (err) {
      console.error("Grade submit error:", err);
      toast.error("Failed to submit grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      const clean = decodeURIComponent(lastPart).replace(/^\d+-[a-f0-9-]+-/, "");
      return clean || "Submitted_Document.pdf";
    } catch {
      return "Submitted_Document.pdf";
    }
  };

  // Distinct courses from both queues
  const coursesList = useMemo(() => {
    const allCourses = [...pendingQueue, ...gradedQueue].map((item) => item.courseTitle).filter(Boolean);
    return Array.from(new Set(allCourses));
  }, [pendingQueue, gradedQueue]);

  // Average score of graded students
  const averageGrade = useMemo(() => {
    if (gradedQueue.length === 0) return 0;
    const sum = gradedQueue.reduce((acc, curr) => acc + (Number(curr.grade) || 0), 0);
    return Math.round((sum / gradedQueue.length) * 10) / 10;
  }, [gradedQueue]);

  // Filtered pending submissions
  const filteredPending = useMemo(() => {
    return pendingQueue.filter((item) => {
      if (selectedCourse !== "All" && item.courseTitle !== selectedCourse) return false;
      return true;
    });
  }, [pendingQueue, selectedCourse]);

  // Filtered graded submissions
  const filteredGraded = useMemo(() => {
    return gradedQueue.filter((item) => {
      if (selectedCourse !== "All" && item.courseTitle !== selectedCourse) return false;
      
      const grade = Number(item.grade);
      if (selectedGradeRange === "90-100" && (grade < 90 || grade > 100)) return false;
      if (selectedGradeRange === "80-89" && (grade < 80 || grade >= 90)) return false;
      if (selectedGradeRange === "70-79" && (grade < 70 || grade >= 80)) return false;
      if (selectedGradeRange === "below-70" && grade >= 70) return false;

      return true;
    });
  }, [gradedQueue, selectedCourse, selectedGradeRange]);

  const getGradeBadge = (grade: number) => {
    if (grade >= 85) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (grade >= 70) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (grade >= 50) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100/60">
        <div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2.5">
            <FiAward className="text-[#5A67D8]" /> Gradebook & Evaluation
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review student submissions, evaluate deliverables, and track past graded student records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchQueue()}
            title="Refresh gradebook"
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <FiRefreshCw className={`text-xs ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 font-bold">
            <FiClock />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-xl font-black text-[#1E293B] mt-0.5">{pendingQueue.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 font-bold">
            <FiCheckSquare />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Past Graded Students</p>
            <h3 className="text-xl font-black text-[#1E293B] mt-0.5">{gradedQueue.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl shrink-0 font-bold">
            <FiTrendingUp />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Score</p>
            <h3 className="text-xl font-black text-[#1E293B] mt-0.5">
              {gradedQueue.length > 0 ? `${averageGrade}%` : "N/A"}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 font-bold">
            <FiBook />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Courses</p>
            <h3 className="text-xl font-black text-[#1E293B] mt-0.5">{coursesList.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-gray-100/70 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "pending"
                ? "bg-white text-[#111827] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiClock />
            <span>Pending Evaluation</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === "pending" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-600"
            }`}>
              {pendingQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("graded")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "graded"
                ? "bg-white text-[#111827] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiCheckCircle />
            <span>Past Graded Students</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === "graded" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
            }`}>
              {gradedQueue.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Course filter */}
          {coursesList.length > 0 && (
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-[#F7FAFC] border border-gray-200 text-xs font-semibold text-gray-700 py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer"
            >
              <option value="All">All Courses ({coursesList.length})</option>
              {coursesList.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          )}

          {/* Grade Range Filter (Visible in Graded Tab) */}
          {activeTab === "graded" && (
            <select
              value={selectedGradeRange}
              onChange={(e) => setSelectedGradeRange(e.target.value)}
              className="bg-[#F7FAFC] border border-gray-200 text-xs font-semibold text-gray-700 py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer"
            >
              <option value="All">All Grades</option>
              <option value="90-100">90% – 100% (Grade A)</option>
              <option value="80-89">80% – 89% (Grade B)</option>
              <option value="70-79">70% – 79% (Grade C)</option>
              <option value="below-70">Below 70%</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFC] border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              {activeTab === "pending" ? (
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Submitted Documents</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Assignment & Course</th>
                  <th className="px-6 py-4">Submitted Documents</th>
                  <th className="px-6 py-4">Awarded Grade</th>
                  <th className="px-6 py-4">Feedback & Remarks</th>
                  <th className="px-6 py-4">Graded Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : activeTab === "pending" ? (
                filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                        ✓
                      </div>
                      <p className="font-bold text-gray-700 text-sm">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">No pending student submissions waiting for evaluation.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((item) => (
                    <tr key={item._id} className="hover:bg-[#F7FAFC] transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#111827]">{item.studentName}</div>
                        {item.studentEmail && (
                          <div className="text-[10px] text-gray-400">{item.studentEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{item.assignmentTitle}</td>
                      <td className="px-6 py-4 text-gray-500">{item.courseTitle}</td>
                      <td className="px-6 py-4">
                        {item.files && item.files.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <FiPaperclip className="text-xs" />
                            {item.files.length} {item.files.length === 1 ? "File" : "Files"}
                          </span>
                        ) : item.content ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <FiFileText className="text-xs" />
                            Written Text
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">No attachments</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(item.submittedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.isOverdue ? "Submitted Late" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenGradeModal(item)}
                          className="px-3.5 py-1.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                        >
                          <FiEdit3 className="text-xs" /> Review & Grade
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredGraded.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                        <FiAward />
                      </div>
                      <p className="font-bold text-gray-700 text-sm">No graded student records found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Graded submissions will appear here with student grades, feedback, and deliverables.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGraded.map((item) => {
                    const gradeNumber = Number(item.grade) || 0;
                    return (
                      <tr key={item._id} className="hover:bg-[#F7FAFC] transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#111827]">{item.studentName}</div>
                          {item.studentEmail && (
                            <div className="text-[10px] text-gray-400">{item.studentEmail}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{item.assignmentTitle}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{item.courseTitle}</div>
                        </td>

                        <td className="px-6 py-4">
                          {item.files && item.files.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              <FiPaperclip className="text-xs" />
                              {item.files.length} {item.files.length === 1 ? "File" : "Files"}
                            </span>
                          ) : item.content ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <FiFileText className="text-xs" />
                              Written Text
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No files</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${getGradeBadge(gradeNumber)}`}>
                            <FiAward className="text-xs" />
                            {gradeNumber} / {item.maxPoints || 100} ({Math.round((gradeNumber / (item.maxPoints || 100)) * 100)}%)
                          </span>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          {item.feedback ? (
                            <div className="flex items-start gap-1.5 text-gray-600">
                              <FiMessageSquare className="text-gray-400 text-xs shrink-0 mt-0.5" />
                              <p className="line-clamp-2 text-[11px] leading-relaxed" title={item.feedback}>
                                {item.feedback}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No feedback written</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                          {new Date(item.gradedAt || item.submittedAt || Date.now()).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenGradeModal(item)}
                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-[#5A67D8] hover:text-white text-gray-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
                            title="Edit grade or feedback"
                          >
                            <FiEdit3 className="text-xs" /> Edit Grade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading & Evaluation Modal */}
      {gradingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
                  <FiAward className="text-[#5A67D8]" /> 
                  {gradingItem.grade !== null && gradingItem.grade !== undefined 
                    ? "Update Student Evaluation & Grade" 
                    : "Review & Evaluate Submission"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Examine submitted documents, rubric fulfillment, and assign or update student score
                </p>
              </div>
              <button
                onClick={handleCloseGradeModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Submission Overview Card */}
            <div className="bg-[#F8FAFC] border border-gray-200/70 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Student</span>
                <p className="font-extrabold text-gray-800 flex items-center gap-1.5">
                  <FiUser className="text-[#5A67D8]" /> {gradingItem.studentName}
                </p>
                {gradingItem.studentEmail && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{gradingItem.studentEmail}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Course & Assessment</span>
                <p className="font-extrabold text-gray-800 truncate" title={gradingItem.assignmentTitle}>
                  {gradingItem.assignmentTitle}
                </p>
                <p className="text-[11px] text-gray-500 truncate" title={gradingItem.courseTitle}>
                  {gradingItem.courseTitle}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Submission Date</span>
                <p className="font-bold text-gray-700 flex items-center gap-1">
                  <FiClock className="text-gray-400" /> {new Date(gradingItem.submittedAt || Date.now()).toLocaleString()}
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  gradingItem.isOverdue ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {gradingItem.isOverdue ? "Submitted Late" : "Submitted On-Time"}
                </span>
              </div>
            </div>

            {/* STUDENT SUBMITTED DELIVERABLES & DOCUMENTS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FiPaperclip className="text-[#5A67D8]" /> Student Submitted Files & Deliverables
                </h4>
                {gradingItem.files && gradingItem.files.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {gradingItem.files.length} Attached {gradingItem.files.length === 1 ? "Item" : "Items"}
                  </span>
                )}
              </div>

              {/* Files List */}
              {gradingItem.files && gradingItem.files.length > 0 ? (
                <div className="space-y-2">
                  {gradingItem.files.map((fileUrl: string, idx: number) => {
                    const fileName = getFileNameFromUrl(fileUrl);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-9 h-9 rounded-xl bg-[#5A67D8] text-white flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            <FiFileText />
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-xs text-blue-950 truncate max-w-xs sm:max-w-md">
                              {fileName}
                            </p>
                            <p className="text-[10px] text-blue-600 font-medium truncate max-w-xs sm:max-w-md">
                              {fileUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                          <a
                            href={`/api/lecturer/submissions/${gradingItem._id}/file?index=${idx}&action=view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-[#5A67D8] hover:bg-[#434190] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs flex-1 sm:flex-initial"
                          >
                            <FiExternalLink /> Open Document
                          </a>
                          <a
                            href={`/api/lecturer/submissions/${gradingItem._id}/file?index=${idx}&action=download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Download File"
                          >
                            <FiDownload />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !gradingItem.content && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60 text-center text-gray-400 text-xs">
                    No attachments or files submitted for this task.
                  </div>
                )
              )}

              {/* Written Response Content */}
              {gradingItem.content && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500">Student Written Notes / Overview:</span>
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {gradingItem.content}
                  </div>
                </div>
              )}
            </div>

            {/* GRADING & EVALUATION FORM */}
            <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2 border-t border-gray-100">
              <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiAward className="text-[#5A67D8]" /> Award Score & Evaluation Feedback
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Awarded Score (0 – 100%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="e.g. 88"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl py-2.5 pl-4 pr-12 outline-none focus:border-[#5A67D8] focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-extrabold">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Lecturer Feedback & Guidance <span className="text-gray-400 font-normal">(Visible to student upon publishing)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback on strengths, rubric criteria fulfilled, or areas to improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-3 outline-none focus:border-[#5A67D8] focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseGradeModal}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#5A67D8] hover:bg-[#434190] shadow-md rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  <FiCheckCircle className="text-sm" />
                  {isSubmitting 
                    ? "Saving Grade..." 
                    : gradingItem.grade !== null && gradingItem.grade !== undefined 
                      ? "Update Grade & Feedback" 
                      : "Publish Grade & Feedback"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
