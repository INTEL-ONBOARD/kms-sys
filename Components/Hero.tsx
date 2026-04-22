import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-[80vh] flex items-center justify-center text-center text-white">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-black">
        <Image
          src="/hero.png"
          alt="University Campus Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-wide mb-1">
          A Tradition of Excellence
        </h1>
        <p className="text-4xl md:text-3xl font-extralight mb-8">
          Shaping Leaders, Advancing Knowledge and Inspiring Generations
        </p>
        <Link href="/academics">
          <button className="group relative overflow-hidden border border-white px-8 py-3 text-sm uppercase tracking-wide text-white transition-colors duration-300 hover:text-black">
            {/* The white background that slides in from left to right on hover */}
            <span className="absolute inset-0 w-full h-full -translate-x-full bg-white transition-transform duration-300 ease-out group-hover:translate-x-0"></span>
            <span className="relative z-10">Explore Academics</span>
          </button>
        </Link>
      </div>
    </section>
  );
}