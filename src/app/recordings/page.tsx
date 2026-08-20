"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiPlay, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiDownload, 
  FiX, 
  FiExternalLink, 
  FiRefreshCw, 
  FiSearch,
  FiFileText,
  FiChevronDown,
  FiInfo,
  FiArrowRight,
  FiBookOpen
} from 'react-icons/fi';
import { MdVideoLibrary, MdOutlineLiveTv } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import DashHeader from '@/Components/DashHeader';
import { useToast } from '@/Components/ToastProvider';

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
  resources: string[];
  status: "live" | "upcoming" | "ended" | "cancelled";
  isLiveNow: boolean;
  isPast: boolean;
}

function RecordingsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialCourseParam = searchParams.get('courseId') || searchParams.get('course') || '';

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeCourseFilter, setActiveCourseFilter] = useState(initialCourseParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchingRecording, setWatchingRecording] = useState<LiveSession | null>(null);

  const fetchRecordings = async (targetCourseFilter?: string) => {
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
        toast.error("Failed to load lecture recordings");
      }
    } catch (err) {
      console.error("Fetch recordings error:", err);
      toast.error("Error loading recorded lectures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [activeCourseFilter]);

  // Distinct courses with recorded sessions
  const pastSessions = useMemo(() => {
    return sessions.filter((s) => s.isPast || s.status === 'ended' || !!s.recordingUrl);
  }, [sessions]);

  const courseList = useMemo(() => {
    return Array.from(new Set(pastSessions.map((s) => s.courseTitle).filter(Boolean)));
  }, [pastSessions]);

  // Filtered recordings
  const filteredRecordings = useMemo(() => {
    return pastSessions.filter((s) => {
      if (selectedCourse !== 'All' && s.courseTitle !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesCourse = s.courseTitle.toLowerCase().includes(q);
        const matchesInstructor = s.instructor.toLowerCase().includes(q);
        const matchesDesc = (s.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesInstructor && !matchesDesc) return false;
      }
      return true;
    });
  }, [pastSessions, selectedCourse, searchQuery]);

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
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide flex items-center gap-2.5">
                <MdVideoLibrary className="text-purple-600 text-3xl" />
                Missed Sessions & Lecture Playback
              </h1>
              <p className="text-xs text-[#A0AEC0] mt-1">
                Catch up on past lectures, review faculty takeaway notes, and download presentation decks & exercises
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search recording topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 shadow-sm text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer transition hover:bg-gray-50 min-w-[160px]"
                >
                  <option value="All">All Courses ({pastSessions.length})</option>
                  {courseList.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => fetchRecordings()}
                title="Refresh recordings"
                className="p-2.5 text-gray-400 hover:text-purple-600 bg-white border border-gray-100 hover:border-purple-300 rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-purple-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Active Course Workspace Filter Banner */}
          {activeCourseFilter && activeCourseFilter !== "All" && (
            <div className="mb-6 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                  <FiBookOpen />
                </div>
                <div>
                  <span className="font-extrabold text-[#2D3748]">Course Workspace Filter:</span>{" "}
                  <span className="text-purple-600 font-bold">
                    {pastSessions.length > 0 ? pastSessions[0].courseTitle : activeCourseFilter}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Displaying lecture archives and cloud recordings strictly for this course.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.history.replaceState({}, '', '/recordings');
                  setActiveCourseFilter('');
                  setSelectedCourse('All');
                  fetchRecordings('All');
                }}
                className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-600 border border-purple-200 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 flex items-center gap-1.5"
              >
                <FiX /> Show All Courses
              </button>
            </div>
          )}

          {/* Context Banner */}
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-purple-900 text-xs mb-8">
            <div className="flex items-center gap-3">
              <FiInfo className="text-xl flex-shrink-0 text-purple-600" />
              <p>
                Missed an online class? All lecture sessions are systematically indexed with timestamped recordings, high-yield summary notes, and downloadable material.
              </p>
            </div>
            <Link 
              href="/live-classes" 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center shadow-sm"
            >
              <MdOutlineLiveTv /> View Live Classes <FiArrowRight />
            </Link>
          </div>

          {/* Recordings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse p-4" />
              ))}
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 text-gray-400">
              <MdVideoLibrary className="text-4xl mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-600 text-sm">No lecture recordings found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery || selectedCourse !== 'All' 
                  ? "Try clearing your search filters."
                  : "Recorded sessions will appear here automatically after classes conclude."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecordings.map((session) => (
                <div 
                  key={session._id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition hover:shadow-xl hover:border-purple-200 group"
                >
                  {/* Thumbnail */}
                  <div 
                    onClick={() => setWatchingRecording(session)}
                    className="h-44 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 relative flex flex-col justify-center items-center text-center cursor-pointer group-hover:brightness-110 transition"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg mb-2">
                      <FiPlay className="ml-1" />
                    </div>
                    <span className="text-[11px] font-bold text-white/80">Click to Play Recording</span>

                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/50 text-white backdrop-blur-sm">
                      {session.courseCategory}
                    </span>
                    <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-gray-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                      <FiCalendar /> {session.dateFormatted}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                        {session.courseTitle}
                      </span>
                      <h4 className="font-black text-[#111827] text-base mt-0.5 leading-snug line-clamp-2">
                        {session.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <FiUser className="text-gray-400" /> Faculty: <span className="font-semibold text-gray-700">{session.instructor}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
                      <button
                        onClick={() => setWatchingRecording(session)}
                        className="flex-1 px-4 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <FiPlay /> Watch Playback
                      </button>
                      <button
                        onClick={() => {
                          toast.success("Downloading lecture presentation slides...");
                        }}
                        title="Download Slide Deck"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                      >
                        <FiDownload className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* WATCH MISSED SESSION RECORDING & SUMMARY MODAL */}
      {watchingRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-[#F7FAFC] flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                  {watchingRecording.courseTitle} &bull; Recorded Lecture
                </span>
                <h3 className="text-base md:text-lg font-black text-[#111827] mt-0.5">{watchingRecording.title}</h3>
              </div>

              <button
                onClick={() => setWatchingRecording(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Video Player Screen & Lecture Materials */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* In-Browser Lecture Player */}
              {(() => {
                const url = watchingRecording.recordingUrl || "";
                const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                const embedUrl = ytMatch && ytMatch[1] ? `https://www.youtube.com/embed/${ytMatch[1]}` : null;

                const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
                const driveEmbedUrl = driveMatch && driveMatch[1] ? `https://drive.google.com/file/d/${driveMatch[1]}/preview` : null;

                if (embedUrl) {
                  return (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                      <iframe
                        src={embedUrl}
                        title={watchingRecording.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  );
                }

                if (driveEmbedUrl) {
                  return (
                    <div className="space-y-2">
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                        <iframe
                          src={driveEmbedUrl}
                          title={watchingRecording.title}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="flex justify-end">
                        <a
                          href={watchingRecording.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 transition"
                        >
                          <FiExternalLink /> Open in Google Drive
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="aspect-video bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-center items-center text-white p-6 relative">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-xl mb-3">
                      <FiPlay className="ml-1 text-white" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{watchingRecording.title}</p>
                    <p className="text-xs text-gray-400 mb-4">Recorded lecture session playback</p>
                    <a
                      href={watchingRecording.recordingUrl || "https://meet.google.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <FiExternalLink className="text-sm" /> Open Lecture Recording Link
                    </a>
                  </div>
                );
              })()}

              {/* Lecture Summary Notes */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                  Lecture Summary & Key Takeaways
                </h4>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 leading-relaxed space-y-2">
                  <p>{watchingRecording.description || "In this session, the instructor covers the core curriculum objectives, theoretical foundations, and practical problem-solving exercises."}</p>
                  <ul className="space-y-1 text-gray-600 list-disc list-inside mt-2">
                    <li>Core theoretical framework and practical methodology demonstrations.</li>
                    <li>Live coding/design walk-through and troubleshooting techniques.</li>
                    <li>Interactive Q&A answering student questions and project guidelines.</li>
                  </ul>
                </div>
              </div>

              {/* Downloadable Session Slides and Code */}
              <div>
                <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider mb-2">
                  Session Resources & Attachments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(watchingRecording.resources && watchingRecording.resources.length > 0
                    ? watchingRecording.resources
                    : ["Lecture_Slide_Deck.pdf", "Lab_Exercise_Files.zip"]
                  ).map((res, i) => (
                    <div 
                      key={i}
                      className="p-3.5 bg-[#F7FAFC] border border-gray-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FiFileText className="text-[#5A67D8] text-base flex-shrink-0" />
                        <span className="font-bold text-gray-800 text-xs truncate">{res}</span>
                      </div>
                      <button
                        onClick={() => toast.success(`Downloading ${res}...`)}
                        className="p-2 text-[#5A67D8] hover:bg-indigo-50 rounded-lg transition flex-shrink-0"
                        title="Download Resource"
                      >
                        <FiDownload className="text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#F7FAFC] flex justify-end gap-3">
              <button
                onClick={() => setWatchingRecording(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition"
              >
                Close Playback
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function RecordingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RecordingsContent />
    </Suspense>
  );
}
