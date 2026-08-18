"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FiBook, FiCalendar, FiBarChart2, FiUsers, FiVideo, FiFileText, FiPieChart, FiLogOut } from "react-icons/fi";
import { MdDashboard, MdOutlineAssignment } from "react-icons/md";

export default function LecturerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || "Lecturer";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "LC";

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
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-[#EEF2FF] text-[#5A67D8] font-bold border-l-4 border-[#5A67D8]"
                  : "text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium"
              }`}
            >
              <Icon className="mr-4 text-xl" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info card & Logout button */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#5A67D8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 font-medium">Lecturer</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition shrink-0"
          >
            <FiLogOut className="text-base" />
          </button>
        </div>
      </div>
    </aside>
  );
}

