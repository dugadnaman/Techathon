import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prithvi — Environmental Safety for Seniors',
  description:
    'AI-driven environmental intelligence platform that transforms environmental data into simple, actionable safety guidance for senior citizens.',
  keywords: ['environment', 'safety', 'seniors', 'air quality', 'health', 'AI'],
};

/**
 * Root layout — minimal passthrough.
 * The real html/body + providers live in [locale]/layout.tsx
 * so next-intl can inject the correct <html lang="...">
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
