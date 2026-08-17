"use client";

import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiCheckCircle, FiUsers } from "react-icons/fi";
import MiniBarChart, { MiniLineChart } from "@/Components/lecturer/MiniBarChart";
import MiniDonutChart from "@/Components/lecturer/MiniDonutChart";

export default function LecturerAnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
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
    fetchAnalytics();
  }, []);

  const performance = dashboardData?.performance || {
    barChart: [],
    lineChart: [],
    donutChart: { A: 0, B: 0, C: 0, D: 0, F: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <h1 className="text-2xl font-extrabold text-[#111827]">Teaching & Student Analytics</h1>
        <p className="text-xs text-gray-400 mt-1">Detailed performance metrics, grade distributions, and submission trends</p>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4">
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
              <FiBarChart2 className="text-[#2563EB]" /> Course Average Scores
            </h3>
            <MiniBarChart data={performance.barChart} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4">
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
              <FiTrendingUp className="text-purple-600" /> 7-Day Submissions Trend
            </h3>
            <MiniLineChart data={performance.lineChart} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 space-y-4">
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-2">
              <FiCheckCircle className="text-green-600" /> Grade Distribution
            </h3>
            <MiniDonutChart data={performance.donutChart} />
          </div>
        </div>
      )}
    </div>
  );
}
