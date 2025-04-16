'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  FileText,
  Video,
  Book,
  Settings,
  Menu,
  X,
  Briefcase,
} from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: 'Job Search',
    href: '/dashboard/jobs',
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: 'Saved Jobs',
    href: '/dashboard/jobs/saved',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    title: 'Resume Builder',
    href: '/dashboard/resume',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: 'Mock Interviews',
    href: '/dashboard/interview',
    icon: <Video className="h-5 w-5" />,
  },
  {
    title: 'Skill Development',
    href: '/dashboard/skills',
    icon: <Book className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-indigo-600 p-2 text-white md:hidden"
        title="Open mobile menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 transform bg-white transition-transform duration-300 ease-in-out dark:bg-gray-900 md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">JobGenie</div>
          <button onClick={() => setMobileNavOpen(false)} title="Close mobile menu" aria-label="Close mobile menu">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">JobGenie</div>
        </div>
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
