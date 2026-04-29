export default function FacultiesSection() {
  return (
    /* Section with a very light blue/gray background */
    <section className="py-20 px-8 bg-[#f4f7fb] text-center">
      <div className="max-w-6xl mx-auto">
        {/* Section title with an underline effect */}
        <h2 className="text-2xl font-semibold mb-16 border-b border-black inline-block pb-2">
          School & Faculties
        </h2>
        
        {/* Grid layout for the three faculties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Faculty 1: Business */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2">School of Business</h3>
            <p className="text-xs text-gray-600 mb-6">Leadership, finance, and global strategy.</p>
            {/* Downward arrow icon container */}
            <div className="w-8 h-8 border border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
              <span className="text-gray-500 text-sm">↓</span>
            </div>
          </div>

          {/* Faculty 2: Computing */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2">School of Computing</h3>
            <p className="text-xs text-gray-600 mb-6">AI, software engineering, and data science.</p>
            <div className="w-8 h-8 border border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
              <span className="text-gray-500 text-sm">↓</span>
            </div>
          </div>

          {/* Faculty 3: Creative Arts */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2">School of Creative Arts</h3>
            <p className="text-xs text-gray-600 mb-6">Design, media, and digital storytelling.</p>
            <div className="w-8 h-8 border border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
              <span className="text-gray-500 text-sm">↓</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}