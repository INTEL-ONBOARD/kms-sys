"use client";

import { useState, useEffect } from "react";
import { FiX, FiFileText } from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface ExamData {
  _id?: string;
  title?: string;
  courseId?: any;
  date?: string;
  duration?: number;
  location?: string;
  type?: string;
  status?: string;
}

interface CreateExamModalProps {
  initialExam?: ExamData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateExamModal({ initialExam, onClose, onSuccess }: CreateExamModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);

  const isEdit = Boolean(initialExam && initialExam._id);

  const [title, setTitle] = useState(initialExam?.title || "");
  const [courseId, setCourseId] = useState(
    typeof initialExam?.courseId === "object" ? initialExam?.courseId?._id : initialExam?.courseId || ""
  );

  const formattedInitialDate = initialExam?.date
    ? new Date(initialExam.date).toISOString().split("T")[0]
    : "";

  const [date, setDate] = useState(formattedInitialDate);
  const [duration, setDuration] = useState(initialExam?.duration ? String(initialExam.duration) : "90");
  const [location, setLocation] = useState(initialExam?.location || "Online Hall A");
  const [type, setType] = useState<"quiz" | "midterm" | "final" | "practical">(
    (initialExam?.type as any) || "midterm"
  );
  const [status, setStatus] = useState<"scheduled" | "ongoing" | "completed" | "cancelled">(
    (initialExam?.status as any) || "scheduled"
  );

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/lecturer/courses?limit=50");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || []);
          if (!courseId && data.data && data.data.length > 0) {
            setCourseId(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load courses for exam modal:", err);
      }
    };
    fetchCourses();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Exam title is required");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch("/api/lecturer/exams", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: initialExam?._id,
            title,
            courseId,
            date,
            duration,
            location,
            type,
            status,
          }),
        });

        if (res.ok) {
          toast.success(`Exam parameters updated successfully!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to update exam");
        }
      } else {
        const res = await fetch("/api/lecturer/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            courseId,
            date,
            duration,
            location,
            type,
          }),
        });

        if (res.ok) {
          toast.success(`Exam "${title}" created successfully!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to create exam");
        }
      }
    } catch (err) {
      toast.error("Error saving exam details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transform transition-all scale-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 transition"
        >
          <FiX className="text-xl" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <FiFileText />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D3748]">
              {isEdit ? "Edit Exam Parameters" : "Schedule New Exam"}
            </h3>
            <p className="text-xs text-[#A0AEC0]">
              {isEdit
                ? "Update exam title, schedule, duration, or venue details"
                : "Set up exam parameters, location, and schedule for students"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Course */}
          {courses.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exam Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Software Architecture Examination"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Exam Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Category</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
              >
                <option value="midterm">Midterm Exam</option>
                <option value="final">Final Exam</option>
                <option value="quiz">Quiz</option>
                <option value="practical">Practical Exam</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Online Hall A or Lab 4"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          </div>

          {/* Status selection if editing */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed / Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 shadow-sm transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEdit ? "Save Parameters" : "Schedule Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
