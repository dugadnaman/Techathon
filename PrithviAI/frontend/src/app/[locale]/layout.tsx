import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import ThemeProvider from '@/components/providers/ThemeProvider';
import SmoothScrollProvider from '@/components/providers/SmoothScroll';
import CursorGlow from '@/components/CursorGlow';

/**
 * Generate all locale params at build time for static generation.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  // Enable static rendering for this locale
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-surface-primary text-content-primary">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SmoothScrollProvider>
              <CursorGlow />
              {children}
            </SmoothScrollProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
