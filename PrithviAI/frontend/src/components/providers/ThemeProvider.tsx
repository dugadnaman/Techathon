'use client';

/**
 * Prithvi — Theme Provider
 * Wraps the app in next-themes for dark/light mode support.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
