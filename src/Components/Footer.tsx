import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 py-12 px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Column 1: About */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Wise East University</h3>
          <p className="text-sm leading-relaxed pr-4">
            Empowering minds and shaping the future through quality education and innovation.
          </p>
        </div>

        {/* Column 2: Services */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Services</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/help" className="hover:text-white transition duration-300">Help Center</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition duration-300">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition duration-300">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund" className="hover:text-white transition duration-300">Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li>Colombo, Sri Lanka</li>
            <li>Email: info@wiseeast.edu</li>
            <li>Phone: +94 77 123 4567</li>
          </ul>
        </div>

        {/* Column 4: Quick Links */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition duration-300">Home</Link>
            </li>
            <li>
              <Link href="/academics" className="hover:text-white transition duration-300">Courses</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition duration-300">About Us</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition duration-300">Contact</Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition duration-300">FAQ</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="max-w-7xl mx-auto border-t border-slate-700 pt-6 text-center text-xs text-slate-400">
        <p>© Wise East University</p>
        <p className="mt-1">© 2025 Toursurv (Pvt) Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}