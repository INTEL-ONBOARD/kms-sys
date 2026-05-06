"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiBell, FiFileText, FiChevronLeft, FiChevronRight, FiVideo, FiBookOpen, FiClock } from 'react-icons/fi';
import { MdEventNote } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

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

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/student/dashboard');
        if (res.ok) {
          const data = await res.json();
          setCourses(
            data.enrollments.map((e: any) => ({
              _id: e.courseId?._id || e._id,
              title: e.courseId?.title || 'Untitled Course',
              instructor: e.courseId?.instructor || 'Unknown',
              progress: e.progress || 0,
            }))
          );
          setAssignments(data.assignments || []);
          setExams(data.exams || []);
          setLiveClasses(data.liveClasses || []);
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Dashboard</h1>
          </div>

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
                      <span className="text-xl font-bold">42</span>
                      <span className="text-[10px] font-medium opacity-90 tracking-wide mt-0.5">Credits</span>
                    </div>
                    <div className="absolute z-30 top-6 right-4 w-32 h-32 rounded-full bg-[#F39B40] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(243,155,64,0.4)] animate-breathe-delayed">
                      <span className="text-3xl font-bold">3.8</span>
                      <span className="text-[11px] font-medium opacity-90 tracking-wide mt-1">Current GPA</span>
                    </div>
                    <div className="absolute z-20 -bottom-6 left-12 w-28 h-28 rounded-full bg-[#42C3DF] flex flex-col items-center justify-center text-white shadow-[6px_6px_20px_rgba(66,195,223,0.4)] animate-breathe-fast">
                      <span className="text-2xl font-bold">92%</span>
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
                      <Link href="/calendar" className="text-[#5A67D8] hover:underline inline-block mt-0.5">go to calendar</Link>
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
                    <Link href="/courses" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                  </div>
                  <div className="p-2">
                    {loading ? (
                      <div className="p-4 text-sm text-gray-400">Loading courses...</div>
                    ) : courses.length === 0 ? (
                      <div className="p-4 text-sm text-gray-400">No enrolled courses yet.</div>
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
                    <h3 className="font-bold text-[#2D3748]">Live Classes</h3>
                    <span className="text-xs font-medium text-[#A0AEC0]">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    {loading ? (
                      <div className="text-sm text-gray-400">Loading classes...</div>
                    ) : liveClasses.length === 0 ? (
                      <div className="text-sm text-gray-400">No upcoming live classes.</div>
                    ) : (
                      liveClasses.slice(0, 3).map((lc) => (
                        <div key={lc._id} className="flex flex-col pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-[#2D3748]">{lc.title}</span>
                            {lc.status === 'live' && (
                              <span className="flex items-center text-[10px] font-bold text-red-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                                Live
                              </span>
                            )}
                            {lc.status === 'upcoming' && (
                              <span className="text-[10px] font-bold text-[#5A67D8] uppercase bg-[#EEF2FF] px-2 py-0.5 rounded">Upcoming</span>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-[#A0AEC0] font-medium">
                            <span className="flex items-center gap-1"><FiClock className="text-xs" /> {formatTime(lc.startTime)} - {formatTime(lc.endTime)}</span>
                            <span className="flex items-center gap-1"><FiBookOpen className="text-xs" /> {lc.courseId?.title || 'General'}</span>
                          </div>
                          {lc.meetingLink && (
                            <a href={lc.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-semibold text-[#5A67D8] hover:underline flex items-center gap-1">
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
              {/* Upcoming Assignments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Upcoming Assignments</h3>
                  <Link href="/assignments" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400">No upcoming assignments.</div>
                  ) : (
                    <>
                      {assignments.map((a) => {
                        const overdue = isOverdue(a.dueDate);
                        return (
                          <div key={a._id} className={`flex items-center justify-between p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition ${overdue ? 'bg-red-50' : ''}`}>
                            <div className="flex flex-col">
                              <div className={`flex items-center text-sm font-semibold ${overdue ? 'text-red-600' : 'text-[#2D3748]'}`}>
                                <span className={`w-2 h-2 rounded-full mr-3 ${overdue ? 'bg-red-500' : 'bg-[#ED8936]'}`} />
                                {a.title}
                              </div>
                              <span className={`text-xs ml-5 mt-0.5 ${overdue ? 'text-red-400' : 'text-[#A0AEC0]'}`}>
                                {overdue ? 'Overdue' : daysUntil(a.dueDate)} ({formatDate(a.dueDate)})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-[#2D3748]">Upcoming Exams</h3>
                  <Link href="/calendar" className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">View All</Link>
                </div>
                <div className="flex flex-col p-2">
                  {loading ? (
                    <div className="p-4 text-sm text-gray-400">Loading exams...</div>
                  ) : exams.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400">No upcoming exams.</div>
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
                  <span className="text-xs font-semibold text-[#5A67D8] border border-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-50 transition cursor-pointer">View All</span>
                </div>
                <div className="flex flex-col p-2">
                  <div className="flex items-start p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                    <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                      <FiBell className="text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2D3748]">Batch event update</h4>
                      <p className="text-xs font-medium text-[#A0AEC0] mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start p-4 hover:bg-[#F7FAFC] rounded-lg cursor-pointer transition">
                    <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#5A67D8] flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                      <FiFileText className="text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2D3748]">Exam Schedule Posted</h4>
                      <p className="text-xs font-medium text-[#A0AEC0] mt-1">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
