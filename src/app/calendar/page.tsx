"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronDown, 
  FiVideo, 
  FiPlay, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiBookOpen, 
  FiDownload, 
  FiX, 
  FiExternalLink, 
  FiRefreshCw, 
  FiSearch,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';
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

interface ExamItem {
  _id: string;
  title: string;
  courseTitle: string;
  dateFormatted: string;
  duration: number;
  location: string;
  type: string;
}

export default function CalendarPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live-upcoming' | 'missed-recordings' | 'timetable'>('live-upcoming');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals
  const [joiningSession, setJoiningSession] = useState<LiveSession | null>(null);
  const [watchingRecording, setWatchingRecording] = useState<LiveSession | null>(null);

  // Timetable view mode
  const [timetableMode, setTimetableMode] = useState<'Week' | 'Monthly'>('Week');

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/live-classes');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.allSessions || []);
        setExams(data.exams || []);
      } else {
        toast.error("Failed to load schedule and live sessions");
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
  }, []);

  // Distinct courses
  const courseList = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.courseTitle).filter(Boolean)));
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
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
  const upcomingSessions = useMemo(() => filteredSessions.filter((s) => !s.isPast && !s.isLiveNow), [filteredSessions]);
  const missedRecordings = useMemo(() => filteredSessions.filter((s) => s.isPast), [filteredSessions]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Page Header and Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">
                  Online Sessions & Timetable
                </h1>
                {liveNowSessions.length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    {liveNowSessions.length} Session(s) Live Now
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0AEC0] mt-1">
                Join interactive live classes, catch up on missed lecture recordings, and view your schedule
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search sessions or topic..."
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
                  <option value="All">All Courses ({sessions.length})</option>
                  {courseList.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={fetchLiveClasses}
                title="Refresh sessions"
                className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div 
              onClick={() => setActiveTab('live-upcoming')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                activeTab === 'live-upcoming' 
                  ? 'bg-white border-[#5A67D8] shadow-md' 
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div>
                <p className="text-[11px] text-[#A0AEC0] font-semibold">Live & Scheduled Sessions</p>
                <h3 className="text-xl font-black text-[#111827] mt-0.5">
                  {liveNowSessions.length + upcomingSessions.length} Classes
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#5A67D8] flex items-center justify-center text-lg">
                <FiVideo />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('missed-recordings')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                activeTab === 'missed-recordings' 
                  ? 'bg-white border-[#5A67D8] shadow-md' 
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div>
                <p className="text-[11px] text-[#A0AEC0] font-semibold">Missed & Past Recordings</p>
                <h3 className="text-xl font-black text-purple-600 mt-0.5">
                  {missedRecordings.length} Recorded
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <MdVideoLibrary />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('timetable')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                activeTab === 'timetable' 
                  ? 'bg-white border-[#5A67D8] shadow-md' 
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div>
                <p className="text-[11px] text-[#A0AEC0] font-semibold">Weekly Schedule & Exams</p>
                <h3 className="text-xl font-black text-[#111827] mt-0.5">
                  {exams.length} Exams Listed
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-lg">
                <FiCalendar />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-6 px-1">
              <button
                onClick={() => setActiveTab('live-upcoming')}
                className={`py-3 text-xs md:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'live-upcoming'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent text-[#A0AEC0] hover:text-[#4A5568]'
                }`}
              >
                <MdOutlineLiveTv className="text-base" />
                Live & Upcoming Classes ({liveNowSessions.length + upcomingSessions.length})
              </button>

              <button
                onClick={() => setActiveTab('missed-recordings')}
                className={`py-3 text-xs md:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'missed-recordings'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent text-[#A0AEC0] hover:text-[#4A5568]'
                }`}
              >
                <MdVideoLibrary className="text-base" />
                Missed Sessions & Playback ({missedRecordings.length})
              </button>

              <button
                onClick={() => setActiveTab('timetable')}
                className={`py-3 text-xs md:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'timetable'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent text-[#A0AEC0] hover:text-[#4A5568]'
                }`}
              >
                <FiCalendar className="text-base" />
                Timetable Calendar View
              </button>
            </nav>
          </div>

          {/* TAB 1: LIVE & UPCOMING SESSIONS */}
          {activeTab === 'live-upcoming' && (
            <div className="space-y-8">
              
              {/* LIVE RIGHT NOW ALERT BANNER */}
              {liveNowSessions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    Live Class In Progress ({liveNowSessions.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveNowSessions.map((session) => (
                      <div 
                        key={session._id}
                        className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-3xl border border-red-200 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="px-2.5 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live Now
                            </span>
                            <span className="text-xs font-bold text-red-700">{session.courseTitle}</span>
                          </div>
                          <h3 className="text-lg font-black text-[#111827]">{session.title}</h3>
                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                            <FiUser /> {session.instructor}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <FiClock className="text-red-500" /> {session.startTimeFormatted} - {session.endTimeFormatted}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => setJoiningSession(session)}
                            className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                          >
                            <FiVideo className="text-base" /> Join Online Session Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UPCOMING SCHEDULED CLASSES */}
              <div className="space-y-4">
                <h2 className="text-xs font-black text-[#2D3748] uppercase tracking-wider">
                  Upcoming Scheduled Classes ({upcomingSessions.length})
                </h2>

                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse p-4" />
                    ))}
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 text-gray-400">
                    <FiVideo className="text-3xl mx-auto mb-2 text-gray-300" />
                    No upcoming live classes scheduled right now.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                    {upcomingSessions.map((session) => (
                      <div 
                        key={session._id}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-[#F7FAFC]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl flex-shrink-0">
                            <FiVideo />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-[#5A67D8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full uppercase">
                                {session.courseCategory}
                              </span>
                              <span className="text-xs font-semibold text-gray-400">{session.courseTitle}</span>
                            </div>

                            <h3 className="font-bold text-[#111827] text-base">{session.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span><FiUser className="inline mr-1" /> {session.instructor}</span>
                              <span>&bull;</span>
                              <span><FiCalendar className="inline mr-1" /> {session.dateFormatted}</span>
                              <span>&bull;</span>
                              <span><FiClock className="inline mr-1" /> {session.startTimeFormatted} - {session.endTimeFormatted}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                          <button
                            onClick={() => setJoiningSession(session)}
                            className="px-5 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
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
          )}

          {/* TAB 2: MISSED SESSIONS & RECORDINGS PLAYBACK */}
          {activeTab === 'missed-recordings' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 text-purple-900 text-xs">
                <FiInfo className="text-lg flex-shrink-0 text-purple-600" />
                <p>
                  Missed an online session? All past lectures are recorded and archived with instructor summary notes and downloadable slides so you never fall behind.
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse p-4" />
                  ))}
                </div>
              ) : missedRecordings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6 text-gray-400">
                  <MdVideoLibrary className="text-3xl mx-auto mb-2 text-gray-300" />
                  No past recorded sessions found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {missedRecordings.map((session) => (
                    <div 
                      key={session._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition hover:shadow-xl hover:border-purple-100 group"
                    >
                      {/* Video Thumbnail / Header */}
                      <div 
                        onClick={() => setWatchingRecording(session)}
                        className="h-40 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 relative flex flex-col justify-center items-center text-center cursor-pointer group-hover:brightness-110 transition"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                          <FiPlay className="ml-1" />
                        </div>
                        <span className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                          <FiClock className="text-[9px]" /> Archived Lecture
                        </span>
                        <span className="absolute top-3 left-3 bg-purple-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {session.courseCategory}
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#A0AEC0] mb-1">
                            <span>{session.courseTitle}</span>
                            <span>{session.dateFormatted}</span>
                          </div>
                          <h4 className="font-bold text-[#111827] text-sm group-hover:text-[#5A67D8] transition line-clamp-1" title={session.title}>
                            {session.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                            {session.description}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
                            <FiUser className="text-[10px]" /> Lecturer: {session.instructor}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setWatchingRecording(session)}
                            className="flex-1 px-4 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <FiPlay /> Watch Recording
                          </button>
                          <button
                            onClick={() => {
                              toast.success("Downloading session lecture slides...");
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
          )}

          {/* TAB 3: TIMETABLE VIEW */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              
              {/* Main Timetable Container */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                
                {/* Timetable Controls Bar */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-[#F7FAFC] gap-4">
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                      onClick={() => setTimetableMode('Week')}
                      className={`px-5 py-1.5 text-xs font-bold rounded-lg transition ${
                        timetableMode === 'Week' 
                          ? 'bg-[#5A67D8] text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Weekly Schedule
                    </button>
                    <button 
                      onClick={() => setTimetableMode('Monthly')}
                      className={`px-5 py-1.5 text-xs font-bold rounded-lg transition ${
                        timetableMode === 'Monthly' 
                          ? 'bg-[#5A67D8] text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Monthly Schedule
                    </button>
                  </div>

                  <span className="text-sm font-bold text-[#111827]">
                    Academic Schedule & Live Session Timetable
                  </span>
                </div>

                {/* Timetable List Grid */}
                <div className="p-6">
                  {sessions.length === 0 && exams.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      No timetable items found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                        Weekly Scheduled Online Classes & Exams
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sessions.map((s) => (
                          <div 
                            key={s._id}
                            className="p-4 rounded-2xl border border-gray-100 bg-[#F7FAFC] flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                                s.isLiveNow ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <FiVideo />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#5A67D8] uppercase">{s.courseTitle}</span>
                                <h5 className="font-bold text-[#111827] text-xs">{s.title}</h5>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {s.dateFormatted} &bull; {s.startTimeFormatted} - {s.endTimeFormatted}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => s.isPast ? setWatchingRecording(s) : setJoiningSession(s)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition flex-shrink-0 shadow-sm"
                            >
                              {s.isPast ? "View Recording" : "Join Class"}
                            </button>
                          </div>
                        ))}

                        {exams.map((ex) => (
                          <div 
                            key={ex._id}
                            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
                                <FiCalendar />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-purple-600 uppercase">{ex.courseTitle}</span>
                                <h5 className="font-bold text-[#111827] text-xs">{ex.title}</h5>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {ex.dateFormatted} &bull; {ex.duration} Mins &bull; {ex.location}
                                </p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-100 text-purple-700 flex-shrink-0 uppercase">
                              Exam
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

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
                  <span>Class Hours:</span>
                  <span className="font-semibold">{joiningSession.startTimeFormatted} - {joiningSession.endTimeFormatted}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-gray-700 uppercase tracking-wider mb-1">Session Overview</h5>
                <p className="text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                  {joiningSession.description}
                </p>
              </div>

              <div className="space-y-1.5 bg-[#F7FAFC] p-3.5 rounded-xl border border-gray-100 text-gray-600 text-[11px]">
                <p className="font-bold text-gray-800">Before joining:</p>
                <p>&bull; Ensure your microphone and webcam permissions are enabled.</p>
                <p>&bull; Join 5 minutes early to test your audio connection.</p>
              </div>

              {/* Direct Launch Button */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setJoiningSession(null)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <a
                  href={joiningSession.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setJoiningSession(null)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <FiVideo className="text-sm" /> Launch Online Classroom
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

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
                      <FiExternalLink className="text-sm" /> Open Lecture Video Stream
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
                  <p>{watchingRecording.description}</p>
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
                  {watchingRecording.resources.map((res, i) => (
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