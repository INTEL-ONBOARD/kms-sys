import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Academics | Wise East University",
  description:
    "Explore Wise East University's academic programmes, faculties, and research opportunities across undergraduate and postgraduate levels.",
};

const faculties = [
  {
    icon: "⚕️",
    name: "Faculty of Medicine & Health Sciences",
    programmes: ["MBBS", "Nursing", "Pharmacy", "Public Health"],
  },
  {
    icon: "⚙️",
    name: "Faculty of Engineering & Technology",
    programmes: ["Civil Engineering", "Computer Engineering", "Mechanical", "Electrical"],
  },
  {
    icon: "💼",
    name: "Faculty of Business & Management",
    programmes: ["BBA", "MBA", "Accounting", "Finance"],
  },
  {
    icon: "⚖️",
    name: "Faculty of Law & Social Sciences",
    programmes: ["LLB", "Political Science", "Sociology", "International Relations"],
  },
  {
    icon: "🎨",
    name: "Faculty of Arts & Humanities",
    programmes: ["Literature", "History", "Philosophy", "Fine Arts"],
  },
  {
    icon: "🔭",
    name: "Faculty of Natural Sciences",
    programmes: ["Physics", "Chemistry", "Biology", "Mathematics"],
  },
];

const highlights = [
  {
    icon: "📚",
    title: "200+ Programmes",
    description: "Choose from a wide range of undergraduate, postgraduate, and doctoral programmes across 12 faculties.",
  },
  {
    icon: "🏆",
    title: "World-Class Faculty",
    description: "Learn from over 800 distinguished academics and industry practitioners with real-world expertise.",
  },
  {
    icon: "💻",
    title: "Blended Learning",
    description: "Access course materials, assignments, and live lectures through our modern Learning Management System.",
  },
  {
    icon: "🔗",
    title: "Industry Partnerships",
    description: "Benefit from partnerships with over 150 leading companies offering internships, mentorship, and placements.",
  },
];

export default function AcademicsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Academics
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            World-Class Education,{" "}
            <span className="text-indigo-400">Infinite Possibilities</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            From foundational undergraduate degrees to cutting-edge doctoral
            research, our academic programmes are designed to prepare you for
            a rapidly evolving world.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admission"
              className="inline-block bg-white text-slate-900 font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors duration-200"
            >
              Apply Now
            </Link>
            <Link
              href="/about"
              className="inline-block border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-slate-900 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Academic Highlights Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Why Study Here
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              The WEU Academic Advantage
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              We combine academic rigour with practical experience to produce
              graduates who are not just job-ready, but future-ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Faculties Section ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Our Faculties
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Schools & Faculties
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Explore our diverse range of faculties, each home to dedicated
              researchers and educators committed to advancing knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faculties.map((faculty) => (
              <div
                key={faculty.name}
                className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm
                  transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-slate-300 overflow-hidden"
              >
                {/* Navy top accent bar revealed on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {faculty.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {faculty.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {faculty.programmes.map((prog) => (
                    <span
                      key={prog}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {prog}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
