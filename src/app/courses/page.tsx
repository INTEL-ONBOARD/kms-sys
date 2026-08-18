"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FiSearch, 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight, 
  FiRefreshCw, 
  FiBook, 
  FiUser, 
  FiX, 
  FiCheckCircle, 
  FiClock, 
  FiCalendar, 
  FiBarChart2, 
  FiArrowRight,
  FiLayers,
  FiBookOpen,
  FiVideo,
  FiAward,
  FiInfo,
  FiFolder,
  FiCheckSquare,
  FiExternalLink
} from 'react-icons/fi';
import { MdOutlineAssignment, MdOutlineMenuBook } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

interface ModuleTopic {
  moduleNumber: string;
  title: string;
  description: string;
  lessonsCount: number;
  duration: string;
  status: string;
  topics: string[];
}

interface CourseAssignment {
  _id: string;
  title: string;
  category: string;
  dueDate: string;
  maxPoints: number;
  status: string;
}

interface CourseLiveClass {
  _id: string;
  title: string;
  startTime: string;
  date: string;
  meetingLink: string;
  status: string;
}

interface Course {
  _id: string;
  title: string;
  code?: string;
  category?: string;
  instructor?: string;
  progress?: number;
  description?: string;
  status?: string;
  price?: string;
  credits?: number;
  semester?: string;
  enrolledAt?: string;
  modules?: ModuleTopic[];
  assignments?: CourseAssignment[];
  assignmentCount?: number;
  liveClasses?: CourseLiveClass[];
  liveClassCount?: number;
  announcements?: { _id: string; message: string; createdAt: string }[];
  announcementCount?: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  
  // Selected course for detailed module view
  const [selectedCourse, setSelectedCourse] = useState<{ course: Course; index: number } | null>(null);
  const [activeCourseTab, setActiveCourseTab] = useState<'about' | 'modules' | 'assignments' | 'classes'>('about');
  const [expandedModule, setExpandedModule] = useState<string | null>("01");

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/student/my-courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter and Sort courses dynamically
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // 1. Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.instructor && c.instructor.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter === 'Active') {
      result = result.filter((c) => (c.progress ?? 0) < 100);
    } else if (statusFilter === 'Completed') {
      result = result.filter((c) => (c.progress ?? 0) >= 100);
    }

    // 3. Sorting
    if (sortBy === 'Newest') {
      // default array order
    } else if (sortBy === 'Oldest') {
      result.reverse();
    } else if (sortBy === 'A-Z') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'Progress') {
      result.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    }

    return result;
  }, [courses, searchQuery, statusFilter, sortBy]);

  const getBannerStyle = (index: number, title: string) => {
    const styles = [
      { bg: "bg-[#4AA59C]", text: <div className="text-center font-black text-xl md:text-2xl leading-tight text-white uppercase tracking-wider">{title}</div> },
      { bg: "bg-[#3B5446]", text: <div className="text-center text-white font-serif italic text-lg md:text-xl"><span className="font-sans font-bold not-italic text-xl md:text-2xl block mb-1">Learn</span>{title}</div> },
      { bg: "bg-[#71A5E8]", text: <div className="text-center font-black text-xl md:text-3xl text-[#F9D658] uppercase tracking-wide">{title}</div> },
      { bg: "bg-[#F3EBE0]", text: <div className="text-center font-serif text-2xl md:text-4xl text-[#3A453C] tracking-tight">{title}</div> },
      { bg: "bg-[#111111]", text: <div className="text-center font-bold text-xl md:text-2xl text-white font-sans">{title}</div> },
      { bg: "bg-white border-b border-gray-200", text: <div className="text-center"><div className="font-serif italic text-xs md:text-sm text-gray-500 mb-1">Course Module</div><div className="font-black text-xl md:text-3xl text-black tracking-tighter uppercase">{title}</div></div> },
      { bg: "bg-[#E61F5B]", text: <div className="text-center"><div className="font-black text-xl md:text-3xl text-[#F9D658] uppercase shadow-sm tracking-widest">{title}</div></div> },
      { bg: "bg-[#F9F9FB] border-b border-gray-200", text: <div className="text-center font-serif tracking-[0.2em] text-[#3A3F58] font-bold text-lg md:text-2xl uppercase">{title}</div> },
      { bg: "bg-[#FCF5EB]", text: <div className="text-center font-black text-lg md:text-2xl text-[#CE662B] uppercase"><span className="text-[#344F89] font-serif italic normal-case text-md md:text-xl block mb-1">Enrolled</span>{title}</div> }
    ];
    return styles[index % styles.length];
  };

  const handleOpenCourse = (course: Course, index: number) => {
    setSelectedCourse({ course, index });
    setActiveCourseTab('about');
    setExpandedModule("01");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* COURSES SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Section Title */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">
                  Enrolled Courses & Modules
                </h1>
                <span className="bg-[#EEF2FF] text-[#5A67D8] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {courses.length} Enrolled
                </span>
              </div>
              <p className="text-sm text-[#A0AEC0] mt-1">
                Explore course details, curriculum syllabus, module lessons, assignments, and schedule
              </p>
            </div>

            <button
              onClick={fetchCourses}
              title="Refresh courses"
              className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-[#5A67D8] hover:text-[#5A67D8] rounded-xl shadow-sm transition"
            >
              <FiRefreshCw className={`text-sm ${isLoading ? "animate-spin text-[#5A67D8]" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-[400px]">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                type="text" 
                placeholder="Search courses, instructors, or topics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-100 shadow-sm text-xs text-gray-700 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8] transition"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              
              {/* Status Filter */}
              <div className="relative flex-1 md:flex-none">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-auto appearance-none bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer hover:bg-gray-50 transition min-w-[130px]"
                >
                  <option value="All">All Courses</option>
                  <option value="Active">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative flex-1 md:flex-none">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-auto appearance-none bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer hover:bg-gray-50 transition min-w-[140px]"
                >
                  <option value="Newest">Sort: Newest</option>
                  <option value="Oldest">Sort: Oldest</option>
                  <option value="A-Z">Sort: A - Z</option>
                  <option value="Progress">Sort: Progress</option>
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

            </div>

          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72 animate-pulse flex flex-col justify-between p-4">
                  <div className="h-32 bg-gray-200 rounded-xl w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center mx-auto mb-4 text-2xl">
                <FiBook />
              </div>
              <h3 className="text-base font-bold text-gray-700">No Courses Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? `No enrolled courses match "${searchQuery}".` : "You are not currently enrolled in any courses."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs font-bold text-[#5A67D8] hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Courses Card Grid */}
          {!isLoading && filteredAndSortedCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCourses.map((course, index) => {
                const bannerDesign = getBannerStyle(index, course.title);
                const progress = course.progress ?? 0;

                return (
                  <div 
                    key={course._id} 
                    onClick={() => handleOpenCourse(course, index)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group flex flex-col h-80 cursor-pointer relative"
                  >
                    {/* Course Banner */}
                    <div className={`h-36 ${bannerDesign.bg} flex flex-col justify-center items-center p-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}>
                      {bannerDesign.text}
                      
                      {/* Click overlay pill hint */}
                      <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <FiLayers /> View Modules & Syllabus
                      </span>
                    </div>
                    
                    {/* Course Details */}
                    <div className="p-5 bg-white border-t border-gray-50 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#5A67D8] uppercase tracking-wider bg-[#EEF2FF] px-2 py-0.5 rounded">
                            {course.category || 'General'}
                          </span>
                          <span className="text-[10px] font-semibold text-[#A0AEC0] uppercase tracking-widest">
                            {course.code || `WISE-${course._id.substring(0, 4).toUpperCase()}`}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#2D3748] leading-snug group-hover:text-[#5A67D8] transition truncate" title={course.title}>
                          {course.title}
                        </h3>
                        {course.instructor && (
                          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 truncate">
                            <FiUser className="text-[10px]" /> {course.instructor}
                          </p>
                        )}
                      </div>

                      {/* Summary Metrics & Progress */}
                      <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                          <span className="flex items-center gap-1 text-[#5A67D8]">
                            <FiBookOpen className="text-xs" /> 4 Modules
                          </span>
                          <span className="flex items-center gap-1 text-orange-500">
                            <MdOutlineAssignment className="text-xs" /> {course.assignmentCount || 0} Tasks
                          </span>
                          <span className="font-bold text-gray-700">{progress}%</span>
                        </div>

                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#5A67D8] rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredAndSortedCourses.length > 0 && (
            <div className="flex justify-between items-center mt-8 text-xs font-medium text-[#A0AEC0]">
              <span>Showing {filteredAndSortedCourses.length} of {courses.length} courses</span>
              <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                <button className="p-1 hover:text-[#5A67D8] transition"><FiChevronLeft className="text-base" /></button>
                <span className="text-[#5A67D8] font-bold px-2 py-0.5 bg-[#EEF2FF] rounded">1</span>
                <button className="p-1 hover:text-[#5A67D8] transition"><FiChevronRight className="text-base" /></button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* COMPREHENSIVE COURSE & MODULES MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 transform transition-all">
            
            {/* Modal Banner Header */}
            <div className={`relative ${getBannerStyle(selectedCourse.index, selectedCourse.course.title).bg} p-6 md:p-8 text-center flex flex-col items-center justify-center min-h-[140px]`}>
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition backdrop-blur-sm"
              >
                <FiX className="text-lg" />
              </button>

              <div className="scale-105">
                {getBannerStyle(selectedCourse.index, selectedCourse.course.title).text}
              </div>
            </div>

            {/* Course Navigation Ribbon */}
            <div className="flex border-b border-gray-100 px-6 bg-[#F7FAFC] text-xs font-bold text-gray-500 overflow-x-auto">
              <button
                onClick={() => setActiveCourseTab('about')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCourseTab === 'about'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                <FiInfo /> About & Overview
              </button>

              <button
                onClick={() => setActiveCourseTab('modules')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCourseTab === 'modules'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                <FiLayers /> Modules & Syllabus (4)
              </button>

              <button
                onClick={() => setActiveCourseTab('assignments')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCourseTab === 'assignments'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                <MdOutlineAssignment /> Coursework Briefs ({selectedCourse.course.assignmentCount || 0})
              </button>

              <button
                onClick={() => setActiveCourseTab('classes')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCourseTab === 'classes'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                <FiVideo /> Live Lectures ({selectedCourse.course.liveClassCount || 0})
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* 1. ABOUT & OVERVIEW TAB */}
              {activeCourseTab === 'about' && (
                <div className="space-y-6">
                  {/* Badges & Meta Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                      <p className="text-[#A0AEC0] font-semibold text-[11px]">Module Code</p>
                      <p className="font-bold text-[#2D3748] mt-0.5">
                        {selectedCourse.course.code || `WISE-${selectedCourse.course._id.substring(0, 4).toUpperCase()}`}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                      <p className="text-[#A0AEC0] font-semibold text-[11px]">Academic Credits</p>
                      <p className="font-bold text-[#5A67D8] mt-0.5">{selectedCourse.course.credits || 4} Credits</p>
                    </div>
                    <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                      <p className="text-[#A0AEC0] font-semibold text-[11px]">Module Lead</p>
                      <p className="font-bold text-[#2D3748] mt-0.5 truncate">{selectedCourse.course.instructor || 'Faculty Lead'}</p>
                    </div>
                    <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                      <p className="text-[#A0AEC0] font-semibold text-[11px]">Semester / Level</p>
                      <p className="font-bold text-[#2D3748] mt-0.5">{selectedCourse.course.semester || 'Semester 01'}</p>
                    </div>
                  </div>

                  {/* Course Description */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                      About this Course
                    </h4>
                    <p className="text-gray-600 bg-gray-50 border border-gray-100 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap">
                      {selectedCourse.course.description}
                    </p>
                  </div>

                  {/* Progress Overview Card */}
                  <div className="bg-[#F7FAFC] p-5 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="text-[#5A67D8] text-lg" />
                        <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">
                          Overall Course Progress
                        </h4>
                      </div>
                      <span className="text-base font-extrabold text-[#5A67D8]">
                        {selectedCourse.course.progress ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5A67D8] rounded-full transition-all duration-700" 
                        style={{ width: `${Math.min(100, Math.max(0, selectedCourse.course.progress ?? 0))}%` }} 
                      />
                    </div>
                    <p className="text-[11px] text-[#A0AEC0]">
                      {selectedCourse.course.progress === 100 
                        ? "Congratulations! You have completed all course requirements."
                        : "Complete assignments, exams, and attendance requirements to advance your course progress."}
                    </p>
                  </div>

                  {/* Quick Action Workspace Cards */}
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider mb-3">
                      Course Workspace & Direct Links
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Link 
                        href="/assignments"
                        className="p-4 bg-white border border-gray-200 hover:border-[#5A67D8] hover:shadow-md rounded-2xl transition group flex flex-col justify-between"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ED8936] flex items-center justify-center text-lg mb-2">
                          <MdOutlineAssignment />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition">Assignments</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Submit & view briefs</p>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-[#5A67D8] mt-2 gap-1">
                          Open <FiArrowRight />
                        </div>
                      </Link>

                      <Link 
                        href="/calendar"
                        className="p-4 bg-white border border-gray-200 hover:border-[#5A67D8] hover:shadow-md rounded-2xl transition group flex flex-col justify-between"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3182CE] flex items-center justify-center text-lg mb-2">
                          <FiCalendar />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition">Class Schedule</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Exams & live lectures</p>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-[#5A67D8] mt-2 gap-1">
                          Open <FiArrowRight />
                        </div>
                      </Link>

                      <Link 
                        href="/grades"
                        className="p-4 bg-white border border-gray-200 hover:border-[#5A67D8] hover:shadow-md rounded-2xl transition group flex flex-col justify-between"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-lg mb-2">
                          <FiBarChart2 />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition">Grade Report</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Scores & GPA standing</p>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-[#5A67D8] mt-2 gap-1">
                          Open <FiArrowRight />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MODULES & SYLLABUS TAB */}
              {activeCourseTab === 'modules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                      Course Curriculum & Module Breakdown
                    </h4>
                    <span className="text-[11px] text-gray-400 font-semibold">4 Structured Modules</span>
                  </div>

                  <div className="space-y-3">
                    {(selectedCourse.course.modules || []).map((mod) => {
                      const isExpanded = expandedModule === mod.moduleNumber;
                      return (
                        <div 
                          key={mod.moduleNumber}
                          className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition hover:border-indigo-100"
                        >
                          <div 
                            onClick={() => setExpandedModule(isExpanded ? null : mod.moduleNumber)}
                            className="p-4 bg-white hover:bg-gray-50 flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#5A67D8] font-black flex items-center justify-center text-xs">
                                {mod.moduleNumber}
                              </div>
                              <div>
                                <h5 className="font-bold text-[#111827] text-xs md:text-sm">{mod.title}</h5>
                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3">
                                  <span>{mod.lessonsCount} Lessons</span>
                                  <span>&bull;</span>
                                  <span>{mod.duration}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                mod.status === 'Completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : mod.status === 'In Progress' 
                                  ? 'bg-indigo-100 text-[#5A67D8]' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {mod.status}
                              </span>
                              <FiChevronDown className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 bg-[#F7FAFC] border-t border-gray-100 space-y-3">
                              <p className="text-gray-600 leading-relaxed text-xs">{mod.description}</p>
                              <div>
                                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                                  Topics & Lessons Covered:
                                </p>
                                <ul className="space-y-1.5">
                                  {mod.topics.map((t, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                                      <FiCheckCircle className="text-[#5A67D8] flex-shrink-0" />
                                      <span>{t}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. ASSIGNMENTS TAB */}
              {activeCourseTab === 'assignments' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                    Coursework & Assessment Briefs
                  </h4>

                  {(selectedCourse.course.assignments || []).length === 0 ? (
                    <div className="text-center py-10 bg-[#F7FAFC] rounded-2xl border border-gray-100 text-gray-400">
                      <MdOutlineAssignment className="text-3xl mx-auto mb-2 text-gray-300" />
                      No assignments published for this course yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedCourse.course.assignments || []).map((a) => (
                        <div 
                          key={a._id}
                          className="p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-[#5A67D8] bg-white px-2 py-0.5 rounded uppercase border border-gray-100">
                                {a.category}
                              </span>
                              <span className="text-xs font-semibold text-gray-400">
                                {a.maxPoints} Points
                              </span>
                            </div>
                            <h5 className="font-bold text-[#111827] text-xs md:text-sm">{a.title}</h5>
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <FiClock className="text-[10px]" /> Due: {a.dueDate}
                            </p>
                          </div>

                          <Link
                            href={`/assignments?briefId=${a._id}`}
                            className="px-4 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#434190] transition flex items-center gap-1 flex-shrink-0"
                          >
                            <FiBookOpen /> View Brief
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. LIVE LECTURES TAB */}
              {activeCourseTab === 'classes' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                    Scheduled Lectures & Live Sessions
                  </h4>

                  {(selectedCourse.course.liveClasses || []).length === 0 ? (
                    <div className="text-center py-10 bg-[#F7FAFC] rounded-2xl border border-gray-100 text-gray-400">
                      <FiVideo className="text-3xl mx-auto mb-2 text-gray-300" />
                      No live sessions scheduled for this course at the moment.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedCourse.course.liveClasses || []).map((lc) => (
                        <div 
                          key={lc._id}
                          className="p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">
                                {lc.status}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">
                                {lc.date}
                              </span>
                            </div>
                            <h5 className="font-bold text-[#111827] text-xs md:text-sm">{lc.title}</h5>
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <FiClock className="text-[10px]" /> Starts at: {lc.startTime}
                            </p>
                          </div>

                          {lc.meetingLink && (
                            <a
                              href={lc.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1 flex-shrink-0"
                            >
                              <FiVideo /> Join Session
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#F7FAFC] flex justify-between items-center">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition"
              >
                Close
              </button>
              <Link
                href="/student"
                className="px-6 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                Back to Dashboard
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}