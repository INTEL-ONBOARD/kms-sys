const pillars = [
  {
    icon: '🏆',
    title: 'Academic Rigour',
    description: 'Our programmes are designed to challenge and inspire, built on decades of scholarly tradition.',
  },
  {
    icon: '🌍',
    title: 'Global Perspective',
    description: 'A diverse, international community that prepares you for success in a connected world.',
  },
  {
    icon: '🔬',
    title: 'Research & Innovation',
    description: 'Cutting-edge labs, interdisciplinary research, and industry partnerships drive real-world impact.',
  },
  {
    icon: '🤝',
    title: 'Career Ready',
    description: 'A 95% employment rate backed by mentorship, internships, and a powerful alumni network.',
  },
];

export default function WhySection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Why{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
              Wise East
            </span>
            ?
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Rooted in tradition and driven by innovation, Wise East University offers
            a transformative education experience that blends academic rigour with
            real-world impact.
          </p>
        </div>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group bg-slate-50 border border-slate-100 rounded-2xl p-8
                transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-slate-900 hover:border-slate-900"
            >
              <div className="text-4xl mb-5">{pillar.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                {pillar.title}
              </h3>
              <p className="text-slate-500 group-hover:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}