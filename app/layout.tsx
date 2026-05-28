import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TaskProvider } from '@/context/TaskContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
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
        <ThemeProvider attribute="class" defaultTheme="light">
          <TaskProvider>
            <ProjectProvider>
              <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                  <div className="hidden md:flex md:shrink-0">
                    <Sidebar />
                  </div>
                  <main
                    id="main-content"
                    className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8"
                  >
                    <div className="mx-auto max-w-4xl">{children}</div>
                  </main>
                </div>
              </div>
              <Toaster richColors position="top-right" />
            </ProjectProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
