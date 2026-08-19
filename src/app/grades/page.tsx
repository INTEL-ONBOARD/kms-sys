"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  FiChevronDown, 
  FiDownload, 
  FiFileText, 
  FiCheckCircle, 
  FiX, 
  FiRefreshCw, 
  FiBookOpen,
  FiAward,
  FiClock,
  FiSearch,
  FiLayers,
  FiCheckSquare,
  FiUser,
  FiTrendingUp,
  FiGrid,
  FiList,
  FiLock,
  FiAlertCircle
} from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';
import { generateCSVReport, downloadFile, triggerPDFPrint, StudentReportData } from '@/lib/reportGenerator';

interface CourseGrade {
  id: string | number;
  courseId?: string;
  title: string;
  code: string;
  assignments: string;
  courseWork: string;
  finalExam: string;
  attendance: string;
  grade: string;
  gradeColor: string;
  semester: string;
  instructor?: string;
  totalPoints?: number | null;
  totalEarnedPoints?: number;
  allAssessmentsCompleted?: boolean;
  publishedCount?: number;
  totalAssessmentCount?: number;
  hasPublishedResults?: boolean;
  gradedCount?: number;
  assessmentItems?: Array<{
    name: string;
    type: string;
    weight: number;
    score: string;
    earned: number;
    isPublished?: boolean;
    status?: string;
  }>;
  gradingBreakdown?: {
    assignmentsWeight: number;
    courseWorkWeight: number;
    finalExamWeight: number;
    attendanceWeight: number;
  };
}

