'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import lightLogo from '@/app/public/images/logo_light.png';
import darkLogo from '@/app/public/images/logo_dark.png';
import { ThemeToggle } from './ThemeToggle';

function usePageTitle(): string {
  const pathname = usePathname();
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/collections') return 'Collections';
  if (/^\/collections\/[^/]+$/.test(pathname)) return 'Collection';
  return 'AashTrack';
}

export function Header() {
  const title = usePageTitle();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 sm:px-6">
      {/* Logo */}
      <div className="flex items-center">
        {mounted ? (
          <Image
            src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
            alt="AashTrack"
            width={140}
            height={40}
            className="h-auto w-[110px] sm:w-[130px] md:w-[140px]"
            priority
          />
        ) : (
          /* Placeholder prevents layout shift before mount */
          <div className="h-8 w-[110px] sm:w-[130px] md:w-[140px]" />
        )}
      </div>

      {/* Mobile page title (sidebar hidden on mobile) */}
      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 md:hidden">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {pathname === '/' && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('aashtrack:start-tour'))}
            aria-label="Restart onboarding tour"
            title="Take a tour"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <MapPin className="h-4 w-4" />
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
