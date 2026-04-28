"use client";

// Import your shared header and the new Admin Sidebar
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiUsers, FiActivity, FiDollarSign, FiUserPlus } from 'react-icons/fi';

export default function AdminDashboard() {

  // Mock data for the analytics cards 
  const analyticsData = [
    { 
      title: "Total Users", 
      value: "1,245", 
      trend: "+12%", 
      trendColor: "text-green-500",
      icon: <FiUsers className="text-2xl text-indigo-600" />,
      bg: "bg-indigo-50"
    },
    { 
      title: "Active Users", 
      value: "856", 
      trend: "+5%", 
      trendColor: "text-green-500",
      icon: <FiActivity className="text-2xl text-blue-600" />,
      bg: "bg-blue-50"
    },
    { 
      title: "Total Revenue", 
      value: "$12,450", 
      trend: "+18%", 
      trendColor: "text-green-500",
      icon: <FiDollarSign className="text-2xl text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    { 
      title: "New Registrations", 
      value: "128", 
      trend: "-2%", 
      trendColor: "text-red-500",
      icon: <FiUserPlus className="text-2xl text-orange-600" />,
      bg: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Include the Admin Sidebar here */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <DashHeader />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Admin Dashboard</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">System overview and analytics</p>
          </div>

          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analyticsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center hover:shadow-md transition duration-300">
                <div className="flex justify-between items-start mb-4">
                  {/* Icon Container */}
                  <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  {/* Trend Indicator */}
                  <div className={`text-sm font-bold ${stat.trendColor} bg-gray-50 px-2 py-1 rounded-md`}>
                    {stat.trend}
                  </div>
                </div>
                {/* Data Value */}
                <div>
                  <h3 className="text-3xl font-extrabold text-[#2D3748]">{stat.value}</h3>
                  <p className="text-sm font-bold text-[#A0AEC0] uppercase tracking-wide mt-1">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Placeholder for Next Sections (Charts & Tables) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
                <p className="text-gray-400 font-medium">Revenue & Enrollment Chart will go here</p>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
                <p className="text-gray-400 font-medium">Top Performing Courses will go here</p>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}