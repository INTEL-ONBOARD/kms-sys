"use client";

import { useEffect, useState, useRef } from "react";

// Reusable component for the counting animation
const AnimatedNumber = ({ end, suffix }: { end: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation only when the component becomes visible in the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 } // Triggers when 50% of the element is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Stop if not visible
    if (!isVisible) return;

    let start = 0;
    const duration = 2000; // Total animation time in milliseconds (2 seconds)
    const incrementTime = 30; // Time between each update in milliseconds
    const steps = duration / incrementTime;
    const incrementValue = end / steps;

    const timer = setInterval(() => {
      start += incrementValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <h2 ref={ref} className="text-5xl font-bold mb-3 text-black">
      {count}{suffix}
    </h2>
  );
};

export default function StatsSection() {
  return (
    /* Statistics section with white background */
    <section className="py-24 px-8 bg-white text-center">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Stat 1: 25+ */}
        <div>
          <AnimatedNumber end={25} suffix="+" />
          <p className="text-sm text-gray-600">Years of Excellence</p>
        </div>
        
        {/* Stat 2: 10K+ */}
        <div>
          <AnimatedNumber end={10} suffix="K+" />
          <p className="text-sm text-gray-600">Graduates Worldwide</p>
        </div>
        
        {/* Stat 3: 95% */}
        <div>
          <AnimatedNumber end={95} suffix="%" />
          <p className="text-sm text-gray-600">Employment Rate</p>
        </div>
        
      </div>
    </section>
  );
}