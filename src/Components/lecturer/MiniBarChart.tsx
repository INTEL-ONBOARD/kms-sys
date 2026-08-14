"use client";

interface BarChartItem {
  courseTitle: string;
  avgScore: number;
}

export default function MiniBarChart({ data }: { data: BarChartItem[] }) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400 py-8 text-center">No grade data available</div>;
  }

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const colors = ["bg-blue-600", "bg-purple-600", "bg-teal-600", "bg-amber-600"];
        const barColor = colors[idx % colors.length];

        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
              <span className="truncate max-w-[140px]">{item.courseTitle}</span>
              <span className="text-[#111827] font-bold">{item.avgScore}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, Math.max(0, item.avgScore))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniLineChart({ data }: { data: Array<{ label: string; count: number }> }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const width = 300;
  const height = 100;
  const padding = 20;

  const points = data
    .map((d, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.count / maxCount) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        {/* Background Grid Lines */}
        <line x1="0" y1="20" x2={width} y2="20" stroke="#F3F4F6" strokeDasharray="4" />
        <line x1="0" y1="50" x2={width} y2="50" stroke="#F3F4F6" strokeDasharray="4" />
        <line x1="0" y1="80" x2={width} y2="80" stroke="#F3F4F6" strokeDasharray="4" />

        {/* Polyline */}
        <polyline
          fill="none"
          stroke="#2563EB"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Dots */}
        {data.map((d, idx) => {
          const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - (d.count / maxCount) * (height - 2 * padding);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              className="fill-white stroke-[#2563EB] stroke-[3]"
            />
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between w-full text-[10px] font-semibold text-gray-400 mt-2 px-1">
        {data.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
