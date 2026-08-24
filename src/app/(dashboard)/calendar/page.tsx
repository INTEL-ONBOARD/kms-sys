"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiSearch, 
  FiChevronDown, 
  FiRefreshCw, 
  FiArrowRight, 
  FiVideo, 
  FiBookOpen, 
  FiInfo,
  FiFileText,
  FiExternalLink,
  FiX
} from 'react-icons/fi';
import { MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';
import Sidebar from '@/components/shared/Sidebar';
import DashHeader from '@/components/shared/DashHeader';
import { useToast } from '@/contexts/ToastContext';
import type { CalendarEvent } from "@/app/api/student/calendar/route";

// ── Constants & Time Slots ────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function formatHour(h: number) {
  if (h === 24) return "12:00 am";
  const suffix = h < 12 ? "am" : "pm";
  let display = h % 12;
  if (display === 0) display = 12;
  return `${String(display).padStart(2, "0")}:00 ${suffix}`;
}

function getTextColor(hex: string): string {
  if (!hex || hex.length < 7) return "#1A202C";
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1A202C" : "#FFFFFF";
}

function getSubtleColor(hex: string): string {
  if (!hex || hex.length < 7) return "#4A5568";
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#4A5568" : "rgba(255,255,255,0.75)";
}

function WeekSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );
}

// ── Weekly Timetable Component ─────────────────────────────────────────────

interface WeekViewProps {
  events: CalendarEvent[];
  filterCourse: string;
}

