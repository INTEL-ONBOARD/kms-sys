"use client";

import { useState } from "react";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface GradingQueueItemProps {
  item: {
    _id: string;
    assignmentTitle: string;
    courseTitle: string;
    studentName: string;
    dueDate: string;
    isOverdue: boolean;
    overdueDays?: number;
    submittedAt?: string;
    content?: string;
  };
  onGraded?: () => void;
}

export default function GradingQueueItem({ item, onGraded }: GradingQueueItemProps) {
  const toast = useToast();
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeInput) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: item._id,
          grade: Number(gradeInput),
          feedback: feedbackInput,
        }),
      });

      if (res.ok) {
        toast.success("Submission graded successfully!");
        setShowGradingModal(false);
        if (onGraded) onGraded();
      } else {
        toast.error("Failed to submit grade");
      }
    } catch (err) {
      toast.error("Error submitting grade");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
          item.isOverdue
            ? "border-red-200 bg-red-50/40 hover:bg-red-50/70"
            : "border-gray-100 bg-[#F7FAFC] hover:bg-gray-100/60"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <h4 className="font-bold text-[#111827] text-sm">{item.assignmentTitle}</h4>
            </div>
            <p className="text-xs text-gray-500 ml-4 mt-0.5">{item.courseTitle}</p>
          </div>

          {item.isOverdue ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              Overdue by {item.overdueDays || 1} day(s)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              Due {formatDate(item.dueDate)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-200/40 mt-2 text-xs">
          <span className="font-semibold text-gray-700">By: {item.studentName}</span>
          <button
            onClick={() => setShowGradingModal(true)}
            className="px-3 py-1.5 bg-[#2563EB] text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
          >
            Grade Now
          </button>
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-[#111827] mb-1">Grade Submission</h3>
            <p className="text-xs text-gray-500 mb-4">
              {item.assignmentTitle} — <span className="font-semibold">{item.studentName}</span>
            </p>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grade (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="e.g. 88"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Optional comments for student..."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                >
                  {submitting ? "Saving..." : "Submit Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
