import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Wise East University",
  description:
    "Learn about Wise East University's history, mission, values, and the leadership team shaping the future of education.",
};

const values = [
  {
    icon: "🎓",
    title: "Academic Excellence",
    description:
      "We uphold the highest standards of scholarship, encouraging critical thinking, rigorous inquiry, and intellectual curiosity in every discipline.",
  },
  {
    icon: "🌍",
    title: "Inclusivity & Diversity",
    description:
      "Our campus is a vibrant community of students and faculty from across the globe, united by a shared commitment to learning and mutual respect.",
  },
  {
    icon: "🔬",
    title: "Innovation & Research",
    description:
      "We foster a culture of discovery, equipping students and researchers with the tools to tackle real-world challenges and drive meaningful change.",
  },
  {
    icon: "🤝",
    title: "Integrity & Service",
    description:
      "We believe in leading with honesty and giving back. Our graduates are trained not just to succeed, but to serve their communities with purpose.",
  },
];

const leaders = [
  {
    name: "Prof. Amara Nkosi",
    title: "Vice-Chancellor",
    description:
      "Prof. Nkosi brings over 30 years of academic leadership, specializing in educational policy and institutional transformation.",
  },
  {
    name: "Dr. Lena Hartmann",
    title: "Dean of Academic Affairs",
    description:
      "Dr. Hartmann oversees curriculum development and faculty excellence across all schools and faculties.",
  },
  {
    name: "Mr. James Okafor",
    title: "Registrar",
    description:
      "Mr. Okafor manages student records, admissions coordination, and academic scheduling university-wide.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Wise East University
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            About Our University
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            For over a century, Wise East University has been a beacon of
            knowledge, integrity, and innovation — shaping leaders who make a
            difference in the world.
          </p>
          <div className="mt-10 h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
        </div>
      </section>

      {/* ── Mission & History Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-snug">
                A Legacy of Excellence Since 1924
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Founded in 1924, Wise East University began as a small teachers&apos;
                college in the heart of the region. Over the decades, it has
                grown into a comprehensive research university with 12 faculties,
                over 200 undergraduate and postgraduate programmes, and a
                community of more than 30,000 students.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Our journey has been defined by a relentless pursuit of
                knowledge. From pioneering research in medicine and engineering
                to advancing the arts and humanities, our institution has
                continuously evolved to meet the needs of society.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Today, Wise East University stands among the top-ranked
                institutions in the region, recognized for its world-class
                faculty, state-of-the-art facilities, and an unwavering
                dedication to student success.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { stat: "100+", label: "Years of Excellence" },
                { stat: "30K+", label: "Active Students" },
                { stat: "200+", label: "Programmes Offered" },
                { stat: "12", label: "Faculties & Schools" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-slate-900 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-lg"
                >
                  <span className="text-4xl font-extrabold text-white mb-2">
                    {item.stat}
                  </span>
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values Section ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              What We Stand For
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              These principles guide everything we do — from how we teach and
              research, to how we welcome every student through our doors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Leadership
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Meet Our Leadership Team
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Our dedicated leadership team brings decades of experience to
              guide Wise East University toward a brighter academic future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader) => (
              <div
                key={leader.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-8 hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold mb-5">
                  {leader.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {leader.name}
                </h3>
                <p className="text-indigo-600 text-sm font-semibold mb-4">
                  {leader.title}
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {leader.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
