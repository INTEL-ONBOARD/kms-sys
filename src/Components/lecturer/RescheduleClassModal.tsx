"use client";

import { useState } from "react";
import { 
  FiX, 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiVideo, 
  FiAlertCircle,
  FiTrash2
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface RescheduleClassModalProps {
  initialClass: {
    _id: string;
    title: string;
    description?: string;
    courseId?: { _id?: string; title: string; category?: string };
    startTime: string;
    endTime: string;
    classType?: "online" | "physical";
    location?: string;
    meetingLink?: string;
    status?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RescheduleClassModal({
  initialClass,
  onClose,
  onSuccess,
}: RescheduleClassModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Extract initial date and time
  const startDate = new Date(initialClass.startTime);
  const endDate = new Date(initialClass.endTime);

  const initialDateStr = !isNaN(startDate.getTime())
    ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`
    : "";

  const initialTimeStr = !isNaN(startDate.getTime())
    ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`
    : "09:00";

  const initialDuration = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
    ? Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000)))
    : 60;

  const [title, setTitle] = useState(initialClass.title || "");
  const [date, setDate] = useState(initialDateStr);
  const [time, setTime] = useState(initialTimeStr);
  const [duration, setDuration] = useState(String(initialDuration));
  const [classType, setClassType] = useState<"online" | "physical">(initialClass.classType || "online");
  const [location, setLocation] = useState(initialClass.location || (initialClass.classType === "physical" ? "Lecture Hall 1" : ""));
  const [meetingLink, setMeetingLink] = useState(initialClass.meetingLink || "");
  const [description, setDescription] = useState(initialClass.description || "");
  const [status, setStatus] = useState<string>(initialClass.status || "upcoming");

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning("Class title is required");
      return;
    }

    if (!date || !time) {
      toast.warning("Date and start time are required to reschedule the session");
      return;
    }

    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const selectedDateTime = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(selectedDateTime.getTime()) || selectedDateTime.getTime() < Date.now() - 60000) {
      toast.error("Cannot reschedule to a past date or time. Please select a valid future schedule.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: initialClass._id,
          title: title.trim(),
          date,
          time,
          duration: Number(duration) || 60,
          classType,
          location: classType === "physical" ? location.trim() : "Online",
          meetingLink: classType === "online" ? meetingLink.trim() : "",
          description: description.trim(),
          status,
        }),
      });

      if (res.ok) {
        toast.success(`Session "${title}" rescheduled successfully! Enrolled students have been notified.`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        toast.error(errData.message || errData.error || "Failed to reschedule class");
      }
    } catch {
      toast.error("Network error while rescheduling class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async () => {
    if (!confirm(`Are you sure you want to cancel session "${initialClass.title}"? Enrolled students will receive a cancellation alert.`)) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/lecturer/schedule?id=${initialClass._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Session "${initialClass.title}" cancelled and students notified.`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        toast.error(errData.message || errData.error || "Failed to cancel class session");
      }
    } catch {
      toast.error("Network error cancelling session");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 transition cursor-pointer"
        >
          <FiX className="text-xl" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-xs">
            <FiCalendar />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#1E293B]">Reschedule Class Session</h3>
            <p className="text-xs text-gray-400">
              {initialClass.courseId?.title ? `For course: ${initialClass.courseId.title}` : "Update schedule, timing & venue"}
            </p>
          </div>
        </div>

        <form onSubmit={handleReschedule} className="space-y-4">
          {/* Class Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Class Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Delivery Mode Toggle (Physical vs Online) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Class Delivery Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClassType("online")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  classType === "online"
                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiVideo className="text-sm" />
                <span>Online (Virtual)</span>
              </button>

              <button
                type="button"
                onClick={() => setClassType("physical")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  classType === "physical"
                    ? "bg-teal-50 border-teal-400 text-teal-700 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiMapPin className="text-sm" />
                <span>Physical (In-Person)</span>
              </button>
            </div>
          </div>

          {/* Date & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={todayDateStr}
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (newDate === todayDateStr && time && time < currentTimeStr) {
                    setTime(currentTimeStr);
                  }
                }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                min={date === todayDateStr ? currentTimeStr : undefined}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Duration (Minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes (1 Hour)</option>
              <option value="90">90 Minutes (1.5 Hours)</option>
              <option value="120">120 Minutes (2 Hours)</option>
              <option value="180">180 Minutes (3 Hours)</option>
            </select>
          </div>

          {/* Mode-specific field (Meeting URL vs Venue Location) */}
          {classType === "online" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Meeting URL (Google Meet / Zoom)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xyz or Zoom URL"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campus Venue / Classroom Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required={classType === "physical"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hall 15, Engineering Block Room 302"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}

          {/* Session Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Session Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Reschedule Note / Instructions for Students
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rescheduled due to faculty conference. Please bring laptops."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
            />
          </div>

          {/* Student Notification Notice */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <FiAlertCircle className="text-blue-600 text-base shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Saving this form will automatically update the student weekly timetable and send real-time alerts to all enrolled students.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancelSession}
              disabled={cancelling || submitting}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FiTrash2 className="text-sm" />
              <span>Cancel Session</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting || cancelling}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Rescheduling..." : "Save & Notify Students"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
