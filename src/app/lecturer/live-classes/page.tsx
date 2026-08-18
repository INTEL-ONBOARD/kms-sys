"use client";

import { useState, useEffect } from "react";
import { FiVideo, FiPlus, FiClock, FiCalendar, FiBookOpen } from "react-icons/fi";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";

interface LiveClassItem {
  _id: string;
  title: string;
  courseId?: { title: string; category?: string };
  startTime: string;
  endTime: string;
  meetingLink?: string;
  status: string;
}

export default function LecturerLiveClassesPage() {
  const [showModal, setShowModal] = useState(false);
  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/lecturer/schedule?all=true");
      if (res.ok) {
        const data = await res.json();
        setLiveClasses(data.schedule || []);
      }
    } catch (err) {
      console.error("Failed to load live classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3748]">Live Class Schedule</h1>
          <p className="text-xs text-[#A0AEC0] mt-1">Schedule and manage virtual classrooms & attendance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#434190] transition flex items-center gap-2"
        >
          <FiPlus className="text-base" /> Schedule Live Class
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : liveClasses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <FiCalendar className="text-5xl text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-[#2D3748]">No live classes scheduled</h3>
            <p className="text-xs text-[#A0AEC0] mt-1 mb-4">Click below to schedule your next live lecture</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] transition"
            >
              Schedule Live Class
            </button>
          </div>
        ) : (
          liveClasses.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                    c.status === "live"
                      ? "bg-red-50 text-red-600"
                      : "bg-[#EEF2FF] text-[#5A67D8]"
                  }`}
                >
                  <FiVideo />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#2D3748] text-base">{c.title}</h3>
                    {c.status === "live" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-600 uppercase animate-pulse">
                        Live Now
                      </span>
                    )}
                    {c.status === "upcoming" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#EEF2FF] text-[#5A67D8] uppercase">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A0AEC0] mt-0.5 flex items-center gap-2">
                    <span>{c.courseId?.title || "General Course"}</span>
                    <span>&middot;</span>
                    <span>{formatDate(c.startTime)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-[#4A5568] font-semibold flex items-center gap-1.5">
                  <FiClock className="text-gray-400" /> {formatTime(c.startTime)} - {formatTime(c.endTime)}
                </span>
                {c.meetingLink && (
                  <a
                    href={c.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] transition flex items-center gap-1.5"
                  >
                    <FiVideo /> Join Meeting
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <QuickActionModal
          type="class"
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchClasses()}
        />
      )}
    </div>
  );
}
