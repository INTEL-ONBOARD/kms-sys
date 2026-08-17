"use client";

import { useState, useEffect } from "react";
import { FiAward, FiCheckCircle, FiSearch, FiEdit3, FiX, FiFileText, FiUser, FiBook } from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

export default function LecturerGradebookPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [gradingItem, setGradingItem] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/lecturer/grading-queue");
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      }
    } catch (err) {
      console.error("Failed to load gradebook:", err);
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

    if (gradeValue.trim() === "" || isNaN(Number(gradeValue)) || Number(gradeValue) < 0 || Number(gradeValue) > 100) {
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
          grade: gradeValue,
          feedback,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully graded submission for ${gradingItem.studentName}`);
        handleCloseGradeModal();
        fetchQueue();
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

  const filtered = queue.filter(
    (item) =>
      item.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Gradebook & Evaluation</h1>
          <p className="text-xs text-gray-400 mt-1">Review student submissions, assign grades, and give feedback</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by student, assignment..."
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
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Assignment</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No pending submissions found in queue
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F7FAFC] transition">
                    <td className="px-6 py-4 font-bold text-[#111827]">{item.studentName}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{item.assignmentTitle}</td>
                    <td className="px-6 py-4 text-gray-500">{item.courseTitle}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(item.submittedAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.isOverdue ? "Overdue" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenGradeModal(item)}
                        className="px-3 py-1.5 bg-[#2563EB] text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
                      >
                        Grade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal Overlay */}
      {gradingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <FiAward className="text-[#2563EB]" /> Grade Submission
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Evaluate student work and assign score</p>
              </div>
              <button
                onClick={handleCloseGradeModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Submission Info Cards */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <FiUser className="text-gray-400" /> Student:
                </span>
                <span className="font-bold text-gray-800">{gradingItem.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <FiFileText className="text-gray-400" /> Assignment:
                </span>
                <span className="font-semibold text-gray-700 text-right truncate max-w-[220px]">
                  {gradingItem.assignmentTitle}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium flex items-center gap-1.5">
                  <FiBook className="text-gray-400" /> Course:
                </span>
                <span className="font-semibold text-gray-600 text-right truncate max-w-[220px]">
                  {gradingItem.courseTitle}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Grade Score (0 – 100) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="e.g. 85"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl py-2.5 pl-4 pr-10 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Written Feedback
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide constructive feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseGradeModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Submitting..." : "Submit Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

