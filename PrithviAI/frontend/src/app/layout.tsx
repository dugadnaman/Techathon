import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/providers/ThemeProvider';
import SmoothScrollProvider from '@/components/providers/SmoothScroll';
import CursorGlow from '@/components/CursorGlow';

export const metadata: Metadata = {
  title: 'Prithvi — Environmental Safety for Seniors',
  description:
    'AI-driven environmental intelligence platform that transforms environmental data into simple, actionable safety guidance for senior citizens.',
  keywords: ['environment', 'safety', 'seniors', 'air quality', 'health', 'AI'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-surface-primary text-content-primary">
        <ThemeProvider>
          <SmoothScrollProvider>
            <CursorGlow />
            {children}
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