function WeekView({ events, filterCourse }: WeekViewProps) {
  const filtered = filterCourse === "All" || filterCourse === "all"
    ? events
    : events.filter((e) => e.courseId === filterCourse || e.title === filterCourse || e.courseTitle === filterCourse);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 5; i <= 24; i++) {
      slots.push(i);
    }
    return slots;
  }, []);

  const groupedByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const day of DAYS) map[day] = [];
    for (const ev of filtered) {
      if (map[ev.dayOfWeek]) map[ev.dayOfWeek].push(ev);
    }
    return map;
  }, [filtered]);

  const parseTimeStrToDecimalHour = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
    if (!match) return 0;
    let [, h, m, meridiem] = match;
    let hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    if (meridiem) {
      const isPM = meridiem.toLowerCase() === 'pm';
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }
    return hour + (min / 60);
  };

  const ROW_HEIGHT = 140; // Base height of a 1-hour block in pixels
  const START_HOUR = 5;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiCalendar className="text-5xl mb-4 text-slate-300" />
        <p className="font-bold text-slate-600 text-base">No classes or exams scheduled</p>
        <p className="text-xs text-gray-400 mt-1">Your enrolled courses, scheduled live classes, and exams will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[900px] border border-gray-200 rounded-xl bg-white flex flex-col shadow-sm">
        
        {/* Header (Days) */}
        <div className="grid grid-cols-[6rem_repeat(7,1fr)] bg-[#F7FAFC] border-b border-gray-200">
          <div className="py-4 border-r border-gray-200 font-bold text-xs uppercase tracking-wider text-center text-[#4A5568]">Time</div>
          {DAYS.map((day) => (
            <div key={day} className="py-4 border-r border-gray-200 last:border-r-0 font-bold text-xs uppercase tracking-wider text-center text-[#4A5568]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body (Grid & Events) */}
        <div className="grid grid-cols-[6rem_repeat(7,1fr)]">
          
          {/* Time Labels (Y-Axis) */}
          <div className="border-r border-gray-200 bg-white">
            {timeSlots.map((hour) => (
              <div key={hour} className="border-b border-gray-200 flex items-start justify-end pr-2 pt-2 last:border-b-0" style={{ height: `${ROW_HEIGHT}px` }}>
                <span className="text-[#A0AEC0] font-medium text-xs -mt-4 bg-white px-1 leading-none block">{formatHour(hour)}</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {DAYS.map((day) => (
            <div key={day} className="relative border-r border-gray-200 last:border-r-0 bg-white">
              
              {/* Background Grid Lines (1 Hour Slots) */}
              {timeSlots.map((hour) => (
                <div key={hour} className="border-b border-gray-100 last:border-b-0 w-full" style={{ height: `${ROW_HEIGHT}px` }} />
              ))}

              {/* Absolute Positioned Events */}
              {groupedByDay[day].map((ev) => {
                const startDecimal = parseTimeStrToDecimalHour(ev.startTime);
                let endDecimal = parseTimeStrToDecimalHour(ev.endTime);
                
                if (endDecimal === 0 && startDecimal > 0) {
                  endDecimal = 24; 
                }
                
                let duration = endDecimal - startDecimal;
                if (duration <= 0) {
                  duration = ev.durationHours || 1; 
                }

                const top = (startDecimal - START_HOUR) * ROW_HEIGHT;
                const height = duration * ROW_HEIGHT;

                const isExam = ev.eventType === 'exam';
                const isLive = ev.eventType === 'live_class';
                const bgColor = isExam ? '#7C3AED' : isLive ? '#2563EB' : (ev.colorCode || '#5A67D8');
                const textColor = getTextColor(bgColor);
                const subColor = getSubtleColor(bgColor);

                return (
                  <div
                    key={ev.id || `${ev.title}-${ev.startTime}`}
                    className="absolute left-1 right-1 rounded-md p-2 shadow-sm overflow-hidden transition hover:brightness-95 border-l-4 z-10 hover:z-20 hover:shadow-md flex flex-col items-center justify-center text-center gap-1"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: bgColor,
                      borderLeftColor: `${bgColor}cc`
                    }}
                  >
                    {/* Badges */}
                    {(isExam || isLive) && (
                      <div className="flex justify-center w-full">
                        {isExam ? (
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-purple-900/40 text-purple-100 tracking-wider shadow-xs">
                            EXAM
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-blue-900/40 text-blue-100 tracking-wider shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            LIVE CLASS
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="font-bold text-[10px] sm:text-[12px] leading-tight" style={{ color: textColor }}>
                      {ev.title}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] sm:text-[10px] font-medium" style={{ color: subColor }}>
                      <span className="flex items-center gap-1"><FiClock className="text-[9px]" /> {ev.startTime}–{ev.endTime}</span>
                      {ev.location && <span className="flex items-center gap-1 mt-0.5"><FiMapPin className="text-[9px]" /> {ev.location}</span>}
                    </div>

                    {isLive && ev.meetingLink && (
                      <div className="pt-1">
                        <a
                          href={ev.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white transition shadow-xs"
                        >
                          <FiVideo className="text-[10px]" /> Join
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Monthly Grid Component ────────────────────────────────────────────────

interface MonthlyViewProps {
  events: CalendarEvent[];
  filterCourse: string;
}

function MonthlyView({ events, filterCourse }: MonthlyViewProps) {
  const filtered = filterCourse === "All" || filterCourse === "all"
    ? events
    : events.filter((e) => e.courseId === filterCourse || e.title === filterCourse || e.courseTitle === filterCourse);

  const grouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const day of DAYS) map[day] = [];
    for (const ev of filtered) {
      if (map[ev.dayOfWeek]) map[ev.dayOfWeek].push(ev);
    }
    return map;
  }, [filtered]);

  const hasAny = filtered.length > 0;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiCalendar className="text-5xl mb-4 text-slate-300" />
        <p className="font-bold text-slate-600 text-base">No classes or exams scheduled</p>
        <p className="text-xs text-gray-400 mt-1">Your enrolled courses, scheduled live classes, and exams will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {DAYS.map((day) => (
        <div key={day} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <div className="bg-[#F7FAFC] border-b border-gray-200 px-4 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">{day}</span>
          </div>

          <div className="p-3 space-y-2 min-h-[90px]">
            {grouped[day].length === 0 ? (
              <p className="text-xs text-slate-300 text-center pt-5">—</p>
            ) : (
              grouped[day]
                .sort((a, b) => a.startHour - b.startHour)
                .map((ev) => {
                  const isExam = ev.eventType === 'exam';
                  const isLive = ev.eventType === 'live_class';
                  const bgColor = isExam ? '#7C3AED' : isLive ? '#2563EB' : (ev.colorCode || '#5A67D8');
                  const textColor = getTextColor(bgColor);
                  const subColor = getSubtleColor(bgColor);

                  return (
                    <div
                      key={ev.id || `${ev.courseId}-${ev.startTime}`}
                      className="rounded-xl p-3 shadow-sm"
                      style={{ backgroundColor: bgColor }}
                    >
                      {/* Header Badge */}
                      {isExam ? (
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-purple-900/40 text-purple-100 tracking-wider mb-1">
                          EXAM
                        </span>
                      ) : isLive ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-blue-900/40 text-blue-100 tracking-wider mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          LIVE CLASS
                        </span>
                      ) : null}

                      <div className="font-bold text-[13px] leading-tight" style={{ color: textColor }}>
                        {ev.title}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: subColor }}>
                        <FiClock className="text-[10px]" />
                        {ev.startTime} – {ev.endTime}
                      </div>

                      {ev.location && (
                        <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: subColor }}>
                          <FiMapPin className="text-[10px]" />
                          {ev.location}
                        </div>
                      )}

                      {isLive && ev.meetingLink && (
                        <div className="mt-2">
                          <a
                            href={ev.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white transition"
                          >
                            <FiVideo className="text-[10px]" /> Join Session
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Timetable Calendar Page ──────────────────────────────────────────

interface ExamItem {
  _id: string;
  title: string;
  courseTitle: string;
  date: string;
  dateFormatted: string;
  timeFormatted?: string;
  duration: number;
  location: string;
  type: string;
  status: string;
}

interface LiveClassItem {
  _id: string;
  title: string;
  courseTitle: string;
  instructor?: string;
  startTime: string;
  endTime: string;
  dateFormatted: string;
  timeFormatted: string;
  meetingLink?: string;
  status: string;
}

function CalendarContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialCourseParam = searchParams.get('courseId') || searchParams.get('course') || '';

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timetableMode, setTimetableMode] = useState<'Week' | 'Monthly' | 'List'>('Week');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'lecture' | 'live_class' | 'exam'>('all');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeCourseFilter, setActiveCourseFilter] = useState(initialCourseParam);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTimetableData = async (targetCourseFilter?: string) => {
    setLoading(true);
    try {
      const filterToUse = targetCourseFilter !== undefined ? targetCourseFilter : activeCourseFilter;
      const url = filterToUse && filterToUse !== 'All'
        ? `/api/student/calendar?courseId=${encodeURIComponent(filterToUse)}`
        : '/api/student/calendar';

      const calRes = await fetch(url);
      if (calRes.ok) {
        const calData = await calRes.json();
        const payload = calData.data || calData;
        setCalendarEvents(payload.events || []);
        setExams(payload.exams || []);
        setLiveClasses(payload.liveClasses || []);
      } else {
        toast.error("Failed to load timetable calendar");
      }
    } catch (err) {
      console.error("Fetch calendar error:", err);
      toast.error("Failed to load timetable calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [activeCourseFilter]);

  // Distinct courses for dropdown
  const courseList = useMemo(() => {
    const fromEvents = calendarEvents.map((e) => e.courseTitle || e.title).filter(Boolean);
    const fromExams = exams.map((ex) => ex.courseTitle).filter(Boolean);
    const fromLive = liveClasses.map((lc) => lc.courseTitle).filter(Boolean);
    return Array.from(new Set([...fromEvents, ...fromExams, ...fromLive]));
  }, [calendarEvents, exams, liveClasses]);

  // Filtered calendar events based on search, course, and event type (only upcoming/live sessions)
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return calendarEvents.filter((ev) => {
      // Exclude ended or finished live classes from the calendar
      if (ev.eventType === 'live_class') {
        if (ev.status === 'ended' || ev.status === 'cancelled' || ev.status === 'completed') return false;
        if (ev.date && new Date(ev.date).getTime() + (ev.durationHours || 1) * 3600000 < now && ev.status !== 'live') {
          return false;
        }
      }
      if (eventTypeFilter !== 'all' && ev.eventType !== eventTypeFilter) return false;
      if (selectedCourse !== 'All' && ev.title !== selectedCourse && ev.courseTitle !== selectedCourse && ev.courseId !== selectedCourse) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesCourse = (ev.courseTitle || '').toLowerCase().includes(q);
        const matchesLocation = (ev.location || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesLocation) return false;
      }
      return true;
    });
  }, [calendarEvents, eventTypeFilter, selectedCourse, searchQuery]);

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      if (ex.status === 'completed' || ex.status === 'cancelled') return false;
      if (selectedCourse !== 'All' && ex.courseTitle !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ex.title.toLowerCase().includes(q) || ex.courseTitle.toLowerCase().includes(q) || (ex.location || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [exams, selectedCourse, searchQuery]);

  const filteredLiveClasses = useMemo(() => {
    const now = Date.now();
    return liveClasses.filter((lc) => {
      // Exclude finished / ended classes
      if (lc.status === 'ended' || lc.status === 'cancelled' || lc.status === 'completed') return false;
      if (lc.endTime && new Date(lc.endTime).getTime() < now && lc.status !== 'live') return false;
      if (selectedCourse !== 'All' && lc.courseTitle !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return lc.title.toLowerCase().includes(q) || lc.courseTitle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [liveClasses, selectedCourse, searchQuery]);

  const lectureEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.eventType === 'lecture');
  }, [filteredEvents]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide flex items-center gap-2.5">
                <FiCalendar className="text-[#5A67D8] text-3xl" />
                Timetable Calendar
              </h1>
              <p className="text-xs text-[#A0AEC0] mt-1">
                Comprehensive weekly class schedule, scheduled live sessions by lecturers, and term exam timetable
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search class, exam, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 shadow-sm text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8]"
                />
              </div>

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
                onClick={() => fetchTimetableData()}
                title="Refresh Timetable"
                className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Active Course Workspace Filter Banner */}
          {activeCourseFilter && activeCourseFilter !== "All" && (
            <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#5A67D8] text-white flex items-center justify-center text-xs font-bold">
                  <FiBookOpen />
                </div>
                <div>
                  <span className="font-extrabold text-[#2D3748]">Course Schedule Filter:</span>{" "}
                  <span className="text-[#5A67D8] font-bold">
                    {courseList.length > 0 ? courseList[0] : activeCourseFilter}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Showing lectures, live classes, and exams strictly for this course workspace.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.history.replaceState({}, '', '/calendar');
                  setActiveCourseFilter('');
                  setSelectedCourse('All');
                  fetchTimetableData('All');
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-[#5A67D8] border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 flex items-center gap-1.5"
              >
                <FiX /> Show All Courses
              </button>
            </div>
          )}

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Link
              href="/live-classes"
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm flex items-center justify-between hover:border-blue-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <MdOutlineLiveTv />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Live Classes Portal</h4>
                  <p className="text-[11px] text-gray-500">Join real-time lecture streams & online sessions</p>
                </div>
              </div>
              <FiArrowRight className="text-blue-600 text-sm group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/recordings"
              className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl shadow-sm flex items-center justify-between hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <MdVideoLibrary />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Lecture Playback Archive</h4>
                  <p className="text-[11px] text-gray-500">Watch missed class recordings & download notes</p>
                </div>
              </div>
              <FiArrowRight className="text-purple-600 text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Main Timetable Card Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/* Timetable Sub-Header & Mode Switcher */}
            <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#F7FAFC] gap-4">
              
              {/* View Modes */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => setTimetableMode('Week')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                      timetableMode === 'Week' 
                        ? 'bg-[#5A67D8] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Weekly Grid
                  </button>
                  <button 
                    onClick={() => setTimetableMode('Monthly')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                      timetableMode === 'Monthly' 
                        ? 'bg-[#5A67D8] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly View
                  </button>
                  <button 
                    onClick={() => setTimetableMode('List')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                      timetableMode === 'List' 
                        ? 'bg-[#5A67D8] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Structured List ({filteredEvents.length})
                  </button>
                </div>

                {/* Event Type Filter Pills */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 shadow-sm">
                  <button
                    onClick={() => setEventTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventTypeFilter === 'all' ? 'bg-gray-800 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    All ({calendarEvents.length})
                  </button>
                  <button
                    onClick={() => setEventTypeFilter('live_class')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      eventTypeFilter === 'live_class' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Live Classes ({liveClasses.length})
                  </button>
                  <button
                    onClick={() => setEventTypeFilter('exam')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      eventTypeFilter === 'exam' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Exams ({exams.length})
                  </button>
                  <button
                    onClick={() => setEventTypeFilter('lecture')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      eventTypeFilter === 'lecture' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    Lectures
                  </button>
                </div>
              </div>

              {/* Legend Indicator */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5A67D8]" /> Regular Lectures
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Lecturer Live Classes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Scheduled Exams
                </span>
              </div>
            </div>

            {/* Timetable Body */}
            <div className="p-4 md:p-6">
              {loading ? (
                <WeekSkeleton />
              ) : timetableMode === 'Week' ? (
                <WeekView events={filteredEvents} filterCourse={selectedCourse} />
              ) : timetableMode === 'Monthly' ? (
                <MonthlyView events={filteredEvents} filterCourse={selectedCourse} />
              ) : (
                /* List Mode */
                <div className="space-y-8">
                  
                  {/* 1. Scheduled Exams */}
                  {(eventTypeFilter === 'all' || eventTypeFilter === 'exam') && (
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-purple-100 pb-2">
                        <h3 className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          Official Exams & Assessments ({filteredExams.length})
                        </h3>
                        <span className="text-[11px] text-purple-600 font-semibold">Scheduled by Faculty</span>
                      </div>

                      {filteredExams.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                          No exams scheduled for your courses at this time.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredExams.map((ex) => (
                            <div 
                              key={ex._id}
                              className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 flex items-center justify-between gap-4 shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                                  <FiCalendar />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-md">
                                      {ex.courseTitle}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                      {ex.type}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-[#111827] text-xs mt-1">{ex.title}</h5>
                                  <p className="text-[11px] text-gray-600 mt-0.5 flex flex-wrap items-center gap-2 font-medium">
                                    <span><FiClock className="inline mr-1 text-purple-600" /> {ex.dateFormatted} {ex.timeFormatted ? `(${ex.timeFormatted})` : ''}</span>
                                    <span>&bull;</span>
                                    <span>{ex.duration} Mins</span>
                                    <span>&bull;</span>
                                    <span><FiMapPin className="inline mr-1 text-purple-600" /> {ex.location}</span>
                                  </p>
                                </div>
                              </div>

                              <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-200 text-purple-900 flex-shrink-0 uppercase">
                                {ex.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Scheduled Live Classes */}
                  {(eventTypeFilter === 'all' || eventTypeFilter === 'live_class') && (
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
                        <h3 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          Live Classes Scheduled by Lecturers ({filteredLiveClasses.length})
                        </h3>
                        <span className="text-[11px] text-blue-600 font-semibold">Real-Time Interactive Sessions</span>
                      </div>

                      {filteredLiveClasses.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                          No live classes scheduled by your lecturers at this time.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredLiveClasses.map((lc) => (
                            <div 
                              key={lc._id}
                              className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-4 shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                                  <MdOutlineLiveTv />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                                      {lc.courseTitle}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500">
                                      {lc.instructor || "Course Lecturer"}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-[#111827] text-xs mt-1">{lc.title}</h5>
                                  <p className="text-[11px] text-gray-600 mt-0.5 font-medium flex items-center gap-1.5">
                                    <FiClock className="text-blue-600 text-xs" />
                                    <span>{lc.dateFormatted} &bull; {lc.timeFormatted}</span>
                                  </p>
                                </div>
                              </div>

                              {lc.meetingLink ? (
                                <a
                                  href={lc.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 shadow-xs flex items-center gap-1.5"
                                >
                                  <FiVideo /> Join Live
                                </a>
                              ) : (
                                <Link
                                  href="/live-classes"
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 transition flex-shrink-0 shadow-xs"
                                >
                                  Class Details
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Weekly Recurring Course Lectures */}
                  {(eventTypeFilter === 'all' || eventTypeFilter === 'lecture') && (
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#5A67D8]" />
                          Weekly Recurring Lectures ({lectureEvents.length})
                        </h3>
                        <span className="text-[11px] text-gray-500 font-semibold">Semester Schedule</span>
                      </div>

                      {lectureEvents.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                          No recurring lectures defined for your current enrolled courses.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lectureEvents.map((ev, i) => (
                            <div 
                              key={i}
                              className="p-4 rounded-2xl border border-gray-200 bg-[#F7FAFC] flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold"
                                  style={{ backgroundColor: `${ev.colorCode}20`, color: ev.colorCode }}
                                >
                                  <FiBookOpen />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ev.dayOfWeek}</span>
                                  <h5 className="font-bold text-[#111827] text-xs">{ev.title}</h5>
                                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                                    {ev.startTime} - {ev.endTime} {ev.location ? `• ${ev.location}` : ''}
                                  </p>
                                </div>
                              </div>

                              <Link
                                href="/courses"
                                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#5A67D8] transition flex-shrink-0 shadow-xs"
                              >
                                View Course
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5A67D8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}