"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiUsers, 
  FiShield, 
  FiSettings, 
  FiBookOpen
} from 'react-icons/fi';

export default function AdminSidebar() {
  // Get the current route path to highlight the active menu item
  const pathname = usePathname();

  // Define Admin Navigation Links based on the provided design
  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: <FiHome className="mr-4 text-xl" /> },
    { name: 'User Admin', href: '/admin/users', icon: <FiUsers className="mr-4 text-xl" /> },
    { name: 'Moderation', href: '/admin/moderation', icon: <FiShield className="mr-4 text-xl" /> },
    { name: 'Courses', href: '/admin/courses', icon: <FiBookOpen className="mr-4 text-xl" /> },
    { name: 'Settings', href: '/admin/settings', icon: <FiSettings className="mr-4 text-xl" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20 h-screen sticky top-0">
      
      {/* University Logo Area - Matched with Student Sidebar Design */}
      <div className="p-8 flex flex-col items-center mb-2 mt-2">
        <Image 
          src="/logo2.png" 
          alt="Wise East University Logo" 
          width={45} 
          height={45} 
          className="object-contain mb-3"
        />
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#2D3748] text-center">
          Wise East<br/>University
        </h2>
      </div>
      
      {/* Navigation Menu */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        
        {/* Administration Section Header */}
        <p className="text-xs font-extrabold text-[#A0AEC0] uppercase tracking-wider mb-4 px-4">
          Administration
        </p>

        <nav className="space-y-1">
          {adminLinks.map((link) => {
            // Check if the current path matches the link to apply active styles
            
            const isActive = link.href === '/admin' 
              ? pathname === '/admin' 
              : pathname.startsWith(link.href);
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl transition ${
                  isActive 
                    ? 'bg-[#EEF2FF] text-[#5A67D8] font-bold' // Active Styles
                    : 'text-[#A0AEC0] hover:text-[#5A67D8] hover:bg-[#F7FAFC] font-medium' // Inactive Styles
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Log out is now moved to Header Dropdown to match Student Sidebar */}
      <div className="p-6 mt-auto"></div>
    </aside>
  );
}