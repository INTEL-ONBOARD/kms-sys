"use client";

import { useState, useEffect } from "react";
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiUsers, 
  FiRefreshCw, 
  FiAward, 
  FiPercent, 
  FiBookOpen 
} from "react-icons/fi";
import MiniBarChart, { MiniLineChart } from "@/Components/lecturer/MiniBarChart";
import MiniDonutChart from "@/Components/lecturer/MiniDonutChart";

export default function LecturerAnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const performance = dashboardData?.performance || {
    barChart: [],
    lineChart: [],
    donutChart: { A: 0, B: 0, C: 0, D: 0, F: 0 },
  };

  const donut = performance.donutChart || { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const totalGraded = (donut.A || 0) + (donut.B || 0) + (donut.C || 0) + (donut.D || 0) + (donut.F || 0);
  const passingCount = (donut.A || 0) + (donut.B || 0) + (donut.C || 0) + (donut.D || 0);
  const passingRate = totalGraded > 0 ? Math.round((passingCount / totalGraded) * 100) : 0;

  // Calculate overall class average from barChart data
  const courseScores: number[] = (performance.barChart || [])
    .map((c: any) => c.avgScore)
    .filter((s: number) => s > 0);

  const overallAvg = courseScores.length > 0
    ? Math.round(courseScores.reduce((acc, val) => acc + val, 0) / courseScores.length)
    : 0;

  const topCourse = (performance.barChart || [])
    .slice()
    .sort((a: any, b: any) => b.avgScore - a.avgScore)[0]?.courseTitle || "N/A";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Teaching & Student Analytics</h1>
          <p className="text-xs text-gray-400 mt-1">
            Detailed performance metrics, grade distributions, and submission trends
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          title="Refresh metrics"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-[#F7FAFC] border border-gray-200 hover:border-[#5A67D8] hover:text-[#5A67D8] rounded-xl shadow-sm transition"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Graded */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A0AEC0] font-semibold">Total Graded</p>
            <h3 className="text-2xl font-black text-[#111827] mt-1">{totalGraded}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Submissions evaluated</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-xl">
            <FiCheckCircle />
          </div>
        </div>

        {/* Passing Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A0AEC0] font-semibold">Passing Rate</p>
            <h3 className="text-2xl font-black text-[#16A34A] mt-1">{passingRate}%</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Grade D or higher</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-green-50 text-[#16A34A] flex items-center justify-center text-xl">
            <FiPercent />
          </div>
        </div>

        {/* Overall Average */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A0AEC0] font-semibold">Class Average</p>
            <h3 className="text-2xl font-black text-[#5A67D8] mt-1">{overallAvg}%</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Across all courses</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl">
            <FiAward />
          </div>
        </div>

        {/* Top Course */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A0AEC0] font-semibold">Top Performing</p>
            <h3 className="text-sm font-bold text-[#111827] mt-1 truncate max-w-[140px]" title={topCourse}>
              {topCourse}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Highest average score</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <FiBookOpen />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse p-6" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Average Scores */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
                <FiBarChart2 className="text-[#2563EB]" /> Course Average Scores
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Average score per course (0 - 100%)</p>
            </div>
            <MiniBarChart data={performance.barChart} />
          </div>

          {/* 7-Day Submissions Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
                <FiTrendingUp className="text-purple-600" /> 7-Day Submissions Trend
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Volume of assignment submissions over time</p>
            </div>
            <MiniLineChart data={performance.lineChart} />
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
                <FiCheckCircle className="text-green-600" /> Grade Distribution
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Breakdown (A: &ge;80%, B: 70-79%, C: 60-69%, D: 50-59%, F: &lt;50%)
              </p>
            </div>
            <MiniDonutChart data={donut} />
          </div>
        </div>
      )}
    </div>
  );
}
