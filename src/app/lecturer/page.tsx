"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  FiBell,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiVideo,
  FiBookOpen,
  FiBook,
  FiUsers,
  FiClock,
  FiPlus,
  FiCheckCircle
} from "react-icons/fi";
import { MdEventNote } from "react-icons/md";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";
import AnnouncementComposer from "@/Components/lecturer/AnnouncementComposer";
import MiniBarChart from "@/Components/lecturer/MiniBarChart";
import MiniDonutChart from "@/Components/lecturer/MiniDonutChart";
import StatCard from "@/Components/lecturer/StatCard";

interface Course {
  _id: string;
  title: string;
  category: string;
  studentCount: number;
  avgCompletion: number;
  assignmentCount: number;
}

interface ScheduleItemData {
  _id: string;
  title: string;
  courseId?: { title: string };
  startTime: string;
  endTime: string;
  meetingLink?: string;
  status: string;
}

interface QueueItemData {
  _id: string;
  assignmentTitle: string;
  courseTitle: string;
  studentName: string;
  dueDate: string;
  isOverdue: boolean;
  overdueDays?: number;
}

export default function LecturerDashboardPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [modalType, setModalType] = useState<"assignment" | "class" | "material" | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = session?.user?.name || "Lecturer";

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/lecturer/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchDashboard, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const stats = dashboardData?.stats || {
    activeCourses: 0,
    totalStudents: 0,
    pendingGrades: 0,
    todaysClasses: 0,
  };

  const courses: Course[] = dashboardData?.courses || [];
  const schedule: ScheduleItemData[] = dashboardData?.schedule || [];
  const queue: QueueItemData[] = dashboardData?.gradingQueue || [];
  const activity = dashboardData?.recentActivity || [];
  const performance = dashboardData?.performance || {
    barChart: [],
    lineChart: [],
    donutChart: { A: 0, B: 0, C: 0, D: 0, F: 0 },
  };

  const scheduleDaySet = new Set(
    schedule
      .map((s) => new Date(s.startTime))
      .filter(
        (d) =>
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
      )
      .map((d) => d.getDate())
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .animate-breathe-delayed { animation: breathe 4s ease-in-out infinite 2s; }
        .animate-breathe-fast { animation: breathe 3.5s ease-in-out infinite 1s; }
      `}</style>

      {/* Header & Welcome Greeting */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748]">
            {getGreeting()},{" "}
            <span className="bg-gradient-to-r from-[#5A67D8] to-[#9F7AEA] bg-clip-text text-transparent">
              {userName}
            </span>{" "}
            👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Here&apos;s what&apos;s happening in your classes today.
          </p>
        </div>
        <button
          onClick={() => setModalType("class")}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm transition"
        >
          <FiPlus className="text-sm" /> Schedule Class
        </button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Active Courses"
          color="purple"
          icon={FiBook}
          value={stats.activeCourses}
          href="/lecturer/courses"
        />
        <StatCard
          label="Total Students"
          color="blue"
          icon={FiUsers}
          value={stats.totalStudents}
          href="/lecturer/students"
        />
        <StatCard
          label="Pending Grades"
          color="amber"
          icon={FiFileText}
          value={stats.pendingGrades}
          href="/lecturer/grades"
        />
        <StatCard
          label="Today's Classes"
          color="green"
          icon={FiVideo}
          value={stats.todaysClasses}
          href="/lecturer/live-classes"
        />
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT SECTION */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teaching Rating & Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <div className="w-full text-left">
                <h3 className="font-bold text-[#2D3748]">Teaching Overview</h3>
                <p className="text-xs text-[#A0AEC0] mt-1 mb-8">
                  Track active courses, total students <br /> and grading workload
                </p>
              </div>
              <div className="relative w-full h-48 flex items-center justify-center mt-4">
                {/* Purple Bubble: Active Courses */}
                <div className="absolute z-20 -top-4 left-6 w-24 h-24 rounded-full bg-[#857BE4] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(133,123,228,0.4)] animate-breathe">
                  <span className="text-xl font-bold">{stats.activeCourses}</span>
                  <span className="text-[10px] font-medium opacity-90 tracking-wide mt-0.5">Courses</span>
                </div>
                {/* Orange Bubble: Total Students */}
                <div className="absolute z-30 top-6 right-4 w-32 h-32 rounded-full bg-[#F39B40] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(243,155,64,0.4)] animate-breathe-delayed">
                  <span className="text-3xl font-bold">{stats.totalStudents}</span>
                  <span className="text-[11px] font-medium opacity-90 tracking-wide mt-1">Students</span>
                </div>
                {/* Cyan Bubble: Pending Grades */}
                <div className="absolute z-20 -bottom-6 left-12 w-28 h-28 rounded-full bg-[#42C3DF] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(66,195,223,0.4)] animate-breathe-fast">
                  <span className="text-2xl font-bold">{stats.pendingGrades}</span>
                  <span className="text-[11px] font-medium opacity-90 tracking-wide mt-0.5">Pending</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events / Calendar Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <h3 className="font-bold text-[#2D3748] mb-4">Teaching Calendar</h3>
              <div className="bg-[#F7FAFC] rounded-lg p-4 mb-4 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-[#2D3748]">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <div className="flex space-x-2 text-gray-400">
                    <FiChevronLeft
                      className="cursor-pointer hover:text-gray-800 transition"
                      onClick={handlePrevMonth}
                    />
                    <FiChevronRight
                      className="cursor-pointer hover:text-gray-800 transition"
                      onClick={handleNextMonth}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#A0AEC0] mb-3">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-xs font-medium text-gray-600">
                  {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                    <div key={`empty-${index}`} className="text-transparent">0</div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isCurrentDay = isToday(day);
                    const hasEvent = scheduleDaySet.has(day);
                    return (
                      <div key={day} className="flex flex-col items-center justify-center">
                        <div
                          className={`flex items-center justify-center mx-auto w-7 h-7 transition ${
                            isCurrentDay
                              ? "bg-[#5A67D8] text-white rounded-full shadow-md font-bold"
                              : "hover:bg-[#EEF2FF] hover:text-[#5A67D8] cursor-pointer rounded-full"
                          }`}
                        >
                          {day}
                        </div>
                        {hasEvent && (
                          <span className="w-1 h-1 rounded-full bg-[#5A67D8] mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[#A0AEC0] text-sm leading-relaxed">
                  {schedule.length > 0 ? `${schedule.length} live class(es) scheduled today` : "No classes scheduled for today"} <br />
                  <Link href="/lecturer/live-classes" className="text-[#5A67D8] hover:underline inline-block mt-0.5">
                    go to live classes
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Grid: My Courses & Live Classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Teaching Courses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#2D3748]">My Teaching Courses</h3>
                <Link
                  href="/lecturer/courses"
                  className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition"
                >
                  View All
                </Link>
              </div>
              <div className="p-2">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-gray-200 rounded w-28" />
                            <div className="h-2.5 bg-gray-200 rounded w-16" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full" />
                          <div className="w-6 h-2.5 bg-gray-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">No teaching courses assigned yet.</div>
                ) : (
                  courses.slice(0, 4).map((course) => (
                    <div
                      key={course._id}
                      className="flex justify-between items-center p-4 hover:bg-[#F7FAFC] rounded-lg transition"
                    >
                      <div className="flex items-center text-sm font-semibold text-[#4A5568]">
                        <div className="w-8 h-8 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-3">
                          <MdEventNote className="text-lg" />
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate w-36">{course.title}</span>
                          <span className="text-[10px] text-[#A0AEC0] font-medium">
                            {course.studentCount} Students
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5A67D8] rounded-full"
                            style={{ width: `${course.avgCompletion}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#5A67D8]">
                          {course.avgCompletion}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#2D3748]">Live Classes</h3>
                <span className="text-xs font-medium text-[#A0AEC0]">
                  {new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="p-6 space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse pb-4 border-b border-gray-50 last:border-0 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-4 bg-gray-200 rounded w-12" />
                        </div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-200 rounded w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : schedule.length === 0 ? (
                  <div className="text-sm text-gray-400">No classes scheduled for today.</div>
                ) : (
                  schedule.slice(0, 3).map((lc) => (
                    <div
                      key={lc._id}
                      className="flex flex-col pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#2D3748]">{lc.title}</span>
                        {lc.status === "live" && (
                          <span className="flex items-center text-[10px] font-bold text-red-500 uppercase">
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                            Live
                          </span>
                        )}
                        {lc.status === "upcoming" && (
                          <span className="text-[10px] font-bold text-[#5A67D8] uppercase bg-[#EEF2FF] px-2 py-0.5 rounded">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-[#A0AEC0] font-medium">
                        <span className="flex items-center gap-1">
                          <FiClock className="text-xs" /> {formatTime(lc.startTime)} - {formatTime(lc.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiBookOpen className="text-xs" /> {lc.courseId?.title || "General"}
                        </span>
                      </div>
                      {lc.meetingLink && (
                        <a
                          href={lc.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs font-semibold text-[#5A67D8] hover:underline flex items-center gap-1"
                        >
                          <FiVideo className="text-xs" /> Join Meeting
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="space-y-6">
          {/* Grading Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[#2D3748]">Grading Queue</h3>
              <Link
                href="/lecturer/grades"
                className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition"
              >
                View All
              </Link>
            </div>
            <div className="flex flex-col p-2">
              {loading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-200" />
                          <div className="h-3.5 bg-gray-200 rounded w-32" />
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded w-24 ml-4" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-12" />
                    </div>
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">All caught up! No pending submissions.</div>
              ) : (
                queue.slice(0, 4).map((q) => (
                  <div
                    key={q._id}
                    className={`flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg transition ${
                      q.isOverdue ? "bg-red-50/50" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className={`flex items-center text-sm font-semibold ${q.isOverdue ? "text-red-600" : "text-[#2D3748]"}`}>
                        <span className={`w-2 h-2 rounded-full mr-3 ${q.isOverdue ? "bg-red-500" : "bg-[#ED8936]"}`} />
                        {q.assignmentTitle}
                      </div>
                      <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">
                        {q.studentName} &middot; {q.isOverdue ? `Overdue by ${q.overdueDays}d` : `Due ${formatDate(q.dueDate)}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Overview (Bar & Donut) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-[#2D3748]">Teaching Analytics</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#A0AEC0] block mb-2">Class Average Scores</span>
                <MiniBarChart data={performance.barChart} />
              </div>
              <div className="pt-4 border-t border-gray-50">
                <span className="text-xs font-semibold text-[#A0AEC0] block mb-2">Grade Distribution</span>
                <MiniDonutChart data={performance.donutChart} />
              </div>
            </div>
          </div>

          {/* Quick Announcement Composer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <AnnouncementComposer courses={courses} onAnnouncementPosted={fetchDashboard} />
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {modalType && <QuickActionModal type={modalType} onClose={() => setModalType(null)} />}
    </>
  );
}