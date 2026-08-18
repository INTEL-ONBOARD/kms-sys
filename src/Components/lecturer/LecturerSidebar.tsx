"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FiBook, FiCalendar, FiBarChart2, FiUsers, FiVideo, FiFileText, FiPieChart } from "react-icons/fi";
import { MdDashboard, MdOutlineAssignment } from "react-icons/md";

export default function LecturerSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/lecturer", icon: MdDashboard },
    { label: "Courses", href: "/lecturer/courses", icon: FiBook },
    { label: "Materials", href: "/lecturer/materials", icon: FiFileText },
    { label: "Students", href: "/lecturer/students", icon: FiUsers },
    { label: "Assignments", href: "/lecturer/assignments", icon: MdOutlineAssignment },
    { label: "Exams", href: "/lecturer/exams", icon: FiFileText },
    { label: "Live Classes", href: "/lecturer/live-classes", icon: FiVideo },
    { label: "Gradebook", href: "/lecturer/grades", icon: FiBarChart2 },
    { label: "Analytics", href: "/lecturer/analytics", icon: FiPieChart },
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

