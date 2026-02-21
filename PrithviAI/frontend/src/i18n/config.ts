/**
 * PrithviAI — i18n Configuration
 * Defines all supported locales for the application.
 */

export const locales = [
  'en',   // English
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
