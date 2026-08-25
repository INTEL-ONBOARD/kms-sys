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
  const [courses, setCourses] = useState<Array<{ 
    _id: string; 
    title: string; 
    assessmentItems?: Array<{ name: string; type: string; weight: number }>;
  }>>([]);

  const isEdit = Boolean(initialExam && initialExam._id);

  // Helper to extract local date, start time, and end time strings
  const getInitialDateTime = (dateVal?: string, durationMins?: number) => {
    if (!dateVal) {
      return { date: "", startTime: "09:00", endTime: "11:00" };
    }
    const startDate = new Date(dateVal);
    if (isNaN(startDate.getTime())) {
      return { date: "", startTime: "09:00", endTime: "11:00" };
    }
    const dur = durationMins && durationMins > 0 ? durationMins : 120;
    const endDate = new Date(startDate.getTime() + dur * 60 * 1000);

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");

    const startHours = String(startDate.getHours()).padStart(2, "0");
    const startMinutes = String(startDate.getMinutes()).padStart(2, "0");

    const endHours = String(endDate.getHours()).padStart(2, "0");
    const endMinutes = String(endDate.getMinutes()).padStart(2, "0");

    return {
      date: `${year}-${month}-${day}`,
      startTime: `${startHours}:${startMinutes}`,
      endTime: `${endHours}:${endMinutes}`,
    };
  };

  const initialDt = getInitialDateTime(initialExam?.date, initialExam?.duration);

  const [title, setTitle] = useState(initialExam?.title || "");
  const [courseId, setCourseId] = useState(
    typeof initialExam?.courseId === "object" ? initialExam?.courseId?._id : initialExam?.courseId || ""
  );

  const [date, setDate] = useState(initialDt.date);
  const [startTime, setStartTime] = useState(initialDt.startTime);
  const [endTime, setEndTime] = useState(initialDt.endTime);
  const [location, setLocation] = useState(initialExam?.location || "Online Hall A");
  const [type, setType] = useState<"quiz" | "midterm" | "final" | "practical">(
    (initialExam?.type as any) || "midterm"
  );
  const [status, setStatus] = useState<"scheduled" | "ongoing" | "completed" | "cancelled">(
    (initialExam?.status as any) || "scheduled"
  );

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const calculateDurationMinutes = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  };

  const durationMinutes = calculateDurationMinutes(startTime, endTime);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/lecturer/courses?limit=50");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || []);
          if (!courseId && data.data && data.data.length > 0) {
            setCourseId(data.data[0]._id);
            const firstExamItems = (data.data[0].assessmentItems || []).filter((i: any) => i.type === "exam");
            if (firstExamItems.length > 0 && !title) {
              setTitle(firstExamItems[0].name);
              setType(firstExamItems[0].name.toLowerCase().includes("final") ? "final" : "midterm");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load courses for exam modal:", err);
      }
    };
    fetchCourses();
  }, [courseId, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Please select an exam component from the Course Grade Breakdown");
      return;
    }

    if (!date) {
      toast.warning("Exam date is required");
      return;
    }

    if (!startTime) {
      toast.warning("Exam start time is required");
      return;
    }

    if (!endTime) {
      toast.warning("Exam end time is required");
      return;
    }

    const calculatedDur = calculateDurationMinutes(startTime, endTime);
    if (calculatedDur <= 0) {
      toast.error("End time must be later than start time.");
      return;
    }
    if (calculatedDur < 15) {
      toast.error("Exam duration must be at least 15 minutes.");
      return;
    }

    // Construct local Date object to preserve user's intended time precisely
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = (startTime || "09:00").split(":").map(Number);
    const examDateTime = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(examDateTime.getTime())) {
      toast.error("Invalid exam date or start time format");
      return;
    }

    // Allow 2-minute buffer for form submission delay
    if (examDateTime.getTime() < Date.now() - 2 * 60 * 1000) {
      toast.error("Exam date and start time cannot be in the past. Please select a valid future schedule.");
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
            date: examDateTime.toISOString(),
            duration: calculatedDur,
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
            date: examDateTime.toISOString(),
            duration: calculatedDur,
            location,
            type,
          }),
        });

        if (res.ok) {
          toast.success(`Exam "${title}" scheduled successfully!`);
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

  const selectedCourseObj = courses.find((c) => c._id === courseId);
  const examBreakdownItems = (selectedCourseObj?.assessmentItems || []).filter((i: any) => i.type === "exam");

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
              {isEdit ? "Reschedule / Edit Exam" : "Schedule New Exam"}
            </h3>
            <p className="text-xs text-[#A0AEC0]">
              {isEdit
                ? "Update exam date, time window, venue, or status (students will receive real-time alerts)"
                : "Schedule exam date, start & end time, and venue from Course Grade Breakdown"}
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
                onChange={(e) => {
                  const newCId = e.target.value;
                  setCourseId(newCId);
                  const matchedC = courses.find(c => c._id === newCId);
                  const exItems = (matchedC?.assessmentItems || []).filter((i: any) => i.type === "exam");
                  if (exItems.length > 0) {
                    setTitle(exItems[0].name);
                    setType(exItems[0].name.toLowerCase().includes("final") ? "final" : "midterm");
                  } else {
                    setTitle("");
                  }
                }}
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

          {/* Exam Title / Selection from Grade Breakdown */}
          {!isEdit ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Exam Component <span className="text-purple-600 font-bold">(From Course Grade Breakdown)</span>
              </label>

              {examBreakdownItems.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold">No exam components configured in Grade Breakdown.</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Please add an Exam component in Course Assessment & Grade Breakdown under Course Management.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={title}
                  onChange={(e) => {
                    const selName = e.target.value;
                    setTitle(selName);
                    setType(selName.toLowerCase().includes("final") ? "final" : "midterm");
                  }}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#1E293B] outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC] cursor-pointer"
                >
                  <option value="">-- Select Configured Exam Item --</option>
                  {examBreakdownItems.map((item, idx) => (
                    <option key={idx} value={item.name}>
                      {item.name} ({item.weight}% Grade Weight &bull; Exam)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          )}

          {/* Date and Category */}
          <div className="grid grid-cols-2 gap-3">
            {/* Exam Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={todayDateStr}
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (newDate === todayDateStr && startTime && startTime < currentTimeStr) {
                    setStartTime(currentTimeStr);
                  }
                }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>

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
          </div>

          {/* Start Time and End Time */}
          <div className="grid grid-cols-2 gap-3">
            {/* Exam Start Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                min={date === todayDateStr ? currentTimeStr : undefined}
                value={startTime}
                onChange={(e) => {
                  const newTime = e.target.value;
                  if (date === todayDateStr && newTime < currentTimeStr) {
                    toast.warning("Start time cannot be in the past for today's exam.");
                    setStartTime(currentTimeStr);
                  } else {
                    setStartTime(newTime);
                  }
                }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>

            {/* Exam End Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          </div>

          {/* Calculated Duration Indicator */}
          {durationMinutes > 0 ? (
            <div className="text-[11px] text-purple-700 bg-purple-50/70 border border-purple-100 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span className="font-semibold">
                Exam Time Window: <span className="font-bold">{startTime} – {endTime}</span>
              </span>
              <span className="font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                {Math.floor(durationMinutes / 60) > 0 ? `${Math.floor(durationMinutes / 60)}h ` : ""}
                {durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ""} ({durationMinutes} mins)
              </span>
            </div>
          ) : durationMinutes <= 0 && startTime && endTime ? (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 font-semibold">
              End time must be after start time.
            </div>
          ) : null}

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Venue</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Online Hall A, Room 302, or Lab 4"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
            />
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
                <option value="rescheduled">Rescheduled</option>
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
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : isEdit ? "Reschedule & Notify Students" : "Schedule Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
