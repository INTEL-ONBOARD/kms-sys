"use client";

import { useState, useEffect } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiUsers, FiActivity, FiDollarSign, FiUserPlus, FiLoader } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  totalRevenue: number;
  chartData: { name: string; users: number }[];
  topCourses: { name: string; value: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const analyticsData = [
    { 
      title: "Total Users", 
      value: stats ? formatNumber(stats.totalUsers) : "0", 
      icon: <FiUsers className="text-2xl text-indigo-600" />,
      bg: "bg-indigo-50"
    },
    { 
      title: "Active Users", 
      value: stats ? formatNumber(stats.activeUsers) : "0", 
      icon: <FiActivity className="text-2xl text-blue-600" />,
      bg: "bg-blue-50"
    },
    { 
      title: "Total Revenue", 
      value: stats ? formatCurrency(stats.totalRevenue) : "$0", 
      icon: <FiDollarSign className="text-2xl text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    { 
      title: "New Registrations", 
      value: stats ? formatNumber(stats.newRegistrations) : "0", 
      icon: <FiUserPlus className="text-2xl text-orange-600" />,
      bg: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <DashHeader />

        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Admin Dashboard</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">System overview and analytics</p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analyticsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center hover:shadow-md transition duration-300 relative overflow-hidden">
                {/* Loading Overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <FiLoader className="animate-spin text-indigo-500 text-2xl mb-2" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading</span>
                  </div>
                )}
                
                <div className="flex items-start mb-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-[#2D3748]">{stat.value}</h3>
                  <p className="text-sm font-bold text-[#A0AEC0] uppercase tracking-wide mt-1">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[300px] relative">
                <h2 className="text-lg font-bold text-gray-800 mb-6">New User Registrations (Last 7 Days)</h2>
                {loading ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <FiLoader className="animate-spin text-indigo-500 text-2xl mb-2" />
                  </div>
                ) : (
                  <div className="flex-1 w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.chartData || []}>
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: '#F7F9FC' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="users" fill="#5A67D8" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[300px] relative">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Top Selling Courses</h2>
                {loading ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <FiLoader className="animate-spin text-indigo-500 text-2xl mb-2" />
                  </div>
                ) : (
                  <div className="flex-1 w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ right: 10 }}>
                        <Pie
                          data={stats?.topCourses || []}
                          cx="40%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {(stats?.topCourses || []).map((entry, index) => {
                            const COLORS = ['#5A67D8', '#48BB78', '#ED8936', '#F56565', '#4299E1', '#9F7AEA', '#F6AD55', '#68D391', '#FC8181', '#76E4F7'];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{
                            fontSize: '11px',
                            lineHeight: '1.8',
                            maxWidth: '45%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}