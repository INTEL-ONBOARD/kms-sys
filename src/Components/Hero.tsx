import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[680px] flex items-center justify-center text-center text-white overflow-hidden">

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.png"
          alt="Wise East University Campus"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Rich Multi-Stop Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-950/80 via-slate-900/65 to-indigo-950/75" />

      {/* Subtle radial glow from centre */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />

      {/* Glassmorphism Content Card */}
      <div className="relative z-20 px-6 max-w-4xl mx-auto">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-widest text-indigo-200">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Admissions Open — 2025 / 2026
        </div>

        {/* Glassmorphism card wrapping heading + subtitle */}
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md px-8 py-10 md:px-14 md:py-12 shadow-2xl mb-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-tight mb-5 drop-shadow-lg">
            A Tradition of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
              Excellence
            </span>
          </h1>
          <p className="text-base md:text-xl font-light text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Shaping Leaders, Advancing Knowledge, and Inspiring Generations
            at Wise East University.
          </p>
        </div>

        {/* Dual CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admission">
            <button className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-10 py-4 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 text-sm uppercase tracking-widest">
              Apply Now
            </button>
          </Link>
          <Link href="/academics">
            <button className="group relative overflow-hidden border border-white/40 bg-white/10 backdrop-blur-md hover:bg-white hover:text-slate-900 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 text-sm uppercase tracking-widest">
              Explore Academics
            </button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 text-xs tracking-widest uppercase">
        <span>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
      </div>
    </section>
  );
}