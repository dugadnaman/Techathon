import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
