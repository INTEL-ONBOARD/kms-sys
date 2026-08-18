import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-28 px-4 bg-white overflow-hidden">

      {/* Soft radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(238,242,255,1)_0%,_rgba(255,255,255,0.2)_70%)]" />

      {/* Decorative blurred blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-sky-100 rounded-full blur-3xl opacity-60" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Badge */}
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-100 mb-6">
          Take The First Step
        </span>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Begin Your Journey at{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
            Wise East
          </span>
        </h2>

        {/* Supporting text */}
        <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          Join a community of scholars, innovators, and leaders. Your
          transformative academic experience starts here.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary — gradient, rounded-full, scale on hover */}
          <Link href="/admission">
            <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold px-10 py-4 rounded-full shadow-xl shadow-indigo-300/40 transition-all duration-300 hover:scale-105 hover:shadow-indigo-400/50 text-sm uppercase tracking-widest">
              Apply Now
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </Link>

          {/* Secondary — outline style */}
          <Link href="/about">
            <button className="inline-flex items-center gap-2 border-2 border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 font-semibold px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 text-sm uppercase tracking-widest">
              Learn More
            </button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> No Application Fee
          </span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> Scholarships Available
          </span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> Results in 4 Weeks
          </span>
        </div>
      </div>
    </section>
  );
}