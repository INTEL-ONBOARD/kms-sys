export default function CTASection() {
  return (
    /* Call to action section for application */
    <section className="py-20 px-8 bg-white text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-black">Begin Your Journey</h2>
        {/* Apply Now button with hover effect */}
        <button className="group relative overflow-hidden bg-[#424242] px-10 py-3 text-sm font-medium text-white transition-colors duration-300">
          {/* The black background that slides in from left to right on hover */}
          <span className="absolute inset-0 w-full h-full -translate-x-full bg-black transition-transform duration-300 ease-out group-hover:translate-x-0"></span>
          <span className="relative z-10">Apply Now</span>
        </button>
      </div>
    </section>
  );
}