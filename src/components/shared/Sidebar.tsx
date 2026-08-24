"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiBook, FiCalendar, FiBarChart2, FiVideo, FiFileText, FiLock, FiMenu, FiX } from 'react-icons/fi';
import { MdDashboard, MdOutlineAssignment, MdOutlineLiveTv, MdVideoLibrary } from 'react-icons/md';
import { useToast } from '@/contexts/ToastContext';

export default function Sidebar() {
  const pathname = usePathname();
  const toast = useToast();
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function checkStudentEnrollments() {
      try {
        const res = await fetch("/api/student/dashboard");
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data.enrollments) ? data.enrollments.length : 0;
          setCourseCount(count);
        }
      } catch (err) {
        console.error("Failed to check student enrollments:", err);
      }
    }
    checkStudentEnrollments();
  }, [pathname]);

  const hasAssignedCourses = courseCount === null || courseCount > 0;

  const navItems = [
    { label: "Dashboard", href: "/student", icon: MdDashboard, locked: false },
    { label: "Courses", href: "/courses", icon: FiBook, locked: !hasAssignedCourses },
    { label: "Assignments", href: "/assignments", icon: MdOutlineAssignment, locked: !hasAssignedCourses },
    { label: "Live Classes", href: "/live-classes", icon: MdOutlineLiveTv, locked: !hasAssignedCourses },
    { label: "Recordings & Playback", href: "/recordings", icon: MdVideoLibrary, locked: !hasAssignedCourses },
    { label: "Timetable Calendar", href: "/calendar", icon: FiCalendar, locked: !hasAssignedCourses },
    { label: "Grades", href: "/grades", icon: FiBarChart2, locked: !hasAssignedCourses },
  ];

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-40 p-2 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center transition"
        aria-label="Open Navigation Menu"
      >
        <FiMenu className="text-xl" />
      </button>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header with Logo and Close Button */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src="/logo2.png"
              alt="Wise East University Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#2D3748]">
              Wise East University
            </h2>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close Navigation"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/student"
                ? pathname === "/student"
                : pathname.startsWith(item.href);

            if (item.locked) {
              return (
                <div
                  key={item.href}
                  onClick={() => {
                    setMobileOpen(false);
                    toast.warning("Section Locked: You have not been assigned to any courses yet. An administrator must assign you to a course before you can access this section.");
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-r-xl border-l-4 border-transparent text-gray-300 hover:text-gray-400 hover:bg-gray-50/60 font-medium cursor-not-allowed transition select-none"
                  title="Awaiting Course Assignment by Admin"
                >
                  <div className="flex items-center">
                    <Icon className="mr-4 text-xl text-gray-300" />
                    <span>{item.label}</span>
                  </div>
                  <FiLock className="text-xs text-amber-500/80 ml-2" />
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
                  isActive
                    ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
                    : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
                }`}
              >
                <Icon className="mr-4 text-xl" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!hasAssignedCourses && (
          <div className="p-4 m-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <FiLock className="text-sm text-amber-600 mt-0.5 shrink-0" />
            <p className="leading-snug">
              <strong>Pending Assignment:</strong> Features will unlock once an administrator assigns your course(s).
            </p>
          </div>
        )}
      </aside>

      {/* Desktop Sidebar Component */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20 shrink-0">
        {/* University Logo Area */}
        <div className="p-8 flex flex-col items-center mb-2 mt-2">
          <Image 
            src="/logo2.png" 
            alt="Wise East University Logo" 
            width={45} 
            height={45} 
            className="object-contain mb-3"
          />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#2D3748] text-center">
            Wise East<br/>University
          </h2>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/student"
                ? pathname === "/student"
                : pathname.startsWith(item.href);

            if (item.locked) {
              return (
                <div
                  key={item.href}
                  onClick={() => {
                    toast.warning("Section Locked: You have not been assigned to any courses yet. An administrator must assign you to a course before you can access this section.");
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-r-xl border-l-4 border-transparent text-gray-300 hover:text-gray-400 hover:bg-gray-50/60 font-medium cursor-not-allowed transition select-none"
                  title="Awaiting Course Assignment by Admin"
                >
                  <div className="flex items-center">
                    <Icon className="mr-4 text-xl text-gray-300" />
                    <span>{item.label}</span>
                  </div>
                  <FiLock className="text-xs text-amber-500/80 ml-2" />
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-r-xl transition border-l-4 ${
                  isActive
                    ? 'border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold'
                    : 'border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium'
                }`}
              >
                <Icon className="mr-4 text-xl" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!hasAssignedCourses && (
          <div className="p-4 m-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <FiLock className="text-sm text-amber-600 mt-0.5 shrink-0" />
            <p className="leading-snug">
              <strong>Pending Assignment:</strong> Features will unlock once an administrator assigns your course(s).
            </p>
          </div>
        )}

        <div className="p-4 mt-auto"></div>
      </aside>
    </>
  );
}