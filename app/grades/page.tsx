"use client";

import { FiChevronDown, FiDownload } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

export default function GradesPage() {
  // Course grades data array for the table
  const gradesData = [
    {
      id: 1,
      title: "Animation Studies I (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      assignments: "18 / 20",
      courseWork: "26 / 30",
      finalExam: "34 / 40",
      attendance: "10 / 10",
      grade: "A",
      gradeColor: "text-green-500 bg-green-50",
    },
    {
      id: 2,
      title: "Drawing and Illustration (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      assignments: "20 / 20",
      courseWork: "22 / 30",
      finalExam: "32 / 40",
      attendance: "08 / 10",
      grade: "B +",
      gradeColor: "text-orange-400 bg-orange-50",
    },
    {
      id: 3,
      title: "Design Principles I (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      assignments: "19 / 20",
      courseWork: "27 / 30",
      finalExam: "38 / 40",
      attendance: "09 / 10",
      grade: "A",
      gradeColor: "text-green-500 bg-green-50",
    },
    {
      id: 4,
      title: "Principles of Script Writing (WISE-25.1F/CO)",
      code: "WISE-25.1F/CO",
      assignments: "17 / 20",
      courseWork: "29 / 30",
      finalExam: "35 / 40",
      attendance: "09 / 10",
      grade: "A -",
      gradeColor: "text-green-400 bg-green-50",
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Grades</h1>
          </div>

          {/* Filters Row - Styled as a single continuous bar to match the mockup */}
          <div className="flex items-center bg-[#F4F7FE] border border-gray-100 rounded-xl px-4 py-3 mb-8 shadow-sm w-full xl:w-3/4">
            
            {/* Semester Filter Area */}
            <div className="flex items-center w-full md:w-64 pr-4 border-r border-gray-300">
              <span className="text-sm font-bold text-[#4A5568] mr-4">Semester</span>
              <div className="relative flex-1">
                <select className="appearance-none w-full bg-transparent text-sm font-medium text-gray-500 focus:outline-none cursor-pointer">
                  <option>Select</option>
                  <option>Semester 01</option>
                  <option>Semester 02</option>
                </select>
                <FiChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Course Filter Area */}
            <div className="relative w-full md:w-64 pl-4">
              <select className="appearance-none w-full bg-transparent text-sm font-medium text-gray-500 focus:outline-none cursor-pointer">
                <option>All Courses</option>
                <option>Animation Studies I</option>
                <option>Design Principles I</option>
              </select>
              <FiChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* GPA Summary Cards - Updated to match the thick left border design */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-10">
            
            {/* Current Semester GPA Card */}
            <div className="bg-white shadow-sm border border-gray-100 border-l-[8px] border-l-[#DD6B20] p-6 flex flex-col justify-center min-w-[240px]">
              <span className="text-4xl font-extrabold text-[#2D3748] mb-1">3.7</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold text-[#DD6B20]">GPA</span>
                <span className="text-[11px] font-semibold text-[#DD6B20] opacity-80">this semester</span>
              </div>
            </div>

            {/* Overall CGPA Card */}
            <div className="bg-white shadow-sm border border-gray-100 border-l-[8px] border-l-[#38A169] p-6 flex flex-col justify-center min-w-[240px]">
              <span className="text-4xl font-extrabold text-[#2D3748] mb-1">3.8</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold text-[#38A169]">CGPA</span>
                <span className="text-[11px] font-semibold text-[#38A169] opacity-80">Cumulative</span>
              </div>
            </div>
            
          </div>

          {/* Grades Table Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#2D3748] mb-4">Course Grades</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 text-[#A0AEC0] text-[11px] uppercase tracking-wider font-bold">
                      <th className="px-8 py-4">Course</th>
                      <th className="px-4 py-4 text-center">Assignments</th>
                      <th className="px-4 py-4 text-center">Course work 1</th>
                      <th className="px-4 py-4 text-center">Final exam</th>
                      <th className="px-4 py-4 text-center">Attendance</th>
                      <th className="px-8 py-4 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gradesData.map((course) => (
                      <tr key={course.id} className="hover:bg-[#F7FAFC] transition">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#2D3748]">{course.title}</span>
                            <span className="text-[11px] font-medium text-gray-400 mt-0.5">{course.code}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="flex justify-end mt-8">
            <button className="flex items-center space-x-2 px-6 py-3 bg-[#5A67D8] hover:bg-[#434190] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition">
              <FiDownload className="text-lg" />
              <span>Download Report</span>
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}