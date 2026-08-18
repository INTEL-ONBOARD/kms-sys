"use client";

import { useState, useEffect, useMemo } from 'react';
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
  FiInfo
} from 'react-icons/fi';
import { MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import DashHeader from '@/Components/DashHeader';
import { useToast } from '@/Components/ToastProvider';
import type { CalendarEvent } from "@/app/api/student/calendar/route";

// ── Constants & Time Slots ────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const TIME_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

function formatHour(h: number) {
  const suffix = h < 12 ? "am" : "pm";
  const display = h > 12 ? h - 12 : h;
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
    : events.filter((e) => e.courseId === filterCourse || e.title === filterCourse);

  const eventMap = useMemo(() => {
    const map: Record<string, Record<number, CalendarEvent>> = {};
    for (const ev of filtered) {
      if (!map[ev.dayOfWeek]) map[ev.dayOfWeek] = {};
      map[ev.dayOfWeek][ev.startHour] = ev;
    }
    return map;
  }, [filtered]);

  const skippedCells = useMemo(() => {
    const skip = new Set<string>();
    for (const ev of filtered) {
      for (let h = ev.startHour + 1; h < ev.startHour + ev.durationHours; h++) {
        skip.add(`${ev.dayOfWeek}-${h}`);
      }
    }
    return skip;
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiCalendar className="text-5xl mb-4 text-slate-300" />
        <p className="font-bold text-slate-600 text-base">No classes scheduled</p>
        <p className="text-xs text-gray-400 mt-1">Your enrolled courses&apos; timetable slots will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-[#F7FAFC] border-b border-gray-200 text-[#4A5568] text-sm">
            <th className="py-4 border-r border-gray-200 font-bold w-24 text-xs uppercase tracking-wider">Time</th>
            {DAYS.map((day) => (
              <th key={day} className="py-4 border-r border-gray-200 font-bold w-36 last:border-r-0 text-xs uppercase tracking-wider">
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-sm">
          {TIME_SLOTS.map((hour) => (
            <tr key={hour} className="border-b border-gray-200 h-20 last:border-b-0">
              <td className="border-r border-gray-200 text-[#A0AEC0] font-medium text-xs px-2">
                {formatHour(hour)}
              </td>

              {DAYS.map((day) => {
                const cellKey = `${day}-${hour}`;
                if (skippedCells.has(cellKey)) return null;

                const ev = eventMap[day]?.[hour];

                if (ev) {
                  const textColor = getTextColor(ev.colorCode);
                  const subColor = getSubtleColor(ev.colorCode);
                  return (
                    <td
                      key={day}
                      rowSpan={ev.durationHours}
                      className="border-r border-gray-200 last:border-r-0 p-2.5 align-middle transition hover:brightness-95"
                      style={{
                        backgroundColor: ev.colorCode,
                        borderLeft: `4px solid ${ev.colorCode}cc`,
                      }}
                    >
                      <div
                        className="font-bold text-[13px] leading-snug"
                        style={{ color: textColor }}
                      >
                        {ev.title}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[11px] mt-1 font-medium" style={{ color: subColor }}>
                        <FiClock className="text-[10px]" />
                        {ev.startTime}–{ev.endTime}
                      </div>
                      {ev.location && (
                        <div className="flex items-center justify-center gap-1 text-[11px] mt-0.5 font-medium" style={{ color: subColor }}>
                          <FiMapPin className="text-[10px]" />
                          {ev.location}
                        </div>
                      )}
                    </td>
                  );
                }

                return (
                  <td key={day} className="border-r border-gray-200 last:border-r-0" />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
    : events.filter((e) => e.courseId === filterCourse || e.title === filterCourse);

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
        <p className="font-bold text-slate-600 text-base">No classes scheduled</p>
        <p className="text-xs text-gray-400 mt-1">Your enrolled courses&apos; timetable will appear here.</p>
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
                  const textColor = getTextColor(ev.colorCode);
                  const subColor = getSubtleColor(ev.colorCode);
                  return (
                    <div
                      key={`${ev.courseId}-${ev.startTime}`}
                      className="rounded-xl p-3 shadow-sm"
                      style={{ backgroundColor: ev.colorCode }}
                    >
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
  dateFormatted: string;
  duration: number;
  location: string;
  type: string;
}

export default function CalendarPage() {
  const toast = useToast();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timetableMode, setTimetableMode] = useState<'Week' | 'Monthly' | 'List'>('Week');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTimetableData = async () => {
    setLoading(true);
    try {
      const [calRes, liveRes] = await Promise.all([
        fetch('/api/student/calendar').catch(() => null),
        fetch('/api/student/live-classes').catch(() => null),
      ]);

      if (calRes && calRes.ok) {
        const calData = await calRes.json();
        setCalendarEvents(calData.events || []);
      }

      if (liveRes && liveRes.ok) {
        const liveData = await liveRes.json();
        setExams(liveData.exams || []);
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
  }, []);

  // Distinct courses for dropdown
  const courseList = useMemo(() => {
    const list = calendarEvents.map((e) => e.title).filter(Boolean);
    const examList = exams.map((ex) => ex.courseTitle).filter(Boolean);
    return Array.from(new Set([...list, ...examList]));
  }, [calendarEvents, exams]);

  // Filtered calendar events & exams
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (selectedCourse !== 'All' && ev.title !== selectedCourse && ev.courseId !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesLocation = (ev.location || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation) return false;
      }
      return true;
    });
  }, [calendarEvents, selectedCourse, searchQuery]);

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      if (selectedCourse !== 'All' && ex.courseTitle !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ex.title.toLowerCase().includes(q) || ex.courseTitle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [exams, selectedCourse, searchQuery]);

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
                Comprehensive weekly class schedule, room locations, lecture hours, and academic exam timetable
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search course or room..."
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
                onClick={fetchTimetableData}
                title="Refresh Timetable"
                className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
              </button>
            </div>
          </div>

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
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-[#F7FAFC] gap-4">
              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button 
                  onClick={() => setTimetableMode('Week')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                    timetableMode === 'Week' 
                      ? 'bg-[#5A67D8] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Weekly Timetable Grid
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
                  Classes & Exams List ({filteredEvents.length + filteredExams.length})
                </button>
              </div>

              <div className="text-xs text-gray-500 font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Semester 01 Regular Schedule</span>
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
                <div className="space-y-6">
                  {/* Scheduled Classes */}
                  <div>
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">
                      Weekly Recurring Classes ({filteredEvents.length})
                    </h3>
                    {filteredEvents.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No scheduled classes matching your filters.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredEvents.map((ev, i) => (
                          <div 
                            key={i}
                            className="p-4 rounded-2xl border border-gray-100 bg-[#F7FAFC] flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ backgroundColor: `${ev.colorCode}20`, color: ev.colorCode }}
                              >
                                <FiCalendar />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ev.dayOfWeek}</span>
                                <h5 className="font-bold text-[#111827] text-xs">{ev.title}</h5>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {ev.startTime} - {ev.endTime} {ev.location ? `• ${ev.location}` : ''}
                                </p>
                              </div>
                            </div>

                            <Link
                              href="/live-classes"
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#5A67D8] transition flex-shrink-0 shadow-sm"
                            >
                              Live Portal
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Exams */}
                  <div>
                    <h3 className="text-xs font-black text-purple-700 uppercase tracking-wider mb-3">
                      Scheduled Exams & Assessments ({filteredExams.length})
                    </h3>
                    {filteredExams.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No exams scheduled for this term.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredExams.map((ex) => (
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
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {ex.dateFormatted} &bull; {ex.duration} Mins &bull; {ex.location}
                                </p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-100 text-purple-700 flex-shrink-0 uppercase">
                              Official Exam
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}