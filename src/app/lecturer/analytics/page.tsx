"use client";

import { useState, useEffect } from "react";
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiRefreshCw, 
  FiAward, 
  FiPercent, 
  FiFileText, 
  FiClock, 
  FiInfo,
  FiUsers,
  FiArrowRight
} from "react-icons/fi";
import MiniBarChart, { MiniLineChart } from "@/Components/lecturer/MiniBarChart";
import MiniDonutChart from "@/Components/lecturer/MiniDonutChart";
import FinalGradesModal, { StudentFinalGrade } from "@/Components/lecturer/FinalGradesModal";

export default function LecturerAnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFinalGradesModal, setShowFinalGradesModal] = useState(false);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"A" | "B" | "C" | "S" | "F" | "ALL" | "IN_PROGRESS">("ALL");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lecturer/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const performance = dashboardData?.performance || {};
  const assignmentSummary = performance.assignmentGradesSummary || {
    totalEvaluated: 0,
    averageScore: 0,
    passingRate: 0,
    distribution: { A: 0, B: 0, C: 0, S: 0, F: 0 },
  };

  const finalSummary = performance.finalGradesSummary || {
    totalEnrolled: 0,
    completedCount: 0,
    inProgressCount: 0,
    completionRate: 0,
    averageFinalGrade: 0,
    passingRate: 0,
    distribution: { A: 0, B: 0, C: 0, S: 0, F: 0 },
  };

  const studentsList: StudentFinalGrade[] = performance.students || [];

  const lineChartData = performance.lineChart || [];
  const barChartData = performance.barChart || [];

  const assignmentDonut = performance.assignmentDonut || { A: 0, B: 0, C: 0, S: 0, F: 0 };
  const finalDonut = performance.finalDonut || { A: 0, B: 0, C: 0, S: 0, F: 0 };

  const isFinalGradesReady = (finalSummary.completedCount || 0) > 0;

  const handleOpenFinalGrades = (filter: "A" | "B" | "C" | "S" | "F" | "ALL" | "IN_PROGRESS" = "ALL") => {
    setSelectedGradeFilter(filter);
    setShowFinalGradesModal(true);
  };

  return (
    <div className="space-y-6 font-sans pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Teaching & Student Analytics</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time assignment performance metrics, grade distributions, and completed final course grades
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {studentsList.length > 0 && (
            <button
              onClick={() => handleOpenFinalGrades("ALL")}
              title="View individual student final grades"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl shadow-xs transition cursor-pointer"
            >
              <FiAward className="text-sm text-emerald-600" />
              <span>Student Final Grades ({finalSummary.completedCount})</span>
            </button>
          )}

          <button
            onClick={fetchAnalytics}
            title="Refresh metrics"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-[#F7FAFC] border border-gray-200 hover:border-[#5A67D8] hover:text-[#5A67D8] rounded-xl shadow-xs transition cursor-pointer"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Info Callout: Grade Policy */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/50 border border-blue-100/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-2xs">
        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-xs">
          <FiInfo />
        </div>
        <div className="space-y-0.5">
          <p className="font-extrabold text-blue-950">Grading Policy & Evaluation Architecture</p>
          <p className="text-blue-800 leading-relaxed">
            <strong>Assignment Grades</strong> represent continuous individual assessment scores evaluated per task.
            The <strong>Final Course Grade</strong> is generated for each student <span className="font-bold underline">after completing all assignments and the final exam</span>. Click on any segment or button in the <strong>Final Course Grades Distribution</strong> to view the detailed student roster with individual final marks and GPA.
          </p>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assignment Grades Evaluated */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs text-[#A0AEC0] font-semibold uppercase tracking-wider">Assignment Grades</p>
            </div>
            <h3 className="text-2xl font-black text-[#111827] mt-1.5">{assignmentSummary.totalEvaluated}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              Avg: <span className="font-bold text-blue-600">{assignmentSummary.averageScore}%</span> &middot; Passing: {assignmentSummary.passingRate}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-xl shadow-2xs">
            <FiFileText />
          </div>
        </div>

        {/* Card 2: Final Grade Completion Status */}
        <div
          onClick={() => handleOpenFinalGrades("ALL")}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-200 transition"
          title="Click to view student list"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isFinalGradesReady ? "bg-emerald-500" : "bg-amber-500"}`} />
              <p className="text-xs text-[#A0AEC0] font-semibold uppercase tracking-wider">Final Grades Ready</p>
            </div>
            <h3 className="text-2xl font-black text-emerald-600 mt-1.5">
              {finalSummary.completedCount} <span className="text-sm font-bold text-gray-400">/ {finalSummary.totalEnrolled}</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              {isFinalGradesReady ? (
                <span className="font-bold text-emerald-600">{finalSummary.completedCount} student(s) completed all requirements</span>
              ) : (
                <span className="text-amber-600 font-semibold">{finalSummary.inProgressCount} student(s) in progress</span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-2xs">
            <FiCheckCircle />
          </div>
        </div>

        {/* Card 3: Class Final Average */}
        <div
          onClick={() => isFinalGradesReady && handleOpenFinalGrades("ALL")}
          className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between ${
            isFinalGradesReady ? "cursor-pointer hover:border-indigo-200 transition" : ""
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <p className="text-xs text-[#A0AEC0] font-semibold uppercase tracking-wider">Final Course Avg</p>
            </div>
            <h3 className="text-2xl font-black text-[#5A67D8] mt-1.5">
              {isFinalGradesReady ? `${finalSummary.averageFinalGrade}%` : "—"}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              {isFinalGradesReady ? `Based on ${finalSummary.completedCount} completed student(s)` : `${finalSummary.inProgressCount} student(s) in progress`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl shadow-2xs">
            <FiAward />
          </div>
        </div>

        {/* Card 4: Final Passing Rate */}
        <div
          onClick={() => isFinalGradesReady && handleOpenFinalGrades("ALL")}
          className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between ${
            isFinalGradesReady ? "cursor-pointer hover:border-purple-200 transition" : ""
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <p className="text-xs text-[#A0AEC0] font-semibold uppercase tracking-wider">Final Pass Rate</p>
            </div>
            <h3 className="text-2xl font-black text-purple-600 mt-1.5">
              {isFinalGradesReady ? `${finalSummary.passingRate}%` : "—"}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isFinalGradesReady ? "Grade S or higher (≥50%)" : "Awaiting student completion"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-2xs">
            <FiPercent />
          </div>
        </div>
      </div>

      {/* Main Charts: Dual Donut Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Assignment Grades Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
                <FiFileText className="text-[#2563EB]" /> Assignment Grades Distribution
              </h3>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                {assignmentSummary.totalEvaluated} Graded Tasks
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Individual assignment submission performance (Continuous Assessment)
            </p>
          </div>
          <div className="py-2">
            <MiniDonutChart data={assignmentDonut} />
          </div>
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Evaluated Submissions: <strong>{assignmentSummary.totalEvaluated}</strong></span>
            <span>Assignment Avg: <strong className="text-blue-600">{assignmentSummary.averageScore}%</strong></span>
          </div>
        </div>

        {/* 2. Final Course Grades Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
                <FiAward className="text-emerald-600" /> Final Course Grades Distribution
              </h3>
              <div className="flex items-center gap-2">
                {isFinalGradesReady ? (
                  <button
                    type="button"
                    onClick={() => handleOpenFinalGrades("ALL")}
                    className="text-[10px] font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                    title="Click to view all final student grades"
                  >
                    <FiUsers />
                    <span>{finalSummary.completedCount} Completed</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenFinalGrades("IN_PROGRESS")}
                    className="text-[10px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-200 transition cursor-pointer"
                  >
                    {finalSummary.inProgressCount} Pending Completion
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Click any grade segment below to view student marks & GPA
            </p>
          </div>

          <div className="py-2">
            {isFinalGradesReady ? (
              <MiniDonutChart
                data={finalDonut}
                interactive={true}
                onSelectBucket={(grade) => handleOpenFinalGrades(grade as any)}
              />
            ) : (
              <div className="text-center py-10 px-4 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 my-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mx-auto mb-3 shadow-2xs">
                  <FiClock />
                </div>
                <h4 className="font-bold text-gray-800 text-xs">No Final Grades Completed Yet</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Final course grades and distribution will appear as soon as a student completes all course assignments and the final exam.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-bold text-gray-600 shadow-2xs">
                  <span>0 of {finalSummary.totalEnrolled} students finished</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Completed: <strong>{finalSummary.completedCount}</strong> &middot; In Progress: <strong>{finalSummary.inProgressCount}</strong></span>
            {isFinalGradesReady ? (
              <button
                type="button"
                onClick={() => handleOpenFinalGrades("ALL")}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View Student Roster</span>
                <FiArrowRight className="text-xs" />
              </button>
            ) : (
              <span className="text-gray-400">Awaiting completion</span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts: Bar Chart & Line Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Average Scores */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
              <FiBarChart2 className="text-[#5A67D8]" /> Course Average Assignment Scores
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Overall assignment performance per course (0 - 100%)</p>
          </div>
          <MiniBarChart data={barChartData} />
        </div>

        {/* 7-Day Submissions Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
              <FiTrendingUp className="text-purple-600" /> 7-Day Submissions Volume
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Assignment submissions activity over the last 7 days</p>
          </div>
          <MiniLineChart data={lineChartData} />
        </div>
      </div>

      {/* Final Grades & Student Roster Modal */}
      {showFinalGradesModal && (
        <FinalGradesModal
          initialGradeFilter={selectedGradeFilter}
          onClose={() => setShowFinalGradesModal(false)}
        />
      )}
    </div>
  );
}
