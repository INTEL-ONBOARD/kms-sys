"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  FiBook, 
  FiCalendar, 
  FiBarChart2, 
  FiUsers, 
  FiVideo, 
  FiFileText, 
  FiPieChart, 
  FiLock 
} from "react-icons/fi";
import { MdDashboard, MdOutlineAssignment } from "react-icons/md";
import { useToast } from "@/Components/ToastProvider";

export default function LecturerSidebar() {
  const pathname = usePathname();
  const toast = useToast();
  const [courseCount, setCourseCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkAssignedCourses() {
      try {
        const res = await fetch("/api/lecturer/courses?limit=1");
        if (res.ok) {
          const data = await res.json();
          setCourseCount(data.pagination?.total ?? (data.data?.length || 0));
        }
      } catch (err) {
        console.error("Failed to check assigned courses:", err);
      }
    }
    checkAssignedCourses();
  }, [pathname]);

  const hasAssignedCourses = courseCount === null || courseCount > 0;

  const navItems = [
    { label: "Dashboard", href: "/lecturer", icon: MdDashboard, locked: false },
    { label: "Courses", href: "/lecturer/courses", icon: FiBook, locked: !hasAssignedCourses },
    { label: "Materials", href: "/lecturer/materials", icon: FiFileText, locked: !hasAssignedCourses },
    { label: "Students", href: "/lecturer/students", icon: FiUsers, locked: !hasAssignedCourses },
    { label: "Assignments", href: "/lecturer/assignments", icon: MdOutlineAssignment, locked: !hasAssignedCourses },
    { label: "Exams", href: "/lecturer/exams", icon: FiFileText, locked: !hasAssignedCourses },
    { label: "Live Classes", href: "/lecturer/live-classes", icon: FiVideo, locked: !hasAssignedCourses },
    { label: "Gradebook", href: "/lecturer/grades", icon: FiBarChart2, locked: !hasAssignedCourses },
    { label: "Analytics", href: "/lecturer/analytics", icon: FiPieChart, locked: !hasAssignedCourses },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20">
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
          Wise East<br />University
        </h2>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/lecturer"
              ? pathname === "/lecturer"
              : pathname.startsWith(item.href);

          if (item.locked) {
            return (
              <div
                key={item.href}
                onClick={() => {
                  toast.warning("Section Locked: You must be assigned to a course by an administrator before accessing this section.");
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
                  ? "border-[#5A67D8] bg-[#EEF2FF] text-[#5A67D8] font-bold"
                  : "border-transparent text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium"
              }`}
            >
              <Icon className="mr-4 text-xl" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {!hasAssignedCourses && (
        <div className="p-4 m-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
          <FiLock className="text-sm text-amber-600 mt-0.5 shrink-0" />
          <p className="leading-snug">
            <strong>Pending Setup:</strong> Features unlock once an admin assigns your courses.
          </p>
        </div>
      )}
    </aside>
  );
}
