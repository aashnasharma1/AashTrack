'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

// Derive a readable page title from the pathname
function usePageTitle(): string {
  const pathname = usePathname();
  if (pathname === '/') return 'My Tasks';
  if (pathname === '/projects') return 'Projects';
  if (/^\/projects\/[^/]+$/.test(pathname)) return 'Project';
  if (/^\/projects\/[^/]+\/modules\/[^/]+$/.test(pathname)) return 'Module';
  return 'AashTrack';
}

export function Header() {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 sm:px-6">
      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 md:hidden">{title}</h1>
      {/* On md+ the sidebar shows the brand; header just holds the theme toggle */}
      <span className="hidden md:block" />
      <ThemeToggle />
    </header>
  );
}
