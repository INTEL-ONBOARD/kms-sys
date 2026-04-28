"use client";

import { useState } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiSave, FiGlobe, FiImage, FiCreditCard, FiMessageSquare, FiAward, FiVideo } from 'react-icons/fi';

export default function SettingsAdminPage() {
  
  // State for platform settings
  const [platformName, setPlatformName] = useState('Wise East University');
  const [domain, setDomain] = useState('lms.wiseeast.edu');
  const [currency, setCurrency] = useState('USD');
  const [paymentGateway, setPaymentGateway] = useState('stripe');

  // State for feature toggles
  const [features, setFeatures] = useState({
    forums: true,
    gamification: true,
    liveSessions: true,
    certificates: true
  });

  const handleToggle = (feature: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <DashHeader />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Platform Settings</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Configure system preferences, features, and integrations</p>
            </div>
            <button className="mt-4 md:mt-0 bg-[#5A67D8] hover:bg-[#434190] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300">
              <FiSave className="mr-2 text-lg" />
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: General & Payments */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* General Configuration Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                  <FiGlobe className="text-indigo-600 text-xl mr-3" />
                  <h2 className="text-lg font-bold text-gray-800">General Configuration</h2>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Platform Name</label>
                    <input 
                      type="text" 
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Primary Domain</label>
                    <input 
                      type="text" 
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Platform Logo</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                        <span className="font-bold text-xs">LOGO</span>
                      </div>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition flex items-center">
                        <FiImage className="mr-2" /> Change Logo
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Payments & Integrations Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                  <FiCreditCard className="text-green-600 text-xl mr-3" />
                  <h2 className="text-lg font-bold text-gray-800">Payments & Currency</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Default Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="LKR">LKR (Rs)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Active Payment Gateway</label>
                    <select 
                      value={paymentGateway}
                      onChange={(e) => setPaymentGateway(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="stripe">Stripe Connect</option>
                      <option value="paypal">PayPal</option>
                      <option value="razorpay">Razorpay</option>
                    </select>
                  </div>

                </div>
              </div>

            </div>

            {/* Feature Toggles */}
            <div className="space-y-8">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                  <FiAward className="text-orange-600 text-xl mr-3" />
                  <h2 className="text-lg font-bold text-gray-800">Feature Management</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  
                  {/* Toggle Item */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
                        <FiMessageSquare className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Discussion Forums</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Allow course Q&A forums</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('forums')}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${features.forums ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </button>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Toggle Item */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                        <FiAward className="text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Gamification</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Points, badges & leaderboards</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('gamification')}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${features.gamification ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </button>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Toggle Item */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <FiVideo className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Live Sessions</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Zoom/Meet WebRTC integration</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('liveSessions')}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${features.liveSessions ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </button>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Toggle Item */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                        <FiAward className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Certificates</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Auto-issue PDF certificates</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('certificates')}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${features.certificates ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </button>
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