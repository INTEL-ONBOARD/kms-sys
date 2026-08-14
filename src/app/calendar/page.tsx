"use client";

import { useState, useEffect, useMemo } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import Sidebar from "@/Components/Sidebar";
import DashHeader from "@/Components/DashHeader";
import type { CalendarEvent } from "@/app/api/student/calendar/route";

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** Hour rows rendered in the week view (08:00 – 16:00) */
const TIME_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

type Day = (typeof DAYS)[number];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatHour(h: number) {
  const suffix = h < 12 ? "am" : "pm";
  const display = h > 12 ? h - 12 : h;
  return `${String(display).padStart(2, "0")}:00 ${suffix}`;
}

/** Derive a readable text colour from a hex bg for contrast */
function getTextColor(hex: string): string {
  // Strip '#' and convert to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1A202C" : "#FFFFFF";
}

function getSubtleColor(hex: string): string {
  // Returns a very light tint of the hex for location text
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#4A5568" : "rgba(255,255,255,0.75)";
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function WeekSkeleton() {
  return (
    <div className="animate-pulse p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 rounded-lg" />
      ))}
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────

interface WeekViewProps {
  events: CalendarEvent[];
  filterCourse: string;
}

function WeekView({ events, filterCourse }: WeekViewProps) {
  const filtered = filterCourse === "all"
    ? events
    : events.filter((e) => e.courseId === filterCourse);

  /**
   * Build a lookup: { [day]: { [startHour]: CalendarEvent } }
   * so we can efficiently query O(1) per cell.
   */
  const eventMap = useMemo(() => {
    const map: Record<string, Record<number, CalendarEvent>> = {};
    for (const ev of filtered) {
      if (!map[ev.dayOfWeek]) map[ev.dayOfWeek] = {};
      map[ev.dayOfWeek][ev.startHour] = ev;
    }
    return map;
  }, [filtered]);

  /**
   * Track which cells are "consumed" by a rowSpan so we can skip rendering them.
   * Key format: `${day}-${hour}`
   */
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
        <p className="font-semibold text-slate-500 text-base">No classes scheduled</p>
        <p className="text-sm mt-1">Your enrolled courses&apos; timetable will appear here.</p>
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
              {/* Time label */}
              <td className="border-r border-gray-200 text-[#A0AEC0] font-medium text-xs px-2">
                {formatHour(hour)}
              </td>

              {/* Day cells */}
              {DAYS.map((day) => {
                const cellKey = `${day}-${hour}`;

                // This cell is covered by a rowSpan from a previous row → omit
                if (skippedCells.has(cellKey)) return null;

                const ev = eventMap[day]?.[hour];

                if (ev) {
                  const textColor   = getTextColor(ev.colorCode);
                  const subColor    = getSubtleColor(ev.colorCode);
                  return (
                    <td
                      key={day}
                      rowSpan={ev.durationHours}
                      className="border-r border-gray-200 last:border-r-0 p-2 align-middle"
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

                // Empty cell
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

// ── Monthly View ──────────────────────────────────────────────────────────

interface MonthlyViewProps {
  events: CalendarEvent[];
  filterCourse: string;
}

function MonthlyView({ events, filterCourse }: MonthlyViewProps) {
  const filtered = filterCourse === "all"
    ? events
    : events.filter((e) => e.courseId === filterCourse);

  // Group events by dayOfWeek (recurring weekly schedule)
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
        <p className="font-semibold text-slate-500 text-base">No classes scheduled</p>
        <p className="text-sm mt-1">Your enrolled courses&apos; timetable will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {DAYS.map((day) => (
        <div key={day} className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Day header */}
          <div className="bg-[#F7FAFC] border-b border-gray-200 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">{day}</span>
          </div>

          {/* Events for this day */}
          <div className="p-3 space-y-2 min-h-[80px]">
            {grouped[day].length === 0 ? (
              <p className="text-xs text-slate-300 text-center pt-4">—</p>
            ) : (
              grouped[day]
                .sort((a, b) => a.startHour - b.startHour)
                .map((ev) => {
                  const textColor = getTextColor(ev.colorCode);
                  const subColor  = getSubtleColor(ev.colorCode);
                  return (
                    <div
                      key={`${ev.courseId}-${ev.startTime}`}
                      className="rounded-lg p-3"
                      style={{ backgroundColor: ev.colorCode }}
                    >
                      <div className="font-bold text-[13px] leading-tight" style={{ color: textColor }}>
                        {ev.title}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: subColor }}>
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

// ── Main Page Component ────────────────────────────────────────────────────

export default function CalendarPage() {
  const [activeView,    setActiveView]    = useState<"Week" | "Monthly">("Week");
  const [events,        setEvents]        = useState<CalendarEvent[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [filterCourse,  setFilterCourse]  = useState("all");

  // Fetch from /api/student/calendar on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/student/calendar");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load calendar data");
        }
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Deduplicated list of enrolled courses for the filter dropdown
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ev of events) {
      if (!seen.has(ev.courseId)) seen.set(ev.courseId, ev.title);
    }
    return Array.from(seen.entries()); // [courseId, title][]
  }, [events]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />

        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">
                Calendar / Timetable
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Your weekly recurring class schedule based on enrolled courses.
              </p>
            </div>

            {/* Course Filter Dropdown */}
            <div className="relative">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="appearance-none bg-white border border-gray-200 shadow-sm text-sm font-semibold text-[#4A5568] py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50 min-w-[180px]"
              >
                <option value="all">All Courses</option>
                {courseOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Timetable Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">

            {/* Controls Bar */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-white space-y-4 md:space-y-0">

              {/* Week / Monthly Toggle */}
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                {(["Week", "Monthly"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-5 py-1.5 text-sm font-bold rounded-md transition ${
                      activeView === view
                        ? "bg-[#5A67D8] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {/* Date Navigator (display only — schedule is weekly recurring) */}
              <div className="flex items-center space-x-4">
                <button className="p-1 hover:bg-gray-100 rounded transition text-gray-500">
                  <FiChevronLeft className="text-xl" />
                </button>
                <span className="text-base font-bold text-[#2D3748]">
                  Weekly Schedule
                </span>
                <button className="p-1 hover:bg-gray-100 rounded transition text-gray-500">
                  <FiChevronRight className="text-xl" />
                </button>
              </div>

              <div className="w-32 hidden md:block" />
            </div>

            {/* Content Area */}
            {loading ? (
              <WeekSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <p className="font-semibold text-base">⚠ {error}</p>
                <p className="text-sm text-slate-400 mt-1">Please try refreshing the page.</p>
              </div>
            ) : activeView === "Week" ? (
              <WeekView events={events} filterCourse={filterCourse} />
            ) : (
              <MonthlyView events={events} filterCourse={filterCourse} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}