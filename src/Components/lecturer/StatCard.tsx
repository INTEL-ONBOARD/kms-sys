"use client";

import { useEffect, useState } from "react";
import { IconType } from "react-icons";

interface StatCardProps {
  icon: IconType;
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "purple";
  trend?: string;
}

export default function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Count-up animation over 1.5s
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1500;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    blue: {
      circleBg: "bg-blue-50 text-[#2563EB]",
      border: "border-gray-100/50",
    },
    green: {
      circleBg: "bg-green-50 text-[#16A34A]",
      border: "border-gray-100/50",
    },
    amber: {
      circleBg: "bg-amber-50 text-[#D97706]",
      border: "border-gray-100/50",
    },
    purple: {
      circleBg: "bg-purple-50 text-purple-600",
      border: "border-gray-100/50",
    },
  };

  const style = colorStyles[color];

  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border ${style.border} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${style.circleBg} flex items-center justify-center text-xl`}>
          <Icon />
        </div>
        {trend && (
          <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">{displayValue}</h3>
        <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
