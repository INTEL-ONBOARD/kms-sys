"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { 
  FiSearch, 
  FiMail, 
  FiBell, 
  FiChevronDown, 
  FiUser, 
  FiLogOut, 
  FiPlus, 
  FiCheck,
  FiCalendar,
  FiVideo,
  FiAward,
  FiBook,
  FiInfo
} from "react-icons/fi";
import { MdOutlineAssignment } from "react-icons/md";
import { useSession, signOut } from "next-auth/react";
import QuickActionModal from "./QuickActionModal";

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export default function LecturerDashHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Quick action modal state
  const [modalType, setModalType] = useState<"assignment" | "class" | "material" | null>(null);

  // Notification states
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const userName = status === "loading" ? "Loading..." : session?.user?.name || "Dr. Lecturer";

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.read) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif._id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking single notification read:", err);
    }

    setNotificationMenuOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout process failed:", error);
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "exam":
        return <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 text-sm"><FiCalendar /></div>;
      case "class":
        return <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm"><FiVideo /></div>;
      case "grading":
        return <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 text-sm"><FiAward /></div>;
      case "assignment":
        return <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 text-sm"><MdOutlineAssignment /></div>;
      case "announcement":
        return <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-sm"><FiBook /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center flex-shrink-0 text-sm"><FiInfo /></div>;
    }
  };

  return (
    <>
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shadow-md relative z-30 font-sans">
        {/* Search Input Area */}
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search courses, assignments, students..."
            className="w-full bg-[#F7FAFC] text-xs text-gray-700 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#5A67D8] transition placeholder-gray-400"
          />
        </div>

        {/* User Controls and Notification Area */}
        <div className="flex items-center space-x-6">
          {/* Quick Action Trigger */}
          <button
            onClick={() => setModalType("class")}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#434190] transition"
          >
            <FiPlus className="text-sm" /> Quick Action
          </button>

          <div className="flex items-center space-x-4 text-gray-400">
            <button className="hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50">
              <FiMail className="text-xl" />
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="relative hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50"
                title="Notifications"
              >
                <FiBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white font-bold text-[9px] rounded-full border-2 border-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {notificationMenuOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in duration-150">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#F7FAFC]">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[#111827] text-xs uppercase tracking-wider">
                        Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-[#5A67D8] hover:underline flex items-center gap-1"
                      >
                        <FiCheck /> Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400">
                        <FiBell className="text-2xl mx-auto mb-2 text-gray-300" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-[#F7FAFC] ${
                            !notif.read ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          {getNotificationIcon(notif.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${!notif.read ? 'font-bold text-[#111827]' : 'text-gray-600'}`}>
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#5A67D8] mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Dropdown Container */}
          <div className="relative" ref={profileRef}>
            <div
              className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition border-l border-gray-100 pl-6"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden mr-3">
                <Image
                  src="/propic.png"
                  alt="User Profile Picture"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mr-2 hidden md:block text-left">
                <p className="text-sm font-semibold text-[#2D3748]">{userName}</p>
              </div>
              <FiChevronDown
                className={`text-gray-400 text-sm transition-transform duration-200 ${
                  profileMenuOpen ? "rotate-180" : ""
                }`}
              />
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

      {/* Quick Action Modal Component */}
      {modalType && (
        <QuickActionModal
          type={modalType}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            fetchNotifications();
          }}
        />
      )}

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
                {loggingOut ? "Logging Out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
