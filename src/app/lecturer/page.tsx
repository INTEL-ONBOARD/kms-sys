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
  FiCheckCircle,
  FiUploadCloud,
  FiLock,
  FiAlertCircle
} from "react-icons/fi";
import { MdEventNote } from "react-icons/md";
import QuickActionModal from "@/Components/lecturer/QuickActionModal";
import MaterialUploadModal from "@/Components/lecturer/MaterialUploadModal";
import AnnouncementComposer from "@/Components/lecturer/AnnouncementComposer";
import MiniBarChart from "@/Components/lecturer/MiniBarChart";
import MiniDonutChart from "@/Components/lecturer/MiniDonutChart";
import StatCard from "@/Components/lecturer/StatCard";
import { useToast } from "@/Components/ToastProvider";

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
  const toast = useToast();
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

  const hasAssignedCourses = stats.activeCourses > 0;

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

  const handleUploadMaterialClick = () => {
    if (!hasAssignedCourses) {
      toast.warning("Upload Blocked: You must be assigned to a course by an administrator before uploading materials.");
      return;
    }
    setModalType("material");
  };

  const handleScheduleClassClick = () => {
    if (!hasAssignedCourses) {
      toast.warning("Schedule Blocked: You must be assigned to a course by an administrator before scheduling live classes.");
      return;
    }
    setModalType("class");
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
            {hasAssignedCourses 
              ? "Here's what's happening in your classes today."
              : "Welcome to Wise East University! Your lecturer profile is currently active in read-only mode awaiting course assignment."
            }
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleUploadMaterialClick}
            disabled={!hasAssignedCourses}
            title={!hasAssignedCourses ? "Course assignment required" : "Upload course material"}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm transition ${
              hasAssignedCourses
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            {!hasAssignedCourses && <FiLock className="text-xs text-amber-500" />}
            <FiUploadCloud className="text-sm" /> 
            <span>Upload Material</span>
          </button>
          <button
            onClick={handleScheduleClassClick}
            disabled={!hasAssignedCourses}
            title={!hasAssignedCourses ? "Course assignment required" : "Schedule a live class"}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm transition ${
              hasAssignedCourses
                ? "bg-[#5A67D8] text-white hover:bg-[#434190] cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            {!hasAssignedCourses && <FiLock className="text-xs text-amber-500" />}
            <FiPlus className="text-sm" /> 
            <span>Schedule Class</span>
          </button>
        </div>
      </div>

      {/* Pending Course Assignment Notice Banner (for newly registered lecturers) */}
      {!loading && !hasAssignedCourses && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0 font-bold">
              <FiLock />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Awaiting Course Assignment
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Setup in Progress
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                You have successfully registered your lecturer account. To ensure academic integrity, course curriculum, material uploads, assignment management, live classes, and student gradebooks are assigned directly from the <strong>Admin Panel</strong>.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-100/60 px-3 py-1.5 rounded-lg w-fit">
                <FiAlertCircle className="text-amber-700 shrink-0 text-sm" />
                <span>All upload and modification features will automatically unlock as soon as an administrator assigns your courses.</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between text-xs font-semibold text-[#718096]">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-[#5A67D8] mr-2" />
                  Live Class Scheduled
                </div>
                <Link
                  href="/lecturer/live-classes"
                  className="text-[#5A67D8] hover:underline"
                >
                  View Schedule
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Announcement Composer */}
          <AnnouncementComposer courses={courses} onAnnouncementPosted={fetchDashboard} />

          {/* Student Performance Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniBarChart data={performance.barChart} />
            <MiniDonutChart data={performance.donutChart} />
          </div>

          {/* Bottom Row: Your Courses & Live Classes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Courses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#2D3748]">Your Courses</h3>
                <Link
                  href="/lecturer/courses"
                  className="text-xs font-bold text-[#5A67D8] hover:underline"
                >
                  See All ({courses.length})
                </Link>
              </div>
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="space-y-1">
                            <div className="w-28 h-3 bg-gray-200 rounded" />
                            <div className="w-16 h-2 bg-gray-200 rounded" />
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
                  <div className="p-6 text-center text-xs text-gray-400">
                    <FiBook className="text-3xl text-gray-300 mx-auto mb-2" />
                    No teaching courses assigned yet.
                  </div>
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
                  <div className="text-xs text-gray-400 text-center py-4">No classes scheduled for today.</div>
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
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-ping" />
                            Live Now
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-[#A0AEC0] font-medium">
                        <span>{lc.courseId?.title || "General Course"}</span>
                        <span>{formatTime(lc.startTime)}</span>
                      </div>
                      {lc.meetingLink && (
                        <a
                          href={lc.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-xs font-semibold text-[#5A67D8] hover:underline flex items-center gap-1"
                        >
                          <FiVideo className="text-xs" /> Join Session
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Grading Queue & Activity */}
        <div className="space-y-6">
          {/* Action Required: Grading Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[#2D3748]">Grading Queue</h3>
              <Link
                href="/lecturer/grades"
                className="text-xs font-bold text-[#5A67D8] hover:underline"
              >
                View All ({queue.length})
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2 pb-3 border-b border-gray-50 last:border-0">
                      <div className="h-4 bg-gray-200 rounded w-28" />
                      <div className="h-3 bg-gray-200 rounded w-40" />
                    </div>
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  <FiCheckCircle className="text-3xl text-green-400 mx-auto mb-2" />
                  All submissions are graded! Great work.
                </div>
              ) : (
                queue.slice(0, 5).map((q) => (
                  <div
                    key={q._id}
                    className="flex flex-col pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2D3748]">
                        {q.assignmentTitle}
                      </span>
                      {q.isOverdue && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          {q.overdueDays}d overdue
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#718096]">{q.courseTitle}</span>
                    <span className="text-[10px] text-[#A0AEC0]">
                      Submitted by: <strong className="text-gray-600">{q.studentName}</strong>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[#2D3748]">Recent Activity</h3>
              <span className="text-xs font-medium text-[#A0AEC0]">Last 7 days</span>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 bg-gray-200 rounded w-32" />
                        <div className="h-2 bg-gray-200 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  <FiBell className="text-3xl text-gray-300 mx-auto mb-2" />
                  No recent activity yet.
                </div>
              ) : (
                activity.slice(0, 6).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      {act.type === "submission" ? <FiFileText /> : <FiBell />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 font-semibold truncate">{act.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {act.courseTitle} • {formatDate(act.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType && (
        <QuickActionModal
          type={modalType}
          onClose={() => setModalType(null)}
          onSuccess={fetchDashboard}
        />
      )}
    </>
  );
}