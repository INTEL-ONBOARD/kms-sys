"use client";

import { FiFileText, FiMessageSquare, FiCheckCircle, FiBell } from "react-icons/fi";

interface ActivityItemProps {
  item: {
    id: string;
    type: "submission" | "announcement" | "graded" | string;
    title: string;
    courseTitle: string;
    timestamp: string;
  };
}

export default function ActivityItem({ item }: ActivityItemProps) {
  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour(s) ago`;
    return `${Math.floor(diff / 86400)} day(s) ago`;
  };

  let icon = <FiFileText className="text-[#2563EB]" />;
  let iconBg = "bg-blue-50";

  if (item.type === "announcement") {
    icon = <FiBell className="text-purple-600" />;
    iconBg = "bg-purple-50";
  } else if (item.type === "graded") {
    icon = <FiCheckCircle className="text-green-600" />;
    iconBg = "bg-green-50";
  }

  return (
    <div className="flex items-start p-3.5 hover:bg-[#F7FAFC] rounded-xl transition cursor-pointer">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 text-base`}>
        {icon}
      </div>
      <div className="flex-1 overflow-hidden">
        <h5 className="text-xs font-bold text-[#111827] truncate">{item.title}</h5>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1 font-medium">
          <span className="truncate">{item.courseTitle}</span>
          <span>{getRelativeTime(item.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
