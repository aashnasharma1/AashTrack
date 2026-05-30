import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TaskProvider } from '@/context/TaskContext';
import { TimerProvider } from '@/context/TimerContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AashTrack — Personal Task Manager',
  description: 'A clean, minimal task management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TaskProvider>
            <TimerProvider>
              <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                  <div className="hidden md:flex md:shrink-0">
                    <Sidebar />
                  </div>
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 overflow-y-auto px-4 py-5 focus:outline-none sm:px-6"
                  >
                    <div className="mx-auto max-w-6xl">{children}</div>
                  </main>
                </div>
              </div>
              <Toaster richColors position="top-right" />
              <OnboardingTour />
            </TimerProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
