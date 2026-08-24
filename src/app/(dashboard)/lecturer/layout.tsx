"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LecturerSidebar from "@/components/lecturer/LecturerSidebar";
import LecturerDashHeader from "@/components/lecturer/LecturerDashHeader";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5A67D8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#A0AEC0]">Loading Lecturer Portal...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.replace("/login");
    return null;
  }

  if (session.user.role !== "lecturer" && session.user.role !== "super_admin") {
    router.replace("/student");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <LecturerSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <LecturerDashHeader />
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
