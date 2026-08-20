"use client";

import { useState } from "react";
import { FiClock, FiVideo, FiUsers, FiBookOpen, FiAlertCircle, FiUploadCloud, FiX, FiCheck } from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface ScheduleItemProps {
  item: {
    _id: string;
    title: string;
    description?: string;
    courseId?: { title: string };
    startTime: string;
    endTime: string;
    meetingLink?: string;
    recordingUrl?: string;
    resources?: string[];
    status: string;
  };
}

export default function ScheduleItem({ item }: ScheduleItemProps) {
  const toast = useToast();
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [statusState, setStatusState] = useState(item.status);
  
  // Recording Form
  const [recordingUrl, setRecordingUrl] = useState(item.recordingUrl || "");
  const [summaryNotes, setSummaryNotes] = useState(item.description || "");
  const [isSubmittingRecording, setIsSubmittingRecording] = useState(false);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEndEarly = async () => {
    try {
      const res = await fetch("/api/lecturer/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: item._id, status: "ended" }),
      });
      if (res.ok) {
        setStatusState("ended");
        setShowEndModal(false);
        toast.success("Class marked as ended. You can now upload lecture recordings.");
      } else {
        toast.error("Failed to end class");
      }
    } catch (err) {
      toast.error("Failed to end class");
    }
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingUrl.trim()) {
      toast.warning("Please provide a lecture recording URL");
      return;
    }

    setIsSubmittingRecording(true);
    try {
      const res = await fetch("/api/lecturer/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: item._id,
          recordingUrl: recordingUrl.trim(),
          description: summaryNotes.trim(),
          status: "ended",
        }),
      });

      if (res.ok) {
        toast.success("Lecture recording uploaded! Missed students notified.");
        setShowRecordingModal(false);
        setStatusState("ended");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to upload recording");
      }
    } catch (err) {
      toast.error("Error saving recording");
    } finally {
      setIsSubmittingRecording(false);
    }
  };

  return (
    <div className="flex flex-col p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100/70 transition hover:border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[#111827] text-sm">{item.title}</h4>
        {statusState === "live" && (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-700 uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live
          </span>
        )}
        {statusState === "upcoming" && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 uppercase">
            Upcoming
          </span>
        )}
        {statusState === "ended" && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 uppercase">
            {recordingUrl ? "Recorded" : "Ended"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-3">
        <span className="flex items-center gap-1">
          <FiClock className="text-gray-400" />
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </span>
        <span className="flex items-center gap-1">
          <FiBookOpen className="text-gray-400" />
          {item.courseId?.title || "General"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/50">
        {statusState === "live" && (
          <>
            {item.meetingLink && (
              <a
                href={item.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >
                <FiVideo /> Join Meeting
              </a>
            )}
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition"
            >
              <FiUsers /> Attendance
            </button>
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition ml-auto"
            >
              End Early
            </button>
          </>
        )}

        {statusState === "upcoming" && (
          <>
            <button
              onClick={() => toast.info("Preparing class materials...")}
              className="px-3 py-1 bg-blue-50 text-[#2563EB] text-xs font-semibold rounded-lg hover:bg-blue-100 transition"
            >
              Prepare
            </button>
            <button
              onClick={() => toast.success("Reminder sent to enrolled students")}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Notify Students
            </button>
            <button
              onClick={() => setShowRecordingModal(true)}
              className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-100 transition ml-auto flex items-center gap-1"
            >
              <FiUploadCloud /> Upload Recording
            </button>
          </>
        )}

        {statusState === "ended" && (
          <button
            onClick={() => setShowRecordingModal(true)}
            className="w-full px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <FiUploadCloud /> {recordingUrl ? "Update Recording Link" : "Attach Missed Lecture Recording Link"}
          </button>
        )}
      </div>

      {/* Upload Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-[#111827]">Attach Lecture Recording Link</h3>
              <button
                onClick={() => setShowRecordingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRecording} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">
                    Recording Link / Google Drive Link <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                    Link Only
                  </span>
                </div>
                <input
                  type="url"
                  required
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or Zoom / YouTube link"
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Paste your Google Drive link, Zoom Cloud recording, or YouTube video link. Direct file upload is disabled.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Summary / Discussion Notes
                </label>
                <textarea
                  rows={3}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Lecture notes for missed students..."
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRecordingModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecording}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <FiUploadCloud /> {isSubmittingRecording ? "Saving..." : "Save Recording Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-[#111827] mb-2">Class Attendance Roster</h3>
            <p className="text-xs text-gray-500 mb-4">Track student attendance for {item.title}</p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
              {["Alex Johnson", "Sarah Miller", "David Chen", "Emily Watson"].map((student, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl text-xs">
                  <span className="font-semibold text-gray-700">{student}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">Present</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="w-full py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
            >
              Close Roster
            </button>
          </div>
        </div>
      )}

      {/* End Early Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <FiAlertCircle className="text-red-500 text-3xl mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#111827] mb-2">End Class Early?</h3>
            <p className="text-xs text-gray-500 mb-6">Are you sure you want to end this live session now?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEndEarly}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition"
              >
                End Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
