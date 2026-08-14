"use client";

import { useState, useEffect } from "react";
import { FiFileText, FiPlus, FiCalendar, FiClock, FiMapPin, FiCheckCircle } from "react-icons/fi";
import CreateExamModal from "@/Components/lecturer/CreateExamModal";
import { useToast } from "@/Components/ToastProvider";

interface ExamItem {
  _id: string;
  title: string;
  courseId?: any;
  date: string;
  duration: number;
  location?: string;
  type: string;
  status: string;
}

export default function LecturerExamsPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/lecturer/exams?limit=30");
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handlePublishResults = async (examId: string, title: string) => {
    setPublishingId(examId);
    try {
      const res = await fetch("/api/lecturer/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          publishResults: true,
        }),
      });

      if (res.ok) {
        toast.success(`Results published for "${title}"! Students notified.`);
        fetchExams();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to publish exam results");
      }
    } catch (err) {
      toast.error("Error publishing results");
    } finally {
      setPublishingId(null);
    }
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
          <h1 className="text-2xl font-extrabold text-[#2D3748]">Exam Manager</h1>
          <p className="text-xs text-[#A0AEC0] mt-1">Schedule, configure, edit, and publish course exams and quizzes</p>
        </div>
        <button
          onClick={() => {
            setEditingExam(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-purple-700 transition flex items-center gap-2"
        >
          <FiPlus className="text-base" /> Create New Exam
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <FiFileText className="text-5xl text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#2D3748]">No exams scheduled yet</h3>
          <p className="text-xs text-[#A0AEC0] mt-1 mb-4">Click below to schedule an exam or quiz for your students</p>
          <button
            onClick={() => {
              setEditingExam(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition"
          >
            Create New Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((e) => {
            const isCompleted = e.status === "completed";
            return (
              <div
                key={e._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">
                        {e.type}
                      </span>
                      <h3 className="font-bold text-[#2D3748] text-base mt-2">{e.title}</h3>
                      <p className="text-xs text-[#A0AEC0] mt-0.5">{e.courseId?.title || "General Course"}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : e.status === "ongoing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A5568] font-semibold">
                    <span className="flex items-center gap-1.5"><FiCalendar className="text-gray-400" /> {formatDate(e.date)}</span>
                    <span className="flex items-center gap-1.5"><FiClock className="text-gray-400" /> {e.duration} mins</span>
                    <span className="flex items-center gap-1.5"><FiMapPin className="text-gray-400" /> {e.location || "Online"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingExam(e);
                      setShowModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#F7FAFC] text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-100 transition border border-gray-200"
                  >
                    Edit Parameters
                  </button>
                  <button
                    onClick={() => handlePublishResults(e._id, e.title)}
                    disabled={publishingId === e._id || isCompleted}
                    className={`px-3.5 py-2 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 ${
                      isCompleted
                        ? "bg-emerald-600 cursor-default"
                        : "bg-[#5A67D8] hover:bg-[#434190]"
                    }`}
                  >
                    {publishingId === e._id ? (
                      "Publishing..."
                    ) : isCompleted ? (
                      <>
                        <FiCheckCircle /> Results Published
                      </>
                    ) : (
                      "Publish Results"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateExamModal
          initialExam={editingExam}
          onClose={() => {
            setShowModal(false);
            setEditingExam(null);
          }}
          onSuccess={() => fetchExams()}
        />
      )}
    </div>
  );
}
