"use client";

import { useEffect, useState } from "react";
import { IconType } from "react-icons";
import Link from "next/link";

interface StatCardProps {
  icon: IconType;
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "purple";
  trend?: string;
  href?: string;
  onClick?: () => void;
}

export default function StatCard({ icon: Icon, label, value, color, trend, href, onClick }: StatCardProps) {
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
      circleBg: "bg-blue-50 text-[#2563EB] group-hover:bg-blue-100",
      border: "border-gray-100/60 hover:border-blue-200",
    },
    green: {
      circleBg: "bg-green-50 text-[#16A34A] group-hover:bg-green-100",
      border: "border-gray-100/60 hover:border-green-200",
    },
    amber: {
      circleBg: "bg-amber-50 text-[#D97706] group-hover:bg-amber-100",
      border: "border-gray-100/60 hover:border-amber-200",
    },
    purple: {
      circleBg: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
      border: "border-gray-100/60 hover:border-purple-200",
    },
  };

  const style = colorStyles[color];
  const isClickable = Boolean(href || onClick);

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${style.circleBg} flex items-center justify-center text-xl transition-colors`}>
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
    </>
  );

  const containerClasses = `group bg-white rounded-2xl p-5 sm:p-6 shadow-sm border ${style.border} transition-all duration-200 ease-out flex flex-col justify-between ${
    isClickable ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "hover:-translate-y-0.5 hover:shadow-md"
  }`;

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className={containerClasses}>
        {content}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
}

