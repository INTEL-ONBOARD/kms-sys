import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    /* Sticky header with full width background */
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center">
          <Image 
            src="/logo2.png" 
            alt="Wise East University Logo" 
            width={50} 
            height={50} 
            className="object-contain"
          />
          <span className="font-bold text-sm tracking-wide mt-1 uppercase text-black">
            Wise East University
          </span>
        </div>

        {/* Navigation Links & Login Button Wrapper */}
        <div className="hidden md:flex items-center gap-8">
          
          <nav className="flex gap-8 text-sm font-medium">
            <Link href="/" className="font-bold text-black">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-black transition">
              about
            </Link>
            <Link href="/academics" className="text-gray-700 hover:text-black transition">
              Academics
            </Link>
            <Link href="/campus" className="text-gray-700 hover:text-black transition">
              Campus
            </Link>
            <Link href="/admission" className="text-gray-700 hover:text-black transition">
              Admission
            </Link>
          </nav>

          {/* Login Button */}
          <Link href="/login">
            <button className="bg-black text-white px-6 py-2 text-sm font-medium rounded hover:bg-gray-800 transition duration-300">
              Log In
            </button>
          </Link>
          
        </div>

      </div>
    </header>
  );
}