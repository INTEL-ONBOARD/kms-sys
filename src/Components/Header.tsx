"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const hiddenRoutes = [
  // Dashboard / protected routes
  '/student', '/admin', '/lecturer', '/profile',
  '/courses', '/grades', '/assignments', '/calendar', '/enrollments',
  // Authentication routes
  '/login', '/signup', '/forgot-password', '/reset-password', '/activate',
];

const navLinks = [
  { href: '/',          label: 'Home'      },
  { href: '/about',     label: 'About'     },
  { href: '/academics', label: 'Academics' },
  { href: '/campus',    label: 'Campus'    },
  { href: '/admission', label: 'Admission' },
];

export default function Header() {
  const pathname = usePathname();

  // Hide the public header on all dashboard / protected routes
  if (hiddenRoutes.some((route) => pathname.startsWith(route))) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo Section */}
        <Link href="/" className="flex flex-col items-center justify-center">
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
        </Link>

        {/* Navigation Links & Auth Buttons Wrapper */}
        <div className="hidden md:flex items-center gap-8">

          <nav className="flex gap-8 text-sm">
            {navLinks.map(({ href, label }) => {
              // Exact match for home, prefix match for all other routes
              const isActive =
                href === '/' ? pathname === '/' : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'font-bold text-slate-900'
                      : 'font-normal text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Authentication Buttons (Log In & Sign Up) */}
          <div className="flex items-center gap-4">
            {/* Log In Button - Outlined style */}
            <Link href="/login">
              <button className="border border-gray-300 text-black px-6 py-2 text-sm font-medium rounded hover:bg-gray-50 transition duration-300">
                Log In
              </button>
            </Link>

            {/* Sign Up Button - Solid black style */}
            <Link href="/signup">
              <button className="bg-black text-white px-6 py-2 text-sm font-medium rounded hover:bg-gray-800 transition duration-300">
                Sign Up
              </button>
            </Link>
          </div>

        </div>

      </div>
    </header>
  );
}