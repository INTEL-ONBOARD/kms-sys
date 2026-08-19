"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiFileText, 
  FiChevronLeft, 
  FiChevronRight, 
  FiVideo, 
  FiBookOpen, 
  FiClock,
  FiCalendar,
  FiDownload,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';
import { MdEventNote } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';
import { useToast } from '@/Components/ToastProvider';

interface Course {
  _id: string;
  title: string;
  instructor: string;
  progress: number;
}

interface Assignment {
  _id: string;
  title: string;
  courseId: { title: string };
  dueDate: string;
  maxPoints: number;
}

interface Exam {
  _id: string;
  title: string;
  courseId: { title: string };
  date: string;
  duration: number;
  location: string;
  type: string;
}

interface LiveClass {
  _id: string;
  title: string;
  courseId: { title: string };
  startTime: string;
  endTime: string;
  meetingLink: string;
  status: string;
}

interface MaterialItem {
  _id: string;
  title: string;
  materialType: string;
  fileName: string;
  fileUrl: string;
  courseId?: { title: string };
  createdAt: string;
}

interface AnnouncementItem {
  _id: string;
  message: string;
  courseId?: { _id: string; title: string };
  lecturerId?: { _id: string; name: string };
  createdAt: string;
}

export default function DashboardPage() {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [gpa, setGpa] = useState<string>("0.0");
  const [attendance, setAttendance] = useState<number>(0);
  const [reportApproved, setReportApproved] = useState<boolean>(false);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [requestingApproval, setRequestingApproval] = useState<boolean>(false);
  const [approvalRequested, setApprovalRequested] = useState<boolean>(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "Recently";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/student/dashboard');
        if (res.ok) {
          const data = await res.json();
          setCourses(
            (data.enrollments || []).map((e: any) => ({
              _id: e.courseId?._id || e._id,
              title: e.courseId?.title || 'Untitled Course',
              instructor: e.courseId?.instructor || 'Unknown',
              progress: e.progress || 0,
            }))
          );
          setAssignments(data.assignments || []);
          setExams(data.exams || []);
          setLiveClasses(data.liveClasses || []);
          setMaterials(data.materials || []);
          setAnnouncements(data.announcements || []);
          setCredits(data.credits ?? 0);
          setGpa(data.gpa ?? "0.0");
          setAttendance(data.attendance ?? 0);
          setReportApproved(!!data.reportApproved);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} Days`;
  };

  const isOverdue = (dateStr: string) => new Date(dateStr).getTime() < Date.now();

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .animate-breathe-delayed { animation: breathe 4s ease-in-out infinite 2s; }
        .animate-breathe-fast { animation: breathe 3.5s ease-in-out infinite 1s; }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Dashboard</h1>
              <p className="text-xs text-[#A0AEC0] mt-0.5">Welcome back to your academic performance & learning portal</p>
            </div>

            {/* Download Report Button - Blocked unless Admin Approved */}
            <div className="flex items-center gap-3">
              <button
                id="download-report-btn"
                onClick={() => {
                  if (reportApproved) {
                    window.location.href = '/grades';
                  } else {
                    setShowApprovalModal(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer ${
                  reportApproved
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
                title={reportApproved ? "Download Official Academic Report" : "Admin Approval Required to Download Report"}
              >
                {reportApproved ? (
                  <>
                    <FiDownload className="text-sm" />
                    <span>Download Report</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-[9px] uppercase font-black rounded text-white">Approved</span>
                  </>
                ) : (
                  <>
                    <FiLock className="text-sm text-amber-700" />
                    <span>Download Report</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] uppercase font-black rounded">Approval Required</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pending Course Assignment Notice for newly registered students */}
          {!loading && courses.length === 0 && (
            <div className="mb-6 p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-sm">
                  <FiLock />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-900">
                    Welcome to Wise East University! Awaiting Course Assignment
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 max-w-3xl leading-relaxed">
                    Your student account has been registered successfully. You currently have access to your dashboard. Once an administrator assigns you to your enrolled course(s) from the Admin Panel, all your course modules, lecture notes, assignments, live classes, exams, and grades will unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT SECTION */}
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Rating */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
                  <div className="w-full text-left">
                    <h3 className="font-bold text-[#2D3748]">Your Rating</h3>
                    <p className="text-xs text-[#A0AEC0] mt-1 mb-8">Track your overall academic performance <br /> and progress</p>
                  </div>
                  <div className="relative w-full h-48 flex items-center justify-center mt-4">
                    <div className="absolute z-20 -top-4 left-6 w-24 h-24 rounded-full bg-[#857BE4] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(133,123,228,0.4)] animate-breathe">
                      <span className="text-xl font-bold">{credits}</span>
                      <span className="text-[10px] font-medium opacity-90 tracking-wide mt-0.5">Credits</span>
                    </div>
                    <div className="absolute z-30 top-6 right-4 w-32 h-32 rounded-full bg-[#F39B40] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(243,155,64,0.4)] animate-breathe-delayed">
                      <span className="text-3xl font-bold">{gpa}</span>
                      <span className="text-[11px] font-medium opacity-90 tracking-wide mt-1">Current GPA</span>
                    </div>
                    <div className="absolute z-20 -bottom-6 left-12 w-28 h-28 rounded-full bg-[#42C3DF] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(66,195,223,0.4)] animate-breathe-fast">
                      <span className="text-2xl font-bold">{attendance}%</span>
                      <span className="text-[11px] font-medium opacity-90 tracking-wide mt-0.5">Attendance</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events / Calendar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <h3 className="font-bold text-[#2D3748] mb-4">Upcoming Events</h3>
                  <div className="bg-[#F7FAFC] rounded-lg p-4 mb-4 flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-[#2D3748]">{monthNames[currentMonth]} {currentYear}</span>
                      <div className="flex space-x-2 text-gray-400">
                        <FiChevronLeft className="cursor-pointer hover:text-gray-800 transition" onClick={handlePrevMonth} />
                        <FiChevronRight className="cursor-pointer hover:text-gray-800 transition" onClick={handleNextMonth} />
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
                        return (
                          <div key={day} className={`flex items-center justify-center mx-auto w-7 h-7 transition ${isCurrentDay ? 'bg-[#5A67D8] text-white rounded-full shadow-md font-bold' : 'hover:bg-[#EEF2FF] hover:text-[#5A67D8] cursor-pointer rounded-full'}`}>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[#A0AEC0] text-sm leading-relaxed">
                      {exams.length > 0 ? `${exams.length} upcoming exam(s)` : 'There are no upcoming exams'} <br />
                      {courses.length > 0 ? (
                        <Link href="/calendar" className="text-[#5A67D8] hover:underline inline-block mt-0.5">go to calendar</Link>
                      ) : (
                        <button
                          onClick={() => toast.warning("Section Locked: You must be assigned to a course by an administrator before accessing the timetable calendar.")}
                          className="text-gray-400 hover:text-gray-600 font-medium inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <FiLock className="text-xs text-amber-500" /> Go to Calendar (Locked)
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Grid: My Courses & Live Classes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Courses */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-[#2D3748]">My Courses</h3>
                    {courses.length > 0 ? (
                      <Link href="/courses" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                    ) : (
                      <button
                        onClick={() => toast.warning("Section Locked: You have not been assigned to any courses yet. An administrator must assign you to a course first.")}
                        className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <FiLock className="text-xs text-amber-500" /> View All (Locked)
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    {loading ? (
                      <div className="p-4 text-sm text-gray-400">Loading courses...</div>
                    ) : courses.length === 0 ? (
                      <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                        <FiLock className="text-amber-500 text-sm shrink-0" />
                        No enrolled courses yet. Awaiting admin assignment.
                      </div>
                    ) : (
                      courses.slice(0, 4).map((course) => (
                        <div key={course._id} className="flex justify-between items-center p-4 hover:bg-[#F7FAFC] rounded-lg transition">
                          <div className="flex items-center text-sm font-semibold text-[#4A5568]">
                            <div className="w-8 h-8 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-3">
                              <MdEventNote className="text-lg" />
                            </div>
                            <div className="flex flex-col">
                              <span className="truncate w-40">{course.title}</span>
                              <span className="text-[10px] text-[#A0AEC0] font-medium">{course.instructor}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#5A67D8] rounded-full" style={{ width: `${course.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-[#5A67D8]">{course.progress}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Live / Upcoming Classes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-[#2D3748]">Live & Online Classes</h3>
                    {courses.length > 0 ? (
                      <Link href="/live-classes" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">
                        View All Live Sessions
                      </Link>
                    ) : (
                      <button
                        onClick={() => toast.warning("Section Locked: Live classes will unlock once an administrator assigns your course(s).")}
                        className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <FiLock className="text-xs text-amber-500" /> View All (Locked)
                      </button>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {loading ? (
                      <div className="text-sm text-gray-400">Loading classes...</div>
                    ) : courses.length === 0 || liveClasses.length === 0 ? (
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <FiLock className="text-amber-500 text-sm shrink-0" />
                        No scheduled live classes. Course assignment required.
                      </div>
                    ) : (
                      liveClasses.slice(0, 3).map((lc) => {
                        const isLive = lc.status === 'live';
                        const isEnded = lc.status === 'ended';
                        return (
                          <div key={lc._id} className="flex flex-col pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-[#2D3748]">{lc.title}</span>
                              {isLive && (
                                <span className="flex items-center text-[10px] font-bold text-red-500 uppercase">
                                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                                  Live Now
                                </span>
                              )}
                              {isEnded && (
                                <span className="text-[10px] font-bold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded">
                                  Ended / Recorded
                                </span>
                              )}
                              {!isLive && !isEnded && (
                                <span className="text-[10px] font-bold text-[#5A67D8] uppercase bg-[#EEF2FF] px-2 py-0.5 rounded">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-xs text-[#A0AEC0] font-medium gap-2">
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-[11px]" /> {formatDate(lc.startTime)} &middot; <FiClock className="text-[11px]" /> {formatTime(lc.startTime)} - {formatTime(lc.endTime)}
                              </span>
                              <span className="flex items-center gap-1 text-[#5A67D8] font-bold truncate max-w-[130px]" title={lc.courseId?.title || 'General'}>
                                <FiBookOpen className="text-[11px] shrink-0" /> {lc.courseId?.title || 'General'}
                              </span>
                            </div>
                            
                            <div className="mt-2.5 flex items-center gap-3">
                              {isEnded ? (
                                <Link 
                                  href="/recordings"
                                  className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                                >
                                  <FiVideo className="text-xs" /> Watch Recording & Notes
                                </Link>
                              ) : (
                                <a 
                                  href={lc.meetingLink || "/live-classes"} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
                                >
                                  <FiVideo className="text-xs" /> Join Live Classroom
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="space-y-6">
              {/* Upcoming Assignments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Upcoming Assignments</h3>
                  {courses.length > 0 ? (
                    <Link href="/assignments" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                  ) : (
                    <button
                      onClick={() => toast.warning("Section Locked: Course assignments will unlock once an administrator assigns your course(s).")}
                      className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <FiLock className="text-xs text-amber-500" /> View All (Locked)
                    </button>
                  )}
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading assignments...</div>
                  ) : courses.length === 0 || assignments.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                      <FiLock className="text-amber-500 text-sm shrink-0" />
                      No upcoming assignments. Course assignment required.
                    </div>
                  ) : (
                    <>
                      {assignments.map((a) => {
                        const overdue = isOverdue(a.dueDate);
                        return (
                          <Link 
                            key={a._id} 
                            href={`/assignments?briefId=${a._id}`}
                            className={`flex items-center justify-between p-3.5 hover:bg-[#EEF2FF]/60 rounded-xl transition ${overdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex flex-col">
                              <div className={`flex items-center text-xs font-bold ${overdue ? 'text-red-600' : 'text-[#2D3748]'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2.5 flex-shrink-0 ${overdue ? 'bg-red-500' : 'bg-[#5A67D8]'}`} />
                                <span className="truncate max-w-[170px]">{a.title}</span>
                              </div>
                              <span className={`text-[11px] ml-4 mt-0.5 ${overdue ? 'text-red-400 font-semibold' : 'text-[#A0AEC0]'}`}>
                                {overdue ? 'Overdue' : daysUntil(a.dueDate)} ({formatDate(a.dueDate)})
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#5A67D8] bg-white border border-indigo-100 px-2 py-1 rounded-lg shadow-sm">
                              Brief &rarr;
                            </span>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Recent Course Materials & Notes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Lecture Notes & Materials</h3>
                  {courses.length > 0 ? (
                    <Link href="/courses" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View in Courses</Link>
                  ) : (
                    <button
                      onClick={() => toast.warning("Section Locked: Lecture Notes & Materials are locked until an administrator assigns you to your enrolled courses.")}
                      className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <FiLock className="text-xs text-amber-500" /> View in Courses (Locked)
                    </button>
                  )}
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading materials...</div>
                  ) : courses.length === 0 || materials.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                      <FiLock className="text-amber-500 text-sm shrink-0" />
                      No lecture materials available. Course assignment required.
                    </div>
                  ) : (
                    materials.slice(0, 4).map((mat) => (
                      <a
                        key={mat._id}
                        href={`/api/materials/${mat._id}/file?action=view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 hover:bg-[#EEF2FF]/60 rounded-xl transition group"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center text-xs font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition">
                            <span className="w-2 h-2 rounded-full mr-2.5 flex-shrink-0 bg-emerald-500" />
                            <span className="truncate max-w-[170px]">{mat.title}</span>
                          </div>
                          <span className="text-[11px] text-[#A0AEC0] ml-4 mt-0.5 truncate">
                            {mat.courseId?.title || "Course Material"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#5A67D8] bg-white border border-indigo-100 px-2 py-1 rounded-lg shadow-sm flex-shrink-0">
                          View &rarr;
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Upcoming Exams</h3>
                  {courses.length > 0 ? (
                    <Link href="/calendar" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                  ) : (
                    <button
                      onClick={() => toast.warning("Section Locked: Exam timetable will unlock once an administrator assigns your course(s).")}
                      className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <FiLock className="text-xs text-amber-500" /> View All (Locked)
                    </button>
                  )}
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading exams...</div>
                  ) : courses.length === 0 || exams.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                      <FiLock className="text-amber-500 text-sm shrink-0" />
                      No upcoming exams. Course assignment required.
                    </div>
                  ) : (
                    exams.slice(0, 5).map((exam) => (
                      <div key={exam._id} className="flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm font-semibold text-[#2D3748]">
                            <span className="w-2 h-2 rounded-full bg-[#5A67D8] mr-3" />
                            {exam.title}
                          </div>
                          <span className="text-xs text-[#A0AEC0] ml-5 mt-0.5">
                            {daysUntil(exam.date)} &middot; {formatDate(exam.date)} &middot; {exam.duration} min &middot; {exam.location}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Announcements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Announcements</h3>
                  {courses.length > 0 ? (
                    <Link href="/courses" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition cursor-pointer">
                      View in Courses
                    </Link>
                  ) : (
                    <button
                      onClick={() => toast.warning("Section Locked: Announcements will unlock once an administrator assigns your course(s).")}
                      className="text-xs font-semibold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <FiLock className="text-xs text-amber-500" /> View All (Locked)
                    </button>
                  )}
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading announcements...</div>
                  ) : courses.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                      <FiLock className="text-amber-500 text-sm shrink-0" />
                      No announcements available. Course assignment required.
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                      <FiBell className="text-gray-300 text-sm shrink-0" />
                      No recent announcements posted for your courses.
                    </div>
                  ) : (
                    announcements.slice(0, 5).map((anc) => (
                      <div key={anc._id} className="flex items-start p-3.5 hover:bg-[#F7FAFC] rounded-xl transition group">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#5A67D8] flex items-center justify-center mr-3.5 flex-shrink-0 mt-0.5 shadow-xs">
                          <FiBell className="text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition line-clamp-2 leading-snug">
                            {anc.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A0AEC0] font-medium flex-wrap">
                            <span className="text-[#5A67D8] font-bold truncate max-w-[140px]">
                              {anc.courseId?.title || "Course"}
                            </span>
                            <span>&bull;</span>
                            <span>{timeAgo(anc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Approval Required Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100 relative">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <FiX className="text-lg" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold mb-4">
              <FiLock />
            </div>

            <h3 className="text-base font-black text-gray-900">Admin Approval Required</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              The <strong>Download Report</strong> feature is locked by policy and can only be clicked and generated with official administrator approval.
            </p>

            <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
              <FiAlertCircle className="text-base shrink-0 mt-0.5 text-amber-700" />
              <span>Once an administrator reviews and approves your report access from the Admin Panel, you will be able to download and export your official academic transcript.</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                disabled={requestingApproval || approvalRequested}
                onClick={async () => {
                  setRequestingApproval(true);
                  try {
                    const res = await fetch('/api/student/request-report-approval', { method: 'POST' });
                    if (res.ok) {
                      setApprovalRequested(true);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setRequestingApproval(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {approvalRequested ? (
                  <>
                    <FiCheckCircle /> Request Sent to Admin
                  </>
                ) : requestingApproval ? (
                  "Submitting..."
                ) : (
                  "Request Admin Approval"
                )}
              </button>

              <button
                onClick={() => setShowApprovalModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
