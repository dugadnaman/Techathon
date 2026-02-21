/**
 * PrithviAI — TypeScript Types
 * Shared type definitions for the frontend.
 */

// ─── Enums ───────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type AgeGroup = 'elderly' | 'adult' | 'child';
export type ActivityIntent = 'walking' | 'outdoor_work' | 'rest' | 'exercise' | 'commute';
export type Language =
  | 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'kn' | 'ml'
  | 'gu' | 'pa' | 'or' | 'as' | 'ur' | 'gom' | 'mni' | 'brx'
  | 'sa' | 'ne' | 'mai' | 'sat' | 'doi';

// ─── Risk Factor ─────────────────────────────────────────

export interface RiskFactor {
  name: string;
  level: RiskLevel;
  score: number;
  reason: string;
  recommendation: string;
  icon: string;
}

// ─── Safety Index ────────────────────────────────────────

export interface SafetyIndex {
  overall_level: RiskLevel;
  overall_score: number;
  top_risks: RiskFactor[];
  all_risks: RiskFactor[];
  summary: string;
  recommendations: string[];
  timestamp: string;
  data_quality?: DataQuality;
}

// ─── Environment Data ────────────────────────────────────

export interface EnvironmentData {
  pm25: number;
  pm10: number;
  aqi: number;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  uv_index: number;
  noise_db: number;
  water_level: number;
  visibility: number;
  weather_desc: string;
  timestamp: string;
  data_quality?: DataQuality;
}

// ─── Forecast ────────────────────────────────────────────

export interface ForecastPoint {
  time: string;
  predicted_level: RiskLevel;
  predicted_score: number;
  key_concern: string;
}

export interface Forecast {
  points: ForecastPoint[];
  early_warnings: string[];
}

// ─── Daily Summary ───────────────────────────────────────

export interface DailySummary {
  date: string;
  location: string;
  safety_index: SafetyIndex;
  forecast: Forecast;
  morning_advice: string;
  afternoon_advice: string;
  evening_advice: string;
}

// ─── Data Quality / Confidence ───────────────────────────

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type FreshnessLabel = 'Fresh' | 'Slightly Stale' | 'Stale';

export interface FreshnessInfo {
  freshness_label: FreshnessLabel;
  freshness_minutes: number;
  timestamp_iso: string | null;
}

export interface ConfidenceInfo {
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  confidence_reasons: string[];
}

export interface DataQuality {
  freshness: FreshnessInfo;
  confidence: ConfidenceInfo;
  sources?: Record<string, string>;
}

// ─── Chat ────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  risk_level?: RiskLevel;
  safety_index?: SafetyIndex;
}

export interface ChatResponse {
  reply: string;
  risk_level: RiskLevel;
  safety_index?: SafetyIndex;
  session_id: string;
}

// ─── Alerts ──────────────────────────────────────────────

export interface HealthAlert {
  alert_type: string;
  severity: RiskLevel;
  title: string;
  message: string;
  action: string;
  icon: string;
  timestamp: string;
}

// ─── Dashboard ───────────────────────────────────────────

export interface AreaData {
  name: string;
  lat: number;
  lon: number;
  safety_level: RiskLevel;
  score: number;
  top_concern: string;
}

export interface TrendPoint {
  timestamp: string;
  aqi: number;
  temperature: number;
  humidity: number;
  safety_score: number;
  uv_index: number;
}

export interface RiskDistribution {
  factor: string;
  score: number;
  level: RiskLevel;
}

// ─── Map Explorer ────────────────────────────────────────

export interface Landmark {
  name: string;
  lat: number;
  lon: number;
  type: string;
  description: string;
}

export interface LocationData {
  lat: number;
  lon: number;
  location_name: string;
  environment: EnvironmentData;
  safety_index: SafetyIndex;
  timestamp: string;
  data_quality?: DataQuality;
}

export interface MapChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MapChatResponse {
  reply: string;
  risk_level: string;
  session_id: string;
}
