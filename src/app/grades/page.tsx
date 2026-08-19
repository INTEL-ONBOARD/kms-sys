"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  FiChevronDown, 
  FiDownload, 
  FiFileText, 
  FiPrinter, 
  FiCheckCircle, 
  FiX, 
  FiRefreshCw, 
  FiBookOpen,
  FiAward
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
  totalPoints?: number;
}

export default function GradesPage() {
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Dynamic API state
  const [loading, setLoading] = useState(true);
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

  // Filter grades based on selected Semester and Course
  const filteredGrades = useMemo(() => {
    return gradesData.filter((item) => {
      const matchesSemester = selectedSemester === 'All' || selectedSemester === 'Select' || item.semester === selectedSemester;
      const matchesCourse = selectedCourse === 'All' || selectedCourse === 'All Courses' || item.title === selectedCourse || item.title.includes(selectedCourse);
      return matchesSemester && matchesCourse;
    });
  }, [gradesData, selectedSemester, selectedCourse]);

  // Compute filtered GPA dynamically if filtered
  const displayGPA = useMemo(() => {
    if (filteredGrades.length === 0) return studentInfo.gpa || "0.0";
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
      'N/A': 0.0,
    };
    const scoredGrades = filteredGrades.filter(g => g.grade !== 'N/A' && g.grade !== 'Pending');
    if (scoredGrades.length === 0) return "0.0";
    const totalPts = scoredGrades.reduce((sum, g) => sum + (gradePointMap[g.grade] ?? 0.0), 0);
    return (totalPts / scoredGrades.length).toFixed(1);
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
    showToast("Grade report downloaded as CSV successfully!");
  };

  const handleDownloadPDF = () => {
    const payload = getReportPayload();
    triggerPDFPrint(payload);
    setShowDownloadModal(false);
    showToast("Printable PDF transcript report opened!");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800 relative">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Toast Alert Notification */}
          {toastMessage && (
            <div className="mb-6 flex items-center justify-between bg-green-600 text-white px-5 py-3 rounded-xl shadow-md transition-all animate-bounce">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="text-xl" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80">
                <FiX className="text-lg" />
              </button>
            </div>
          )}

          {/* Page Title & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide flex items-center gap-2">
                <FiAward className="text-[#5A67D8]" /> Course Grades & Academic Performance
              </h1>
              <p className="text-xs text-[#A0AEC0] mt-1">
                Real-time assessment scores, module coursework breakdown, attendance, and semester GPA
              </p>
            </div>

            <button
              onClick={fetchGrades}
              title="Refresh Grades"
              className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row items-center bg-[#F4F7FE] border border-gray-100 rounded-xl px-4 py-3 mb-8 shadow-sm w-full xl:w-3/4 gap-4 md:gap-0">
            
            {/* Semester Filter Area */}
            <div className="flex items-center w-full md:w-64 pr-4 md:border-r border-gray-300">
              <span className="text-sm font-bold text-[#4A5568] mr-4">Semester</span>
              <div className="relative flex-1">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="appearance-none w-full bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-6"
                >
                  <option value="All">All Semesters</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Course Filter Area */}
            <div className="relative w-full md:w-80 pl-0 md:pl-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none w-full bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-6 truncate"
              >
                <option value="All">All Courses ({gradesData.length})</option>
                {availableCourses.map((cTitle) => (
                  <option key={cTitle} value={cTitle}>
                    {cTitle}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* GPA Summary Cards */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-10">
            
            {/* Current Semester GPA Card */}
            <div className="bg-white shadow-sm border border-gray-100 border-l-[8px] border-l-[#DD6B20] p-6 flex flex-col justify-center min-w-[240px] rounded-r-xl">
              <span className="text-4xl font-extrabold text-[#2D3748] mb-1">{displayGPA}</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold text-[#DD6B20]">GPA</span>
                <span className="text-[11px] font-semibold text-[#DD6B20] opacity-80">
                  {selectedSemester === 'All' ? 'Overall Average' : selectedSemester}
                </span>
              </div>
            </div>

            {/* Overall CGPA Card */}
            <div className="bg-white shadow-sm border border-gray-100 border-l-[8px] border-l-[#38A169] p-6 flex flex-col justify-center min-w-[240px] rounded-r-xl">
              <span className="text-4xl font-extrabold text-[#2D3748] mb-1">{studentInfo.cgpa}</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold text-[#38A169]">CGPA</span>
                <span className="text-[11px] font-semibold text-[#38A169] opacity-80">Cumulative Performance</span>
              </div>
            </div>

            {/* Enrolled Courses Metric Card */}
            <div className="bg-white shadow-sm border border-gray-100 border-l-[8px] border-l-[#5A67D8] p-6 flex flex-col justify-center min-w-[240px] rounded-r-xl">
              <span className="text-4xl font-extrabold text-[#2D3748] mb-1">{gradesData.length}</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold text-[#5A67D8]">Courses</span>
                <span className="text-[11px] font-semibold text-[#5A67D8] opacity-80">Enrolled This Academic Year</span>
              </div>
            </div>
            
          </div>

          {/* Grades Table Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2D3748]">Course Grades Breakdown</h2>
              <span className="text-xs text-gray-500 font-medium">
                Showing {filteredGrades.length} course assessment(s)
              </span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 text-[#A0AEC0] text-[11px] uppercase tracking-wider font-bold">
                      <th className="px-8 py-4">Course</th>
                      <th className="px-4 py-4 text-center">Assignments (20)</th>
                      <th className="px-4 py-4 text-center">Course work 1 (30)</th>
                      <th className="px-4 py-4 text-center">Final exam (40)</th>
                      <th className="px-4 py-4 text-center">Attendance (10)</th>
                      <th className="px-8 py-4 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-8 py-5">
                            <div className="h-4 bg-gray-200 rounded w-48 mb-1.5" />
                            <div className="h-3 bg-gray-100 rounded w-24" />
                          </td>
                          <td className="px-4 py-5 text-center"><div className="h-4 bg-gray-100 rounded w-16 mx-auto" /></td>
                          <td className="px-4 py-5 text-center"><div className="h-4 bg-gray-100 rounded w-16 mx-auto" /></td>
                          <td className="px-4 py-5 text-center"><div className="h-4 bg-gray-100 rounded w-16 mx-auto" /></td>
                          <td className="px-4 py-5 text-center"><div className="h-4 bg-gray-100 rounded w-16 mx-auto" /></td>
                          <td className="px-8 py-5 text-center"><div className="h-6 bg-gray-200 rounded w-12 mx-auto" /></td>
                        </tr>
                      ))
                    ) : filteredGrades.length > 0 ? (
                      filteredGrades.map((course) => (
                        <tr key={course.id} className="hover:bg-[#F7FAFC] transition">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#2D3748]">{course.title}</span>
                              <span className="text-[11px] font-medium text-gray-400 mt-0.5">
                                {course.code} &bull; {course.semester}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-medium text-[#4A5568]">{course.assignments}</td>
                          <td className="px-4 py-5 text-center text-sm font-medium text-[#4A5568]">{course.courseWork}</td>
                          <td className="px-4 py-5 text-center text-sm font-medium text-[#4A5568]">{course.finalExam}</td>
                          <td className="px-4 py-5 text-center text-sm font-medium text-[#4A5568]">{course.attendance}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`inline-block px-4 py-1 rounded-lg text-sm font-bold ${course.gradeColor}`}>
                              {course.grade}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-gray-400 text-sm">
                          <FiBookOpen className="text-3xl mx-auto mb-2 text-gray-300" />
                          No enrolled course grades found matching the selected filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="flex justify-end mt-8">
            <button
              id="download-report-btn"
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-[#5A67D8] hover:bg-[#434190] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition active:scale-95 cursor-pointer"
            >
              <FiDownload className="text-lg" />
              <span>Download Report</span>
            </button>
          </div>

        </div>
      </main>

      {/* Download Options Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Download Grade Report</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Export academic report for <span className="font-bold text-gray-700">{studentInfo.studentName}</span> ({filteredGrades.length} course(s) selected).
            </p>

            <div className="space-y-3">
              <button
                id="export-csv-btn"
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#5A67D8] hover:bg-indigo-50/50 transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-100 text-[#5A67D8] rounded-lg group-hover:bg-[#5A67D8] group-hover:text-white transition">
                    <FiFileText className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">CSV Spreadsheet</h4>
                    <p className="text-xs text-gray-500">Excel compatible dataset (.csv)</p>
                  </div>
                </div>
                <FiDownload className="text-gray-400 group-hover:text-[#5A67D8]" />
              </button>

              <button
                id="export-pdf-btn"
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition">
                    <FiPrinter className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">PDF Academic Transcript</h4>
                    <p className="text-xs text-gray-500">Official printable PDF document format</p>
                  </div>
                </div>
                <FiDownload className="text-gray-400 group-hover:text-green-600" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}