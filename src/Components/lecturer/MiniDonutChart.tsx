"use client";

interface DonutData {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export default function MiniDonutChart({ data }: { data: DonutData }) {
  const total = (data.A || 0) + (data.B || 0) + (data.C || 0) + (data.D || 0) + (data.F || 0);

  const buckets = [
    { label: "Grade A", count: data.A || 0, color: "#16A34A" },
    { label: "Grade B", count: data.B || 0, color: "#2563EB" },
    { label: "Grade C", count: data.C || 0, color: "#D97706" },
    { label: "Grade D", count: data.D || 0, color: "#9333EA" },
    { label: "Grade F", count: data.F || 0, color: "#DC2626" },
  ];

  if (total === 0) {
    return <div className="text-xs text-gray-400 py-8 text-center">No graded submissions yet</div>;
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* SVG Donut */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="12" />
          {buckets.map((b, idx) => {
            const strokeDasharray = `${(b.count / total) * circumference} ${circumference}`;
            const strokeDashoffset = -accumOffset;
            accumOffset += (b.count / total) * circumference;

            if (b.count === 0) return null;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={b.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-lg font-extrabold text-[#111827]">{total}</span>
          <span className="text-[9px] font-semibold text-gray-400 uppercase">Grades</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs font-semibold text-gray-600">
        {buckets.map((b, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
            <span className="w-16">{b.label}</span>
            <span className="text-[#111827] font-bold ml-auto">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
