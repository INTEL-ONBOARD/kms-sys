import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus Life | Wise East University",
  description:
    "Discover the vibrant campus life at Wise East University — from modern facilities and student clubs to sports, health services, and residential life.",
};

const facilities = [
  {
    icon: "📖",
    title: "Central Library",
    description:
      "Our library houses over 500,000 volumes, digital databases, private study rooms, and 24/7 access to online academic journals.",
  },
  {
    icon: "🏋️",
    title: "Sports & Recreation Centre",
    description:
      "A fully equipped gymnasium, Olympic-size swimming pool, indoor courts, and athletics tracks serve our active student community.",
  },
  {
    icon: "🧪",
    title: "Research Laboratories",
    description:
      "State-of-the-art labs equipped with cutting-edge instruments support research in science, engineering, medicine, and technology.",
  },
  {
    icon: "🍽️",
    title: "Student Dining Hall",
    description:
      "Multiple dining outlets across campus offer diverse, nutritious meal options catering to all dietary preferences and budgets.",
  },
  {
    icon: "🏥",
    title: "Health & Wellness Centre",
    description:
      "On-campus medical and counselling services provide comprehensive physical and mental health support to all enrolled students.",
  },
  {
    icon: "💻",
    title: "Technology Hub",
    description:
      "High-speed campus-wide Wi-Fi, computer labs, and makerspaces are available to support your digital learning and innovation.",
  },
];

const clubs = [
  { name: "Debate Society", members: "120+", category: "Academic" },
  { name: "Robotics Club", members: "85+", category: "STEM" },
  { name: "Drama & Theatre", members: "60+", category: "Arts" },
  { name: "Environmental Action", members: "140+", category: "Community" },
  { name: "Entrepreneurship Hub", members: "200+", category: "Business" },
  { name: "Photography Guild", members: "75+", category: "Arts" },
  { name: "Chess & Strategy", members: "50+", category: "Academic" },
  { name: "Cultural Dance Ensemble", members: "90+", category: "Culture" },
];

export default function CampusPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Campus Life
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            A Campus That Inspires
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Life at Wise East University extends far beyond the classroom.
            Experience a thriving campus community with world-class facilities,
            diverse student clubs, and a culture that celebrates growth.
          </p>
          <div className="mt-10 h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
        </div>
      </section>

      {/* ── Facilities Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Infrastructure
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              World-Class Facilities
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Our campus is built to support every dimension of student life —
              academic, athletic, social, and personal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility) => (
              <div
                key={facility.title}
                className="group bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:bg-slate-900 hover:border-slate-900 transition-all duration-300 cursor-default"
              >
                <div className="text-4xl mb-4">{facility.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                  {facility.title}
                </h3>
                <p className="text-slate-500 group-hover:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Residential Life Banner ── */}
      <section className="bg-indigo-700 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-indigo-600 text-indigo-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Accommodation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-snug">
              Comfortable & Safe Student Housing
            </h2>
            <p className="text-indigo-200 leading-relaxed text-base">
              Our on-campus residences provide a safe, comfortable, and
              supportive living environment for students. With furnished rooms,
              high-speed internet, 24/7 security, and communal spaces designed
              for collaboration, our halls of residence are a home away from home.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { stat: "8", label: "Halls of Residence" },
              { stat: "5,000+", label: "Bed Spaces" },
              { stat: "24/7", label: "Campus Security" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-indigo-800 rounded-2xl p-6 flex flex-col items-center"
              >
                <span className="text-3xl font-extrabold text-white mb-1">
                  {item.stat}
                </span>
                <span className="text-indigo-300 text-xs font-medium uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Student Clubs Section ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Student Life
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Clubs & Student Organisations
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              With over 60 active student organisations, there is something for
              everyone. Find your passion, build your network, and make
              memories that last a lifetime.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {clubs.map((club) => (
              <div
                key={club.name}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  {club.category}
                </span>
                <h3 className="text-slate-900 font-bold mt-2 mb-1 text-sm">
                  {club.name}
                </h3>
                <p className="text-slate-400 text-xs font-medium">
                  {club.members} members
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
