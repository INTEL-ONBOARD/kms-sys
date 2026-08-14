import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admissions | Wise East University",
  description:
    "Begin your journey at Wise East University. Explore entry requirements, application steps, key dates, and scholarship opportunities.",
};

const steps = [
  {
    step: "01",
    title: "Choose Your Programme",
    description:
      "Browse our catalogue of 200+ undergraduate and postgraduate programmes across 12 faculties. Find the one that aligns with your passion and career goals.",
  },
  {
    step: "02",
    title: "Check Entry Requirements",
    description:
      "Review the minimum academic qualifications, language proficiency requirements, and any supporting documents required for your chosen programme.",
  },
  {
    step: "03",
    title: "Submit Your Application",
    description:
      "Complete the online application form, upload your certified documents, and pay the non-refundable application fee to submit your application.",
  },
  {
    step: "04",
    title: "Await Your Admission Letter",
    description:
      "Our admissions team will review your application and contact you with a decision. Successful applicants will receive an official offer letter.",
  },
  {
    step: "05",
    title: "Accept & Enrol",
    description:
      "Accept your offer, pay your acceptance deposit, and complete the enrollment process through our student portal to secure your place.",
  },
];

const requirements = [
  {
    level: "Undergraduate",
    icon: "🎓",
    items: [
      "Minimum 5 passes at WASSCE/IGCSE level including English and Mathematics",
      "At least 3 passes at A-Level or equivalent",
      "Completed university application form",
      "Certified copies of academic certificates",
      "Two letters of recommendation",
      "Personal statement (500–800 words)",
    ],
  },
  {
    level: "Postgraduate",
    icon: "🔬",
    items: [
      "A first degree (minimum Second Class Lower) from a recognised university",
      "Relevant work experience (for professional programmes)",
      "Certified academic transcripts",
      "Updated Curriculum Vitae (CV)",
      "Two academic or professional references",
      "Statement of purpose (600–1000 words)",
    ],
  },
];

const dates = [
  { date: "January 15", event: "Applications Open — Academic Year 2025/2026" },
  { date: "March 31", event: "Early Application Deadline (Scholarship Consideration)" },
  { date: "June 30", event: "Regular Application Deadline" },
  { date: "August 1", event: "Admission Letters Dispatched" },
  { date: "August 20", event: "Acceptance & Deposit Deadline" },
  { date: "September 8", event: "Orientation Week & Academic Year Commences" },
];

export default function AdmissionPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Admissions
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Journey Begins Here
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Wise East University welcomes driven, curious, and passionate
            individuals. Take the first step toward a transformative academic
            experience.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-indigo-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-600 transition-colors duration-200"
            >
              Apply Now
            </Link>
            <Link
              href="/academics"
              className="inline-block border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-slate-900 transition-colors duration-200"
            >
              Browse Programmes
            </Link>
          </div>
        </div>
      </section>

      {/* ── How to Apply Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Application Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How to Apply
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Our streamlined application process is designed to be simple and
              transparent. Follow these steps to begin your journey.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line for desktop */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

            <div className="space-y-10">
              {steps.map((item, index) => (
                <div
                  key={item.step}
                  className={`flex flex-col lg:flex-row gap-8 items-start lg:items-center ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Text Side */}
                  <div className="lg:w-5/12">
                    <div
                      className={`bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-md transition-shadow duration-300 ${
                        index % 2 === 1 ? "lg:text-right" : ""
                      }`}
                    >
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Step Number (Center) */}
                  <div className="hidden lg:flex lg:w-2/12 justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg font-extrabold z-10 shadow-lg">
                      {item.step}
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden lg:block lg:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Entry Requirements Section ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Requirements
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Entry Requirements
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              General requirements are listed below. Programme-specific
              requirements may apply — consult the relevant faculty for details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {requirements.map((req) => (
              <div
                key={req.level}
                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl">{req.icon}</span>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {req.level}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {req.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-slate-600 text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Dates Section ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Important Dates
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Key Admission Dates
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Stay on track with these important dates for the 2025/2026
              academic year. Missing a deadline may affect your application.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {dates.map((item, index) => (
              <div
                key={item.date}
                className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-indigo-600 text-sm font-bold mb-1">
                    {item.date}
                  </p>
                  <p className="text-slate-800 font-medium text-sm">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Join Wise East University?
          </h2>
          <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Create your applicant account, start your application, and take the
            first step toward an extraordinary future.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-indigo-500 text-white font-bold px-10 py-4 rounded-lg text-lg hover:bg-indigo-600 transition-colors duration-200"
          >
            Start Your Application
          </Link>
        </div>
      </section>
    </main>
  );
}
