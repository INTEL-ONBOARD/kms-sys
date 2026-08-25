"use client";

import { useState, useEffect } from "react";
import { 
  FiVideo, 
  FiPlus, 
  FiClock, 
  FiCalendar, 
  FiBookOpen, 
  FiUploadCloud, 
  FiPlay, 
  FiX, 
  FiCheck, 
  FiExternalLink, 
  FiFileText,
  FiRefreshCw,
  FiMapPin,
  FiEdit3
} from "react-icons/fi";
import { MdVideoLibrary } from "react-icons/md";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";
import RescheduleClassModal from "@/Components/lecturer/RescheduleClassModal";
import { useToast } from "@/Components/ToastProvider";

interface LiveClassItem {
  _id: string;
  title: string;
  description?: string;
  courseId?: { _id?: string; title: string; category?: string };
  startTime: string;
  endTime: string;
  classType?: "online" | "physical";
  location?: string;
  meetingLink?: string;
  recordingUrl?: string;
  materialId?: { _id: string; title: string; fileName: string; fileUrl: string; fileSize?: number; materialType?: string };
  materials?: Array<{ _id: string; title: string; fileName: string; fileUrl: string; fileSize?: number; materialType?: string }>;
  resources?: string[];
  status: string;
}

export default function LecturerLiveClassesPage() {
  const toast = useToast();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reschedulingClass, setReschedulingClass] = useState<LiveClassItem | null>(null);
  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [hasCourses, setHasCourses] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'recorded'>('all');

  // Upload Recording Modal State
  const [editingClass, setEditingClass] = useState<LiveClassItem | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [slideResource, setSlideResource] = useState("");
  const [isSavingRecording, setIsSavingRecording] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const [scheduleRes, coursesRes] = await Promise.all([
        fetch("/api/lecturer/schedule?all=true"),
        fetch("/api/lecturer/courses?limit=1")
      ]);
      
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        const count = cData.pagination?.total ?? (cData.data?.length || 0);
        setHasCourses(count > 0);
      }

      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setLiveClasses(data.schedule || []);
      }
    } catch (err) {
      console.error("Failed to load live classes:", err);
      toast.error("Failed to load classes");
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

  const handleOpenUploadRecording = (item: LiveClassItem) => {
    setEditingClass(item);
    setRecordingUrl(item.recordingUrl || "");
    setSummaryNotes(item.description || "");
    setSlideResource(item.resources?.[0] || "");
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    if (!recordingUrl.trim()) {
      toast.warning("Please provide a lecture recording video link or cloud URL");
      return;
    }

    setIsSavingRecording(true);
    try {
      const res = await fetch("/api/lecturer/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: editingClass._id,
          recordingUrl: recordingUrl.trim(),
          description: summaryNotes.trim(),
          resources: slideResource.trim() ? [slideResource.trim()] : ["Lecture-Slides-PDF.pdf"],
          status: "ended", // mark as recorded session
        }),
      });

      if (res.ok) {
        toast.success("Lecture recording & missed session materials uploaded! Enrolled students notified.");
        setEditingClass(null);
        fetchClasses();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to update recording");
      }
    } catch (err) {
      console.error("Upload recording error:", err);
      toast.error("Error updating recording");
    } finally {
      setIsSavingRecording(false);
    }
  };

  const filteredClasses = liveClasses.filter((c) => {
    if (activeTab === 'upcoming') return c.status === 'upcoming' || c.status === 'live';
    if (activeTab === 'recorded') return c.status === 'ended' || !!c.recordingUrl;
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3748]">Virtual Classroom & Lecture Recordings</h1>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Schedule live sessions, launch virtual meetings, and upload recorded lectures for missed students
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchClasses}
            title="Refresh schedule"
            className="p-2.5 text-gray-500 hover:text-[#5A67D8] bg-gray-50 hover:bg-gray-100 rounded-xl transition"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (!hasCourses) {
                toast.warning("Schedule Blocked: You must be assigned to a course by an administrator before scheduling live classes.");
                return;
              }
              setShowScheduleModal(true);
            }}
            disabled={!hasCourses}
            title={!hasCourses ? "Course assignment required from Admin" : "Schedule Live Class"}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 ${
              hasCourses
                ? "bg-[#5A67D8] text-white hover:bg-[#434190] cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            <FiPlus className="text-base" /> Schedule Live Class
          </button>
        </div>
      </div>

      {/* Locked Notice if no assigned courses */}
      {!loading && !hasCourses && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold">
            🔒
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Live Classes Locked</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              You are not assigned to any courses yet. Once an administrator assigns courses to your profile from the Admin Panel, you will be able to schedule live lectures, stream sessions, and upload recordings.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'all' ? 'bg-[#5A67D8] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Sessions ({liveClasses.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'upcoming' ? 'bg-[#5A67D8] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Live & Upcoming ({liveClasses.filter(c => c.status !== 'ended').length})
        </button>
        <button
          onClick={() => setActiveTab('recorded')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'recorded' ? 'bg-[#5A67D8] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recorded Playbacks ({liveClasses.filter(c => c.status === 'ended' || c.recordingUrl).length})
        </button>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <FiCalendar className="text-5xl text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-[#2D3748]">No classes found in this tab</h3>
            <p className="text-xs text-[#A0AEC0] mt-1 mb-4">Schedule a new live class or upload session recordings</p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] transition"
            >
              Schedule Live Class
            </button>
          </div>
        ) : (
          filteredClasses.map((c) => {
            const hasRecording = !!c.recordingUrl;
            const isLive = c.status === 'live';
            const isEnded = c.status === 'ended';
            const isPhysical = c.classType === 'physical';

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                      isLive
                        ? "bg-red-50 text-red-600"
                        : hasRecording
                        ? "bg-purple-50 text-purple-600"
                        : isPhysical
                        ? "bg-teal-50 text-teal-600"
                        : "bg-[#EEF2FF] text-[#5A67D8]"
                    }`}
                  >
                    {hasRecording ? <MdVideoLibrary /> : isPhysical ? <FiMapPin /> : <FiVideo />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#2D3748] text-base">{c.title}</h3>
                      
                      {/* Delivery Mode Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        isPhysical ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {isPhysical ? <FiMapPin className="text-[10px]" /> : <FiVideo className="text-[10px]" />}
                        {isPhysical ? "Physical Classroom" : "Online Live"}
                      </span>

                      {isLive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-600 uppercase animate-pulse">
                          Live Now
                        </span>
                      )}
                      {c.status === "upcoming" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#EEF2FF] text-[#5A67D8] uppercase">
                          Upcoming
                        </span>
                      )}
                      {c.status === "rescheduled" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">
                          Rescheduled
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gray-100 text-gray-600 uppercase">
                          Ended
                        </span>
                      )}
                      {hasRecording && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700 uppercase flex items-center gap-1">
                          <FiCheck className="text-xs" /> Recording Available
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#A0AEC0] mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-600">{c.courseId?.title || "General Course"}</span>
                      <span>&middot;</span>
                      <span>{formatDate(c.startTime)}</span>
                      <span>&middot;</span>
                      <span><FiClock className="inline mr-1" /> {formatTime(c.startTime)} - {formatTime(c.endTime)}</span>
                      {c.location && (
                        <>
                          <span>&middot;</span>
                          <span className="text-gray-600 font-semibold flex items-center gap-1">
                            <FiMapPin className="text-teal-600 text-xs" /> {c.location}
                          </span>
                        </>
                      )}
                    </p>

                    {c.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                        &ldquo;{c.description}&rdquo;
                      </p>
                    )}

                    {/* Attached Course Material / Slides */}
                    {(c.materialId || (c.materials && c.materials.length > 0)) && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {(() => {
                          const mat = c.materialId || c.materials?.[0];
                          if (!mat) return null;
                          return (
                            <a
                              href={`/api/materials/${mat._id}/file?action=view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-100 transition shadow-xs"
                              title="Read / view attached lecture notes"
                            >
                              <FiFileText className="text-xs" />
                              <span className="truncate max-w-[200px]">{mat.title || mat.fileName || "Lecture Material"}</span>
                              <FiExternalLink className="text-[10px]" />
                            </a>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lecturer Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                  {/* Reschedule Button */}
                  <button
                    onClick={() => setReschedulingClass(c)}
                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-[#1E293B] border border-gray-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FiCalendar className="text-indigo-600" />
                    <span>Reschedule Session</span>
                  </button>

                  {/* Upload / Edit Missed Recording Button */}
                  <button
                    onClick={() => handleOpenUploadRecording(c)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FiUploadCloud className="text-sm" />
                    {hasRecording ? "Update Recording" : "Upload Recording"}
                  </button>

                  {/* Join Room */}
                  {c.meetingLink && !isPhysical && (
                    <a
                      href={c.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] transition flex items-center gap-1.5 shadow-xs"
                    >
                      <FiVideo /> Host / Join Meeting
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE NEW MODAL */}
      {showScheduleModal && (
        <QuickActionModal
          type="class"
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => fetchClasses()}
        />
      )}

      {/* RESCHEDULE EXISTING CLASS MODAL */}
      {reschedulingClass && (
        <RescheduleClassModal
          initialClass={reschedulingClass}
          onClose={() => setReschedulingClass(null)}
          onSuccess={() => fetchClasses()}
        />
      )}

      {/* UPLOAD MISSED LECTURE RECORDING MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-[#F7FAFC] flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                  {editingClass.courseId?.title || "Course"}
                </span>
                <h2 className="text-lg font-black text-[#111827] mt-1">Upload Lecture Recording</h2>
                <p className="text-xs text-gray-400">Class: {editingClass.title}</p>
              </div>

              <button
                onClick={() => setEditingClass(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRecording} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Recording Video Link / Cloud URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://youtu.be/... or Google Drive / Zoom Cloud Recording URL"
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl py-2.5 px-3.5 outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Students who missed the session will be able to play this recording in Playback Mode.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Lecture Summary & Key Takeaways
                </label>
                <textarea
                  rows={3}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Summary of topics, code walk-through, discussion points..."
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Slide Deck / Handout Resource Link
                </label>
                <input
                  type="text"
                  value={slideResource}
                  onChange={(e) => setSlideResource(e.target.value)}
                  placeholder="https://drive.google.com/slides.pdf or Slide-Deck.pdf"
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl py-2.5 px-3.5 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100 text-purple-900 text-[11px] leading-relaxed">
                📢 <strong>Auto-Notification:</strong> When submitted, all enrolled students will automatically receive a live notification that the missed session recording is available.
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  disabled={isSavingRecording}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecording}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingRecording ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="text-sm" /> Publish Recording to Students
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
