/**
 * PrithviAI — Locale Middleware
 * Detects user locale and applies URL prefix routing.
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files (files with extensions like .png, .ico, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