export default function GradesPage() {
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Dynamic API state
  const [loading, setLoading] = useState(true);
  const [reportApproved, setReportApproved] = useState(false);
  const [gradesData, setGradesData] = useState<CourseGrade[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [studentInfo, setStudentInfo] = useState<{
    studentName: string;
    studentId: string;
    gpa: string;
    cgpa: string;
  }>({
    studentName: "Authenticated Student",
    studentId: "",
    gpa: "0.0",
    cgpa: "0.0",
  });

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/reports');
      if (res.ok) {
        const data = await res.json();
        setGradesData(data.allGrades || data.grades || []);
        setAvailableSemesters(data.availableSemesters || ["Semester 01", "Semester 02"]);
        setAvailableCourses(data.availableCourses || []);
        setReportApproved(!!data.reportApproved);
        setStudentInfo({
          studentName: data.studentName || "Student",
          studentId: data.studentId || "",
          gpa: data.gpa || "0.0",
          cgpa: data.cgpa || "0.0",
        });
      }
    } catch (err) {
      console.error("Failed to load grades data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  // Filter grades based on Semester, Course, Active Tab, and Search Query
  const filteredGrades = useMemo(() => {
    return gradesData.filter((item) => {
      const matchesSemester = selectedSemester === 'All' || selectedSemester === 'Select' || item.semester === selectedSemester;
      const matchesCourse = selectedCourse === 'All' || selectedCourse === 'All Courses' || item.title === selectedCourse || item.title.includes(selectedCourse);
      const matchesTab = 
        activeTab === 'all' 
          ? true 
          : activeTab === 'completed' 
          ? item.allAssessmentsCompleted 
          : !item.allAssessmentsCompleted;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.instructor && item.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSemester && matchesCourse && matchesTab && matchesSearch;
    });
  }, [gradesData, selectedSemester, selectedCourse, activeTab, searchQuery]);

  // Compute dynamic stats
  const completedCount = useMemo(() => gradesData.filter(g => g.allAssessmentsCompleted).length, [gradesData]);
  const publishedTasksCount = useMemo(() => gradesData.reduce((sum, g) => sum + (g.publishedCount || 0), 0), [gradesData]);

  // Compute filtered GPA dynamically if filtered
  const displayGPA = useMemo(() => {
    const completedCourses = filteredGrades.filter(g => g.allAssessmentsCompleted && typeof g.totalPoints === 'number');
    if (completedCourses.length === 0) return studentInfo.gpa || "0.0";
    const gradePointMap: Record<string, number> = {
      'A': 4.0,
      'A -': 3.7,
      'B +': 3.3,
      'B': 3.0,
      'B -': 2.7,
      'C +': 2.3,
      'C': 2.0,
      'D': 1.0,
      'F': 0.0,
    };
    const totalPts = completedCourses.reduce((sum, g) => sum + (gradePointMap[g.grade] ?? 0.0), 0);
    return (totalPts / completedCourses.length).toFixed(1);
  }, [filteredGrades, studentInfo.gpa]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getReportPayload = (): StudentReportData => {
    return {
      studentName: studentInfo.studentName,
      studentId: studentInfo.studentId,
      semester: selectedSemester === 'All' || selectedSemester === 'Select' ? 'All Semesters' : selectedSemester,
      gpa: displayGPA,
      cgpa: studentInfo.cgpa,
      grades: filteredGrades.map(g => ({
        id: g.id,
        title: g.title,
        code: g.code,
        assignments: g.assignments,
        courseWork: g.courseWork,
        finalExam: g.finalExam,
        attendance: g.attendance,
        grade: g.grade,
        semester: g.semester,
      })),
    };
  };

  const handleDownloadCSV = () => {
    const payload = getReportPayload();
    const csvContent = generateCSVReport(payload);
    downloadFile(csvContent, `Wise_East_Grade_Report_${Date.now()}.csv`);
    setShowDownloadModal(false);
    showToast("Grade report exported as CSV successfully!");
  };

  const handleDownloadPDF = () => {
    const payload = getReportPayload();
    triggerPDFPrint(payload);
    setShowDownloadModal(false);
    showToast("Official PDF transcript preview opened!");
  };

  // Helper for component category badges
  const getCategoryMeta = (type: string) => {
    switch (type) {
      case "assignment":
        return { label: "Assignment", bg: "bg-blue-50 text-blue-700 border-blue-100" };
      case "exam":
        return { label: "Final Exam", bg: "bg-purple-50 text-purple-700 border-purple-100" };
      case "coursework":
        return { label: "Coursework", bg: "bg-amber-50 text-amber-700 border-amber-100" };
      case "quiz":
        return { label: "Quiz", bg: "bg-indigo-50 text-indigo-700 border-indigo-100" };
      case "project":
        return { label: "Project", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "attendance":
        return { label: "Attendance", bg: "bg-teal-50 text-teal-700 border-teal-100" };
      default:
        return { label: "Assessment", bg: "bg-gray-50 text-gray-700 border-gray-100" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-800 relative">
      
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Dash Header */}
        <Header />

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-16 pt-6 space-y-6">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="flex items-center justify-between bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-lg transition-all animate-in fade-in">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="text-xl" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80">
                <FiX className="text-lg" />
              </button>
            </div>
          )}

          {/* Top Page Header Banner */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100/60">
                  Academic Performance
                </span>
                <span className="text-xs text-gray-400 font-semibold">
                  Official Student Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                Course Grades & Academic Performance
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                View lecturer-allocated assessment breakdowns, verified continuous coursework marks, and official final grades.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <button
                onClick={fetchGrades}
                title="Refresh Grades"
                className="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl transition cursor-pointer"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>

              <button
                id="download-report-btn"
                onClick={() => {
                  if (reportApproved) {
                    setShowDownloadModal(true);
                  } else {
                    setShowApprovalModal(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer ${
                  reportApproved
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
                title={reportApproved ? "Export Academic Report" : "Admin Approval Required to Export Report"}
              >
                {reportApproved ? (
                  <>
                    <FiDownload className="text-sm" />
                    <span>Export Report</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-[9px] uppercase font-black rounded text-white">Approved</span>
                  </>
                ) : (
                  <>
                    <FiLock className="text-sm text-amber-700" />
                    <span>Export Report</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] uppercase font-black rounded">Approval Required</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Academic Metrics Grid (4 Key Performance Indicators) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CGPA */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:border-gray-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Cumulative GPA</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">{studentInfo.cgpa}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  CGPA
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>Academic Status:</span>
                <span className="font-bold text-emerald-600">Good Standing</span>
              </div>
            </div>

            {/* Semester GPA */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:border-gray-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Semester GPA</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">{displayGPA}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <FiAward className="text-base" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>Filter Scope:</span>
                <span className="font-semibold text-gray-600 truncate max-w-[120px]">
                  {selectedSemester === 'All' ? 'All Semesters' : selectedSemester}
                </span>
              </div>
            </div>

            {/* Completed Course Modules */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:border-gray-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Modules Completed</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">
                    {completedCount} <span className="text-lg text-gray-400 font-semibold">/ {gradesData.length}</span>
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  <FiBookOpen className="text-base" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>Completed:</span>
                <span className="font-semibold text-gray-600">{Math.round((completedCount / Math.max(1, gradesData.length)) * 100)}% Finished</span>
              </div>
            </div>

            {/* Published Tasks */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:border-gray-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Published Tasks</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">{publishedTasksCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  <FiCheckSquare className="text-base" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>Evaluation:</span>
                <span className="font-semibold text-amber-600">Lecturer Verified</span>
              </div>
            </div>

          </div>

          {/* Filter, Search & View Controls Bar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === 'all'
                    ? "bg-[#1E293B] text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Modules ({gradesData.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === 'completed'
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Finalized ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('in_progress')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === 'in_progress'
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                In Progress ({gradesData.length - completedCount})
              </button>
            </div>

            {/* Search Input, Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Search Field */}
              <div className="relative flex-1 sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search course or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 text-xs font-medium text-gray-700 rounded-xl py-2 pl-9 pr-3 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Semester Dropdown */}
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-7 hover:bg-gray-100 transition"
                >
                  <option value="All">All Semesters</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
              </div>

              {/* Course Dropdown */}
              <div className="relative max-w-xs">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-7 truncate hover:bg-gray-100 transition"
                >
                  <option value="All">All Courses</option>
                  {availableCourses.map((cTitle) => (
                    <option key={cTitle} value={cTitle}>
                      {cTitle}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Card View"
                >
                  <FiGrid className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Table View"
                >
                  <FiList className="text-sm" />
                </button>
              </div>

            </div>

          </div>

          {/* Module Grades Breakdown Section */}
          <div className="space-y-4">
            
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-48" />
                        <div className="h-3 bg-gray-100 rounded w-28" />
                      </div>
                      <div className="h-8 bg-gray-200 rounded-xl w-14" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-16 bg-gray-100 rounded-xl" />
                      <div className="h-16 bg-gray-100 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                <FiBookOpen className="text-4xl text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-700">No course modules matching your filter</h3>
                <p className="text-xs text-gray-400 mt-1">Try selecting a different semester, tab, or clearing the search keyword.</p>
              </div>
            ) : viewMode === 'cards' ? (
              /* CARD VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredGrades.map((course) => {
                  const items = course.assessmentItems && course.assessmentItems.length > 0
                    ? course.assessmentItems
                    : [
                        { name: "Assignments", type: "assignment", weight: 20, score: course.assignments, earned: 0 },
                        { name: "Course Work 1", type: "coursework", weight: 30, score: course.courseWork, earned: 0 },
                        { name: "Final Exam", type: "exam", weight: 40, score: course.finalExam, earned: 0 },
                        { name: "Attendance", type: "attendance", weight: 10, score: course.attendance, earned: 0 },
                      ];

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top Accent Strip */}
                      <div className={`h-1.5 w-full ${course.allAssessmentsCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`} />

                      <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        
                        {/* Course Header & Grade Badge */}
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {course.code}
                              </span>
                              <span className="text-xs font-semibold text-gray-400">
                                {course.semester}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-[#1E293B] line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Instructor: <span className="font-semibold text-gray-700">{course.instructor || "Faculty Lecturer"}</span>
                            </p>
                          </div>

                          {/* Final Grade Badge */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide ${
                              course.allAssessmentsCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {course.allAssessmentsCompleted ? `Grade ${course.grade}` : "In Progress"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 mt-1">
                              {course.allAssessmentsCompleted
                                ? `${course.totalPoints} / 100 Pts`
                                : `${course.publishedCount || 0}/${course.totalAssessmentCount || items.length} Published`}
                            </span>
                          </div>
                        </div>

                        {/* Overall Course Marks Bar */}
                        <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-600">Overall Course Mark</span>
                            <span className={`font-black ${course.allAssessmentsCompleted ? "text-emerald-600" : "text-amber-600"}`}>
                              {course.allAssessmentsCompleted
                                ? `${course.totalPoints}% Final Score`
                                : "Hidden until all assessments finished"}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                course.allAssessmentsCompleted ? "bg-emerald-500" : "bg-amber-400"
                              }`}
                              style={{
                                width: course.allAssessmentsCompleted
                                  ? `${Math.min(100, course.totalPoints || 0)}%`
                                  : `${Math.min(100, Math.round(((course.publishedCount || 0) / Math.max(1, course.totalAssessmentCount || items.length)) * 100))}%`
                              }}
                            />
                          </div>

                          <p className="text-[10px] text-gray-400 font-medium">
                            {course.allAssessmentsCompleted
                              ? "All required assessments completed, evaluated, and published."
                              : `Assessment Progress: ${course.publishedCount || 0} of ${course.totalAssessmentCount || items.length} components evaluated.`}
                          </p>
                        </div>

                        {/* Assessment Components Breakdown Table */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                              Assessment Breakdown ({items.length})
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/60">
                              Lecturer Configured
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {items.map((item, idx) => {
                              const meta = getCategoryMeta(item.type);
                              const isItemPublished = item.isPublished || (item.score && !item.score.startsWith("--"));
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                                    isItemPublished
                                      ? "bg-[#F8FAFC] border-gray-200/80 hover:bg-[#F1F5F9]"
                                      : "bg-gray-50/50 border-dashed border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-2">
                                    <div className="truncate pr-1">
                                      <p className="text-xs font-bold text-[#1E293B] truncate" title={item.name}>
                                        {item.name}
                                      </p>
                                      <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 ${meta.bg}`}>
                                        {meta.label}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                                      {item.weight}%
                                    </span>
                                  </div>

                                  <div className="flex items-baseline justify-between pt-1.5 border-t border-gray-100">
                                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                                      {isItemPublished ? (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      ) : (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      )}
                                      {isItemPublished ? "Published" : "Pending"}
                                    </span>
                                    <span className={`text-xs font-black ${isItemPublished ? "text-[#1E293B]" : "text-gray-400"}`}>
                                      {item.score || `-- / ${item.weight}`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          {course.allAssessmentsCompleted ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <FiCheckCircle className="text-xs" /> Verified & Published
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <FiClock className="text-xs" /> Ongoing Module Assessment
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {course.allAssessmentsCompleted ? "Final Grade Awarded" : "Partial Results"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50/80 text-[#64748B] text-[11px] uppercase tracking-wider font-bold border-b border-gray-100">
                        <th className="px-6 py-4">Course & Module</th>
                        <th className="px-4 py-4 text-center">Assignments</th>
                        <th className="px-4 py-4 text-center">Coursework</th>
                        <th className="px-4 py-4 text-center">Final Exam</th>
                        <th className="px-4 py-4 text-center">Attendance</th>
                        <th className="px-6 py-4 text-center">Final Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredGrades.map((course) => (
                        <tr key={course.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#1E293B]">{course.title}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[11px] font-medium text-gray-400">
                                  {course.code} &bull; {course.semester}
                                </span>
                                {course.assessmentItems && course.assessmentItems.length > 0 ? (
                                  course.assessmentItems.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50"
                                    >
                                      {item.name}: {item.weight}%
                                    </span>
                                  ))
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-[#334155]">{course.assignments}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-[#334155]">{course.courseWork}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-[#334155]">{course.finalExam}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-[#334155]">{course.attendance}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3.5 py-1 rounded-xl text-xs font-black ${
                              course.allAssessmentsCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {course.allAssessmentsCompleted ? course.grade : "In Progress"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Export Report Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1E293B]">Export Academic Performance Report</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Export verified academic results and coursework summary for <span className="font-bold text-gray-700">{studentInfo.studentName}</span>.
            </p>

            <div className="space-y-3">
              <button
                id="export-csv-btn"
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                    <FiFileText className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">CSV Spreadsheet</h4>
                    <p className="text-xs text-gray-500">Excel compatible dataset (.csv)</p>
                  </div>
                </div>
                <FiDownload className="text-gray-400 group-hover:text-blue-600" />
              </button>

              <button
                id="export-pdf-btn"
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                    <FiAward className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Printable PDF Transcript</h4>
                    <p className="text-xs text-gray-500">Official academic transcript format</p>
                  </div>
                </div>
                <FiDownload className="text-gray-400 group-hover:text-blue-600" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approval Required Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100 relative">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold mb-4">
              <FiLock />
            </div>

            <h3 className="text-base font-black text-gray-900">Admin Approval Required</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Exporting and downloading official academic reports requires administrator authorization.
            </p>

            <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
              <FiAlertCircle className="text-base shrink-0 mt-0.5 text-amber-700" />
              <span>Once an administrator reviews and approves your report download access, you will be able to export CSV spreadsheets and printable PDF transcripts.</span>
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