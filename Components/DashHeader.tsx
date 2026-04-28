"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react'; 
import { FiSearch, FiMail, FiBell, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';

export default function DashHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // State to hold the dynamic user name
  const [userName, setUserName] = useState("Loading...");

  // Fetch the logged-in user's data when the header mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Change this URL to match your actual backend API endpoint
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          
          setUserName(data.user.name); 
        } else {
          setUserName("User"); 
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserName("User");
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout process failed:', error);
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shadow-md relative z-10">
        
        {/* Search Input Area */}
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#F7FAFC] text-sm text-gray-700 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#5A67D8] transition placeholder-gray-400"
          />
        </div>

        {/* User Controls and Notification Area */}
        <div className="flex items-center space-x-6">
           <div className="flex items-center space-x-5 text-gray-400">
              <button className="hover:text-gray-600 transition"><FiMail className="text-xl" /></button>
              <button className="relative hover:text-gray-600 transition">
                <FiBell className="text-xl" />
                <span className="absolute 0 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white"></span>
              </button>
           </div>

          {/* User Profile Dropdown Container */}
          <div className="relative">
              <div 
                className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition border-l border-gray-100 pl-6"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden mr-3">
                    <Image src="./propic.png" alt="User Profile Picture" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div className="mr-2 hidden md:block text-left">
                      {/* Here we display the dynamically fetched user name */}
                      <p className="text-sm font-semibold text-[#2D3748]">{userName}</p>
                  </div>
                  <FiChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu Items */}
              {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50">
                      <Link 
                        href="/profile" 
                        className="flex items-center px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:bg-[#F7FAFC] hover:text-[#5A67D8] rounded-lg transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                          <FiUser className="mr-3 text-lg" />
                          Profile
                      </Link>
                      
                      <button 
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition mt-1"
                      >
                          <FiLogOut className="mr-3 text-lg" />
                          Log Out
                      </button>
                  </div>
              )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center transform transition-all scale-100">
            <h3 className="text-xl font-extrabold text-[#2D3748] mb-3">Log Out ?</h3>
            <p className="text-sm font-medium text-[#718096] mb-8">Are you sure you want to log out?</p>
            
            <div className="flex space-x-4 w-full justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="px-6 py-2.5 border border-[#5A67D8] text-[#5A67D8] font-bold text-sm rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 min-w-[110px]"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-6 py-2.5 bg-[#5A67D8] text-white font-bold text-sm rounded-lg hover:bg-[#434190] shadow-md shadow-indigo-200 transition disabled:opacity-50 min-w-[110px]"
              >
                {loggingOut ? 'Logging Out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}