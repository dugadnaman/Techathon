/**
 * PrithviAI — Translation Compatibility Layer
 * Provides backward-compatible t(key, language) and tRisk(level, language)
 * functions that read from the JSON message files.
 *
 * For new components, prefer using useTranslations() from next-intl directly.
 */

import en from '../../messages/en.json';
import hi from '../../messages/hi.json';
import mr from '../../messages/mr.json';
import bn from '../../messages/bn.json';
import ta from '../../messages/ta.json';
import te from '../../messages/te.json';
import kn from '../../messages/kn.json';
import ml from '../../messages/ml.json';
import gu from '../../messages/gu.json';
import pa from '../../messages/pa.json';
import or_msg from '../../messages/or.json';
import as_msg from '../../messages/as.json';
import ur from '../../messages/ur.json';
import gom from '../../messages/gom.json';
import mni from '../../messages/mni.json';
import brx from '../../messages/brx.json';
import sa from '../../messages/sa.json';
import ne from '../../messages/ne.json';
import mai from '../../messages/mai.json';
import sat from '../../messages/sat.json';
import doi from '../../messages/doi.json';

const allMessages: Record<string, any> = {
  en, hi, mr, bn, ta, te, kn, ml, gu, pa,
  or: or_msg, as: as_msg, ur, gom, mni, brx, sa, ne, mai, sat, doi,
};

/** Resolve a dot-separated path in a nested object */
function resolve(obj: any, path: string): string {
  const result = path.split('.').reduce((o: any, k: string) => o?.[k], obj);
  return typeof result === 'string' ? result : path;
}

/**
 * Map old flat translation keys → new namespaced keys.
 * Existing components use t('tagline', language) → common.tagline
 */
const FLAT_KEY_MAP: Record<string, string> = {
  appName: 'common.appName',
  tagline: 'common.tagline',
  footer: 'common.footer',
  disclaimer: 'common.disclaimer',
  environmentalIntelligence: 'common.environmentalIntelligence',
  liveEnvironmentData: 'common.liveEnvironmentData',
  seniorCitizen: 'common.seniorCitizen',
  adult: 'common.adult',
  walking: 'common.walking',
  resting: 'common.resting',
  exercise: 'common.exercise',
  outdoorWork: 'common.outdoorWork',
  commuting: 'common.commuting',
  refresh: 'common.refresh',
  detectLocation: 'common.detectLocation',
  loading: 'common.loading',

  // Navbar
  navHome: 'navbar.home',
  navMapExplorer: 'navbar.mapExplorer',
  navAIChat: 'navbar.aiChat',
  navDashboard: 'navbar.dashboard',

  // Environment
  temperature: 'environment.temperature',
  feelsLike: 'environment.feelsLike',
  airQuality: 'environment.airQuality',
  humidity: 'environment.humidity',
  uvIndex: 'environment.uvIndex',
  rainfall: 'environment.rainfall',
  noise: 'environment.noise',
  wind: 'environment.wind',
  visibility: 'environment.visibility',
  aqi: 'environment.aqi',
  environmentSnapshot: 'environment.snapshot',
  thermalComfort: 'environment.thermalComfort',
  uvExposure: 'environment.uvExposure',
  floodRisk: 'environment.floodRisk',
  noisePollution: 'environment.noisePollution',

  // Safety
  seniorSafetyIndex: 'safety.index',
  safetyIndex: 'safety.safetyIndex',
  realtimeSafetyAssessment: 'safety.assessment',
  keyConcerns: 'safety.keyConcerns',
  whatToDo: 'safety.whatToDo',

  // Chat
  chatAssistant: 'chat.assistant',
  chatSubtitle: 'chat.subtitle',
  chatWelcome: 'chat.welcome',
  chatPlaceholder: 'chat.placeholder',
  typeMessage: 'chat.typeMessage',

  // Daily
  morning: 'daily.morning',
  afternoon: 'daily.afternoon',
  evening: 'daily.evening',
  dailySafetyGuide: 'daily.guide',
  dailySummary: 'daily.summary',
  forecastAlerts: 'daily.forecastAlerts',
  recommendations: 'daily.recommendations',
  alerts: 'daily.alerts',

  // Risk
  detailedRiskAnalysis: 'risk.detailedAnalysis',
  riskScore: 'risk.score',
  topConcern: 'risk.topConcern',
  riskFactorBreakdown: 'risk.breakdown',
  riskLow: 'risk.low',
  riskModerate: 'risk.moderate',
  riskHigh: 'risk.high',
  riskDistribution: 'risk.distribution',

  // Dashboard
  environmentalDashboard: 'dashboard.title',
  areaWiseMonitoring: 'dashboard.areaMonitoring',
  areaWiseSafetyStatus: 'dashboard.safetyStatus',
  aqiTrend: 'dashboard.aqiTrend',
  tempTrend: 'dashboard.tempTrend',
  safetyScoreHistory: 'dashboard.safetyHistory',
  dashboardFooter: 'dashboard.footer',
  historicalTrends: 'dashboard.historicalTrends',

  // Explore
  mapExplorerTitle: 'explore.title',
  clickMapToExplore: 'explore.clickToExplore',
  searchLocations: 'explore.searchLocations',
  data: 'explore.data',
  quick: 'explore.quick',
  loadingMap: 'explore.loadingMap',
  closeSidebar: 'explore.closeSidebar',
  openSidebar: 'explore.openSidebar',
  failedLocationData: 'explore.failedLocationData',
  quickAdvisory: 'daily.quickAdvisory',
  analysisLoading: 'daily.analysisLoading',
};

/**
 * Get translated string for a key and language.
 * Falls back to English if translation not found.
 */
export function t(key: string, lang: string = 'en'): string {
  const msgs = allMessages[lang] || allMessages.en;
  const namespacedKey = FLAT_KEY_MAP[key] || key;
  const result = resolve(msgs, namespacedKey);
  // If the key wasn't found in target language, fall back to English
  if (result === namespacedKey && lang !== 'en') {
    return resolve(allMessages.en, namespacedKey);
  }
  return result;
}

/**
 * Translate string with placeholder replacements, e.g. "{value}%".
 */
export function tFormat(
  key: string,
  params: Record<string, string | number>,
  lang: string = 'en',
): string {
  const template = t(key, lang);
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

/**
 * Translate a risk level label.
 */
export function tRisk(level: string, lang: string = 'en'): string {
  const normalized = level.toLowerCase().trim().replace(/[\s_-]+/g, '');
  const alias: Record<string, string> = {
    low: 'low',
    moderate: 'moderate',
    medium: 'moderate',
    high: 'high',
    veryhigh: 'high',
    severe: 'high',
  };

  const riskKey = `risk.${alias[normalized] ?? normalized}`;
  const translated = t(riskKey, lang);
  return translated === riskKey ? t('risk.moderate', lang) : translated;
}
