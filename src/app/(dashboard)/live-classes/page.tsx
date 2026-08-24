"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiVideo, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiX, 
  FiExternalLink, 
  FiRefreshCw, 
  FiSearch,
  FiChevronDown,
  FiAlertCircle,
  FiBookOpen,
  FiArrowRight,
  FiDownload,
  FiFileText
} from 'react-icons/fi';
import { MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';
import Sidebar from '@/components/shared/Sidebar';
import DashHeader from '@/components/shared/DashHeader';
import { useToast } from '@/contexts/ToastContext';

interface LiveSession {
  _id: string;
  title: string;
  description: string;
  courseTitle: string;
  courseCategory: string;
  instructor: string;
  startTime: string;
  endTime: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  dateFormatted: string;
  dayOfWeek: string;
  meetingLink: string;
  recordingUrl: string;
  material?: { _id: string; title: string; fileName: string; fileUrl: string; fileSize?: number; materialType?: string };
  materials?: Array<{ _id: string; title: string; fileName: string; fileUrl: string; fileSize?: number; materialType?: string }>;
  resources: string[];
  status: "live" | "upcoming" | "ended" | "cancelled";
  isLiveNow: boolean;
  isPast: boolean;
}

function LiveClassesContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialCourseParam = searchParams.get('courseId') || searchParams.get('course') || '';

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeCourseFilter, setActiveCourseFilter] = useState(initialCourseParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningSession, setJoiningSession] = useState<LiveSession | null>(null);

  const fetchLiveClasses = async (targetCourseFilter?: string) => {
    setLoading(true);
    try {
      const filterToUse = targetCourseFilter !== undefined ? targetCourseFilter : activeCourseFilter;
      const url = filterToUse && filterToUse !== 'All'
        ? `/api/student/live-classes?courseId=${encodeURIComponent(filterToUse)}`
        : '/api/student/live-classes';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = data.allSessions || [];
        setSessions(list);
        if (filterToUse && list.length > 0) {
          setSelectedCourse(list[0].courseTitle);
        }
      } else {
        toast.error("Failed to load live sessions");
      }
    } catch (err) {
      console.error("Fetch live classes error:", err);
      toast.error("Error loading live classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, [activeCourseFilter]);

  // Distinct courses
  const courseList = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.courseTitle).filter(Boolean)));
  }, [sessions]);

  // Filtered active / upcoming sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.isPast) return false; // Past sessions are on /recordings page
      if (selectedCourse !== 'All' && s.courseTitle !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesCourse = s.courseTitle.toLowerCase().includes(q);
        const matchesInstructor = s.instructor.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesInstructor) return false;
      }
      return true;
    });
  }, [sessions, selectedCourse, searchQuery]);

  const liveNowSessions = useMemo(() => filteredSessions.filter((s) => s.isLiveNow), [filteredSessions]);
  const upcomingSessions = useMemo(() => filteredSessions.filter((s) => !s.isLiveNow), [filteredSessions]);
  const pastSessionsCount = useMemo(() => sessions.filter((s) => s.isPast).length, [sessions]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide flex items-center gap-2.5">
                  <MdOutlineLiveTv className="text-[#5A67D8] text-3xl" />
                  Live & Upcoming Classes
                </h1>
                {liveNowSessions.length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    {liveNowSessions.length} Session(s) Live
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0AEC0] mt-1">
                Participate in interactive online lectures, virtual workshops, and real-time faculty Q&A sessions
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search class or lecturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 shadow-sm text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8]"
                />
              </div>

              {/* Course Filter */}
              <div className="relative w-full sm:w-auto">
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50 min-w-[160px]"
                >
                  <option value="All">All Courses ({courseList.length})</option>
                  {courseList.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => fetchLiveClasses()}
                title="Refresh schedule"
                className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Active Course Workspace Filter Banner */}
          {activeCourseFilter && activeCourseFilter !== "All" && (
            <div className="mb-6 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#5A67D8] text-white flex items-center justify-center text-xs font-bold">
                  <FiBookOpen />
                </div>
                <div>
                  <span className="font-extrabold text-[#2D3748]">Course Workspace Filter:</span>{" "}
                  <span className="text-[#5A67D8] font-bold">
                    {sessions.length > 0 ? sessions[0].courseTitle : activeCourseFilter}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Displaying live class schedules and streams strictly for this course workspace.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.history.replaceState({}, '', '/live-classes');
                  setActiveCourseFilter('');
                  setSelectedCourse('All');
                  fetchLiveClasses('All');
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-[#5A67D8] border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 flex items-center gap-1.5"
              >
                <FiX /> Show All Courses
              </button>
            </div>
          )}

          {/* Quick Metrics & Links Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A0AEC0] font-semibold">Active Right Now</p>
                <h3 className="text-2xl font-black text-red-600 mt-0.5">
                  {liveNowSessions.length} Online
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
                <FiVideo />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A0AEC0] font-semibold">Upcoming Scheduled</p>
                <h3 className="text-2xl font-black text-[#5A67D8] mt-0.5">
                  {upcomingSessions.length} Classes
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#5A67D8] flex items-center justify-center text-xl">
                <FiClock />
              </div>
            </div>

            <Link 
              href="/recordings"
              className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 shadow-sm flex items-center justify-between hover:border-purple-300 transition group"
            >
              <div>
                <p className="text-[11px] text-purple-700 font-bold uppercase">Missed a Class?</p>
                <h3 className="text-sm font-extrabold text-[#111827] mt-0.5 group-hover:text-purple-700 transition flex items-center gap-1">
                  View {pastSessionsCount} Recordings <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
                <MdVideoLibrary />
              </div>
            </Link>
          </div>

          {/* 1. LIVE NOW BROADCAST CARDS */}
          {liveNowSessions.length > 0 && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  Live Classroom In Session
                </h2>
                <span className="text-xs text-gray-500 font-medium">Join immediately &bull; Attendance active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveNowSessions.map((session) => (
                  <div 
                    key={session._id}
                    className="bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 rounded-3xl border-2 border-red-300 shadow-lg flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-3 py-1 bg-red-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white" /> Live Broadcast
                        </span>
                        <span className="text-xs font-extrabold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-lg">
                          {session.courseTitle}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-[#111827] mt-2 leading-tight">{session.title}</h3>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                        <FiUser className="text-red-500" /> Faculty Lecturer: <span className="font-bold text-gray-800">{session.instructor}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <FiClock className="text-red-500" /> {session.startTimeFormatted} - {session.endTimeFormatted}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-100 flex items-center gap-3">
                      <button
                        onClick={() => setJoiningSession(session)}
                        className="flex-1 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 uppercase tracking-wide hover:scale-[1.01]"
                      >
                        <FiVideo className="text-base" /> Enter Live Classroom
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. UPCOMING SCHEDULED CLASSES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#2D3748] uppercase tracking-wider">
                Upcoming Scheduled Classes ({upcomingSessions.length})
              </h2>
              <Link href="/calendar" className="text-xs font-bold text-[#5A67D8] hover:underline flex items-center gap-1">
                View Timetable Calendar <FiArrowRight />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse p-4" />
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6 text-gray-400">
                <FiVideo className="text-4xl mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-gray-600 text-sm">No upcoming live classes scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Check back later or view your course calendar timetable.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {upcomingSessions.map((session) => (
                  <div 
                    key={session._id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-[#F7FAFC]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                        <FiVideo />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#5A67D8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full uppercase">
                            {session.courseCategory}
                          </span>
                          <span className="text-xs font-bold text-gray-700">{session.courseTitle}</span>
                        </div>

                        <h3 className="font-bold text-[#111827] text-base">{session.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><FiUser className="text-gray-400" /> {session.instructor}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><FiCalendar className="text-gray-400" /> {session.dateFormatted}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><FiClock className="text-gray-400" /> {session.startTimeFormatted} - {session.endTimeFormatted}</span>
                        </p>

                        {(session.material || (session.materials && session.materials.length > 0)) && (
                          <div className="mt-2.5 flex items-center gap-2">
                            {(() => {
                              const mat = session.material || session.materials?.[0];
                              if (!mat) return null;
                              return (
                                <a
                                  href={`/api/materials/${mat._id}/file?action=view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-100 transition shadow-xs"
                                  title="View / Read attached lecture notes"
                                >
                                  <FiFileText className="text-xs" />
                                  <span className="truncate max-w-[180px]">{mat.title || mat.fileName || "Lecture Notes"}</span>
                                </a>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      {(session.material || (session.materials && session.materials.length > 0)) && (
                        <a
                          href={`/api/materials/${(session.material || session.materials?.[0])?._id}/file?action=download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                          title="Download lecture notes"
                        >
                          <FiDownload className="text-xs" /> Slides
                        </a>
                      )}
                      <button
                        onClick={() => setJoiningSession(session)}
                        className="px-6 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <FiVideo /> Join Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* JOIN LIVE CLASS MODAL */}
      {joiningSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-[#F7FAFC] flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#5A67D8]">
                  {joiningSession.courseTitle}
                </span>
                <h2 className="text-lg font-black text-[#111827] mt-1">{joiningSession.title}</h2>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <FiUser /> Instructor: {joiningSession.instructor}
                </p>
              </div>

              <button
                onClick={() => setJoiningSession(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex justify-between items-center text-blue-900 font-bold">
                  <span>Session Schedule:</span>
                  <span>{joiningSession.dateFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-blue-800 text-[11px]">
                  <span>Time:</span>
                  <span>{joiningSession.startTimeFormatted} - {joiningSession.endTimeFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-blue-800 text-[11px]">
                  <span>Status:</span>
                  <span className="capitalize font-bold text-[#5A67D8]">{joiningSession.status}</span>
                </div>
              </div>

              {joiningSession.description && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Session Agenda & Topics:</h4>
                  <p className="text-gray-500 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    {joiningSession.description}
                  </p>
                </div>
              )}

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <FiAlertCircle className="text-amber-600 flex-shrink-0" />
                  <span>Student Readiness Guidelines:</span>
                </div>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-[11px] pt-1">
                  <li>Please ensure your microphone and webcam permissions are enabled.</li>
                  <li>Attendance is automatically logged in your student portal upon joining.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-[#F7FAFC] flex justify-between items-center gap-3">
              <button
                onClick={() => setJoiningSession(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition"
              >
                Cancel
              </button>

              <a
                href={joiningSession.meetingLink || "https://meet.google.com"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setJoiningSession(null)}
                className="px-6 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <FiExternalLink /> Launch Google Meet
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function LiveClassesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5A67D8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LiveClassesContent />
    </Suspense>
  );
}
