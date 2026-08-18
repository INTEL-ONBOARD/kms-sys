import Link from 'next/link';

const faculties = [
  {
    icon: '💼',
    name: 'School of Business',
    description: 'Master leadership, global strategy, finance, and entrepreneurship in a dynamic learning environment.',
    tags: ['MBA', 'Finance', 'Strategy'],
    href: '/academics',
  },
  {
    icon: '💻',
    name: 'School of Computing',
    description: 'Dive deep into AI, machine learning, software engineering, cybersecurity, and data science.',
    tags: ['AI', 'Software Eng', 'Data Science'],
    href: '/academics',
  },
  {
    icon: '🎨',
    name: 'School of Creative Arts',
    description: 'Blend creativity and technology through design, media production, and digital storytelling.',
    tags: ['Design', 'Media', 'Storytelling'],
    href: '/academics',
  },
  {
    icon: '⚕️',
    name: 'School of Medicine',
    description: 'Train to save lives through world-class clinical education, research, and healthcare innovation.',
    tags: ['MBBS', 'Nursing', 'Public Health'],
    href: '/academics',
  },
  {
    icon: '⚖️',
    name: 'School of Law',
    description: 'Develop your legal reasoning, advocacy skills, and understanding of justice on a global scale.',
    tags: ['LLB', 'International Law', 'Human Rights'],
    href: '/academics',
  },
  {
    icon: '🔭',
    name: 'School of Natural Sciences',
    description: 'Uncover the fundamental laws of the universe through physics, chemistry, biology, and mathematics.',
    tags: ['Physics', 'Chemistry', 'Biology'],
    href: '/academics',
  },
];

export default function FacultiesSection() {
  return (
    <section className="py-24 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Academic Programmes
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Schools &amp; Faculties
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Explore our world-class schools, each designed to equip you with
            the knowledge and skills that matter most.
          </p>
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {faculties.map((faculty) => (
            <Link key={faculty.name} href={faculty.href}>
              <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm cursor-pointer
                transition-all duration-300 ease-out
                hover:-translate-y-2 hover:shadow-xl hover:border-slate-300
                overflow-hidden">

                {/* Navy top accent bar revealed on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {faculty.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {faculty.name}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {faculty.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {faculty.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow link */}
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 group-hover:gap-3 transition-all duration-300">
                  <span>Learn more</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}