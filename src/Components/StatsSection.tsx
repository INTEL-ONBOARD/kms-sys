"use client";

import { useEffect, useState, useRef } from "react";

// ── Animated counter hook ──────────────────────────────────────────────────
const AnimatedNumber = ({ end, suffix }: { end: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const incrementTime = 30;
    const steps = duration / incrementTime;
    const incrementValue = end / steps;

    const timer = setInterval(() => {
      start += incrementValue;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else { setCount(Math.ceil(start)); }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-extrabold text-white tabular-nums">
      {count}{suffix}
    </span>
  );
};

// ── Stats data ─────────────────────────────────────────────────────────────
const stats = [
  {
    end: 100,
    suffix: '+',
    label: 'Years of Excellence',
    sub: 'Established 1924',
    icon: '🏛️',
    gradient: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/20',
  },
  {
    end: 30,
    suffix: 'K+',
    label: 'Students Enrolled',
    sub: 'Across all programmes',
    icon: '🎓',
    gradient: 'from-sky-500/20 to-sky-600/10',
    border: 'border-sky-500/30',
    glow: 'shadow-sky-500/20',
  },
  {
    end: 200,
    suffix: '+',
    label: 'Academic Programmes',
    sub: 'Undergraduate & Postgraduate',
    icon: '📚',
    gradient: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20',
  },
  {
    end: 95,
    suffix: '%',
    label: 'Graduate Employment',
    sub: 'Within 12 months of graduation',
    icon: '💼',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function StatsSection() {
  return (
    <section className="relative py-24 px-4 bg-slate-900 overflow-hidden">

      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.10)_0%,_transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 mb-4">
            By The Numbers
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Our Impact at a Glance
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            Decades of commitment to academic excellence have built a legacy
            that speaks for itself.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`group relative rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm p-8
                flex flex-col items-center text-center
                transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${stat.glow}`}
            >
              {/* Icon */}
              <div className="text-4xl mb-5">{stat.icon}</div>

              {/* Animated Number */}
              <AnimatedNumber end={stat.end} suffix={stat.suffix} />

              {/* Label */}
              <p className="mt-3 text-slate-200 font-semibold text-base">
                {stat.label}
              </p>
              <p className="mt-1 text-slate-500 text-xs">
                {stat.sub}
              </p>

              {/* Hover glow ring */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/0 group-hover:ring-white/10 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}