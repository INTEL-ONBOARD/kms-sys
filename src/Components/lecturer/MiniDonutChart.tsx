"use client";

interface DonutData {
  A: number;
  B: number;
  C: number;
  S?: number;
  D?: number;
  F: number;
}

interface MiniDonutChartProps {
  data: DonutData;
  onSelectBucket?: (grade: "A" | "B" | "C" | "S" | "F" | "ALL") => void;
  activeBucket?: string | null;
  interactive?: boolean;
}

export default function MiniDonutChart({
  data,
  onSelectBucket,
  activeBucket,
  interactive = false,
}: MiniDonutChartProps) {
  const sCount = data.S !== undefined ? data.S : data.D !== undefined ? data.D : 0;
  const total = (data.A || 0) + (data.B || 0) + (data.C || 0) + sCount + (data.F || 0);

  const buckets: Array<{
    key: "A" | "B" | "C" | "S" | "F";
    label: string;
    count: number;
    color: string;
    bgHover: string;
  }> = [
    { key: "A", label: "Grade A", count: data.A || 0, color: "#16A34A", bgHover: "hover:bg-emerald-50" },
    { key: "B", label: "Grade B", count: data.B || 0, color: "#2563EB", bgHover: "hover:bg-blue-50" },
    { key: "C", label: "Grade C", count: data.C || 0, color: "#D97706", bgHover: "hover:bg-amber-50" },
    { key: "S", label: "Grade S", count: sCount, color: "#9333EA", bgHover: "hover:bg-purple-50" },
    { key: "F", label: "Grade F", count: data.F || 0, color: "#DC2626", bgHover: "hover:bg-rose-50" },
  ];

  if (total === 0) {
    return <div className="text-xs text-gray-400 py-8 text-center">No graded submissions yet</div>;
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumOffset = 0;

  const isClickable = Boolean(interactive || onSelectBucket);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* SVG Donut */}
      <div className={`relative w-32 h-32 flex-shrink-0 ${isClickable ? "cursor-pointer group" : ""}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="12" />
          {buckets.map((b, idx) => {
            const strokeDasharray = `${(b.count / total) * circumference} ${circumference}`;
            const strokeDashoffset = -accumOffset;
            accumOffset += (b.count / total) * circumference;

            if (b.count === 0) return null;

            const isSelected = activeBucket === b.key;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={b.color}
                strokeWidth={isSelected ? 15 : 12}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onClick={() => onSelectBucket && onSelectBucket(b.key)}
                className={`transition-all duration-300 ${
                  isClickable
                    ? "cursor-pointer hover:opacity-80 hover:stroke-[14px]"
                    : ""
                }`}
              />
            );
          })}
        </svg>
        <div
          onClick={() => onSelectBucket && onSelectBucket("ALL")}
          className={`absolute inset-0 flex flex-col items-center justify-center text-center ${
            isClickable ? "cursor-pointer" : "pointer-events-none"
          }`}
          title={isClickable ? "Click to view all final grades" : undefined}
        >
          <span className="text-lg font-extrabold text-[#111827]">{total}</span>
          <span className="text-[9px] font-semibold text-gray-400 uppercase">Grades</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs font-semibold text-gray-600">
        {buckets.map((b, idx) => {
          const isSelected = activeBucket === b.key;
          return (
            <div
              key={idx}
              onClick={() => onSelectBucket && onSelectBucket(b.key)}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition ${
                isClickable
                  ? `cursor-pointer ${b.bgHover} ${
                      isSelected ? "bg-gray-100 ring-1 ring-gray-300 font-bold" : ""
                    }`
                  : ""
              }`}
              title={isClickable ? `View students with ${b.label}` : undefined}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="w-16 text-gray-700">{b.label}</span>
              <span className="text-[#111827] font-bold ml-auto">{b.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
