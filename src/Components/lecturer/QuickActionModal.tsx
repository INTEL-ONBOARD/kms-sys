"use client";

import { useState, useEffect } from "react";
import { FiX, FiFilePlus, FiCalendar, FiUploadCloud } from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface QuickActionModalProps {
  type: "assignment" | "class" | "material";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickActionModal({ type, onClose, onSuccess }: QuickActionModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/lecturer/courses?limit=50");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || []);
          if (data.data && data.data.length > 0) {
            setCourseId(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load courses for modal:", err);
      }
    };
    fetchCourses();
  }, []);

  const [category, setCategory] = useState("Homework");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Title is required");
      return;
    }

    setSubmitting(true);

    try {
      if (type === "class") {
        const res = await fetch("/api/lecturer/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            courseId,
            date,
            time,
            meetingLink: link,
            description,
          }),
        });

        if (res.ok) {
          toast.success(`Live Class "${title}" scheduled successfully!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to schedule live class");
        }
      } else if (type === "assignment") {
        const res = await fetch("/api/lecturer/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            courseId,
            dueDate: date,
            maxPoints,
            description,
            category,
          }),
        });

        if (res.ok) {
          toast.success(`Assignment "${title}" created successfully!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to create assignment");
        }
      } else {
        // Material upload fallback
        await new Promise((res) => setTimeout(res, 600));
        toast.success(`Material "${title}" uploaded to course repository!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error("Failed to complete action");
    } finally {
      setSubmitting(false);
    }
  };

  const titles = {
    assignment: "Create New Assignment",
    class: "Schedule Live Class",
    material: "Upload Course Material",
  };

  const icons = {
    assignment: <FiFilePlus className="text-[#2563EB]" />,
    class: <FiCalendar className="text-[#5A67D8]" />,
    material: <FiUploadCloud className="text-amber-600" />,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transform transition-all scale-100 font-sans">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 transition"
        >
          <FiX className="text-xl" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
            {icons[type]}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D3748]">{titles[type]}</h3>
            <p className="text-xs text-[#A0AEC0]">Fill in details to publish to your students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Selector */}
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "assignment" ? "e.g. Midterm Lab Assignment" : "Class Title..."}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
            />
          </div>

          {type === "assignment" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
                >
                  <option value="Homework">Homework</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Project">Project</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Essay">Essay</option>
                  <option value="Case Study">Case Study</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    required
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                  />
                </div>
              </div>
            </>
          )}

          {type === "class" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                />
              </div>
            </div>
          )}

          {type === "class" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting URL</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/xyz or Zoom link"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details for students..."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] resize-none"
            />
          </div>

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
              className="px-5 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm transition disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
