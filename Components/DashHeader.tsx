"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { FiSearch, FiMail, FiBell, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';

export default function DashHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  
  // State to handle the visibility of the profile dropdown menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Handle the logout process
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Call the logout API to clear the HTTP-only cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Redirect the user back to the login page
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100">
      
      {/* Left: Search Bar */}
      <div className="relative w-full max-w-md">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-[#F7FAFC] text-sm text-gray-700 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-1 focus:ring-blue-200 transition placeholder-gray-400"
        />
      </div>

      {/* Right: User Controls & Profile */}
      <div className="flex items-center space-x-6">
         <div className="flex items-center space-x-5 text-gray-400">
            <button className="hover:text-gray-600 transition"><FiMail className="text-xl" /></button>
            <button className="relative hover:text-gray-600 transition">
              <FiBell className="text-xl" />
              <span className="absolute 0 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white"></span>
            </button>
         </div>

        {/* Profile Dropdown Area (Interactive) */}
        <div className="relative">
            <div 
              className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition border-l border-gray-100 pl-6"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)} // Toggle Dropdown
            >
                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img src="./propic.png" alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="mr-2 hidden md:block text-left">
                    <p className="text-sm font-semibold text-[#2D3748]">Aster Seawalker</p>
                </div>
                {/* Rotate arrow when menu is open */}
                <FiChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu Content */}
            {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50">
                    {/* Profile Option */}
                    <Link href="/profile" className="flex items-center px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:bg-[#F7FAFC] hover:text-[#5A67D8] rounded-lg transition">
                        <FiUser className="mr-3 text-lg" />
                        Profile
                    </Link>
                    
                    {/* Log Out Option */}
                    <button 
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 mt-1"
                    >
                        <FiLogOut className="mr-3 text-lg" />
                        {loggingOut ? 'Logging Out...' : 'Log Out'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}