export default function QuoteSection() {
  return (
    <section className="relative py-28 px-4 overflow-hidden bg-white">

      {/* Deep diagonal gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />

      {/* Subtle dot-grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-56 h-56 bg-sky-600/15 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Large decorative quotation mark */}
        <div className="text-8xl md:text-9xl font-serif text-indigo-400/30 leading-none select-none mb-2">
          &ldquo;
        </div>

        {/* Quote text */}
        <blockquote className="text-2xl md:text-4xl font-semibold text-white leading-relaxed tracking-wide -mt-8 mb-8">
          Education is not just preparation for life —{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
            it is life itself.
          </span>
        </blockquote>

        {/* Attribution */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-indigo-400/50" />
          <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">
            Wise East University — Est. 1924
          </p>
          <div className="h-px w-12 bg-indigo-400/50" />
        </div>
      </div>
    </section>
  );
}