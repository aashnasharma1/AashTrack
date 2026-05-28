import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TaskProvider } from '@/context/TaskContext';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TaskFlow — Personal Task Manager',
  description: 'A clean, minimal task management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TaskProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
              <Header />
              <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                {children}
              </main>
            </div>
            <Toaster richColors position="top-right" />
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
