"use client";

import { useState, useEffect } from "react";
import { FiBold, FiItalic, FiLink, FiList, FiPaperclip, FiSend } from "react-icons/fi";
import { useToast } from "@/contexts/ToastContext";

interface AnnouncementComposerProps {
  courses: Array<{ _id: string; title: string }>;
  onAnnouncementPosted?: () => void;
}

export default function AnnouncementComposer({ courses, onAnnouncementPosted }: AnnouncementComposerProps) {
  const toast = useToast();
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || "");
  const [message, setMessage] = useState("");
  const [notifyStudents, setNotifyStudents] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync selectedCourse when courses prop loads or changes
  useEffect(() => {
    if (courses && courses.length > 0) {
      setSelectedCourse((prev) => {
        if (prev && courses.some((c) => c._id === prev)) {
          return prev;
        }
        return courses[0]._id;
      });
    } else {
      setSelectedCourse("");
    }
  }, [courses]);

  // Formatting toggles (decorates textarea content)
  const applyFormat = (formatType: string) => {
    if (!message) return;
    if (formatType === "bold") setMessage(`**${message}**`);
    if (formatType === "italic") setMessage(`*${message}*`);
    if (formatType === "link") setMessage(`[${message}](https://)`);
    if (formatType === "list") setMessage(`• ${message}`);
  };

  const handleMockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      toast.info(`Attached file: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCourseId = selectedCourse || courses[0]?._id;
    if (!effectiveCourseId) {
      toast.warning("Please select a course");
      return;
    }
    if (!message.trim()) {
      toast.warning("Please enter an announcement message");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: effectiveCourseId,
          message: message.trim(),
          notifyStudents,
          attachments: attachmentName ? [attachmentName] : [],
        }),
      });

      if (res.ok) {
        toast.success("Announcement posted successfully!");
        setMessage("");
        setAttachmentName("");
        setNotifyStudents(false);
        if (onAnnouncementPosted) onAnnouncementPosted();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to post announcement");
      }
    } catch (err) {
      toast.error("Error posting announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#111827] text-base">📢 Post Announcement</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Course Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Target Course</label>
          <select
            value={selectedCourse || courses[0]?._id || ""}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-[#F7FAFC] border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-[#2563EB]"
          >
            {courses.length === 0 ? (
              <option value="">No active courses</option>
            ) : (
              courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Message Input */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-[#2563EB]">
          {/* Toolbar */}
          <div className="bg-[#F7FAFC] border-b border-gray-200 px-3 py-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyFormat("bold")}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition text-xs"
              title="Bold"
            >
              <FiBold />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("italic")}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition text-xs"
              title="Italic"
            >
              <FiItalic />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("link")}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition text-xs"
              title="Link"
            >
              <FiLink />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("list")}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition text-xs"
              title="Bullet List"
            >
              <FiList />
            </button>

            {/* Mock Attachment Button */}
            <label className="ml-auto p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded cursor-pointer transition text-xs flex items-center gap-1">
              <FiPaperclip />
              <input type="file" onChange={handleMockFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            rows={3}
            disabled={courses.length === 0 || submitting}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={courses.length === 0 ? "Course assignment required from Admin to post announcements..." : "Type your announcement message here..."}
            className="w-full p-3 text-xs text-gray-800 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400"
          />

          {attachmentName && (
            <div className="px-3 pb-2 text-[11px] font-semibold text-[#2563EB] flex items-center gap-1">
              <FiPaperclip /> Attached: {attachmentName}
            </div>
          )}
        </div>

        {/* Checkbox + Submit */}
        <div className="flex items-center justify-between pt-1">
          <label className={`flex items-center gap-2 text-xs font-semibold ${courses.length === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 cursor-pointer"}`}>
            <input
              type="checkbox"
              disabled={courses.length === 0 || submitting}
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="rounded text-[#2563EB] focus:ring-[#2563EB]"
            />
            Notify students via email / alert
          </label>

          <button
            type="submit"
            disabled={courses.length === 0 || submitting}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl transition ${
              courses.length > 0 && !submitting
                ? "bg-[#2563EB] text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            <FiSend />
            {submitting ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}
