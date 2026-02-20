/**
 * PrithviAI — i18n Configuration
 * Defines all supported locales for the application.
 */

export const locales = [
  'en',   // English
  'hi',   // Hindi
  'mr',   // Marathi
  'bn',   // Bengali
  'ta',   // Tamil
  'te',   // Telugu
  'kn',   // Kannada
  'ml',   // Malayalam
  'gu',   // Gujarati
  'pa',   // Punjabi
  'or',   // Odia
  'as',   // Assamese
  'ur',   // Urdu
  'gom',  // Konkani (Goan)
  'mni',  // Manipuri
  'brx',  // Bodo
  'sa',   // Sanskrit
  'ne',   // Nepali
  'mai',  // Maithili
  'sat',  // Santali
  'doi',  // Dogri
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
