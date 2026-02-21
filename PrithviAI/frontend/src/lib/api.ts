/**
 * PrithviAI — API Client
 * Handles all communication with the backend.
 */

import type {
  SafetyIndex, EnvironmentData, ChatResponse,
  DailySummary, HealthAlert, AgeGroup, ActivityIntent,
  Language, AreaData, TrendPoint, RiskDistribution, RiskLevel,
  Landmark, LocationData, MapChatResponse,
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

function toBackendAgeGroup(ageGroup: AgeGroup): 'elderly' | 'adult' {
  return ageGroup === 'child' ? 'adult' : ageGroup;
}

const CHILD_OVERALL_DELTA = 4;
const CHILD_FACTOR_DELTA = 2;
const CHILD_FORECAST_DELTA = 3;

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MODERATE';
  return 'HIGH';
}

function adjustSafetyIndexForChild(safetyIndex: SafetyIndex): SafetyIndex {
  const adjustedFactors = safetyIndex.all_risks.map((risk) => {
    const adjustedScore = clampScore(risk.score + CHILD_FACTOR_DELTA);
    return {
      ...risk,
      score: adjustedScore,
      level: scoreToRiskLevel(adjustedScore),
    };
  });

  const topRiskCount = safetyIndex.top_risks.length;
  const adjustedTopRisks = topRiskCount > 0
    ? [...adjustedFactors].sort((a, b) => b.score - a.score).slice(0, topRiskCount)
    : [];

  const adjustedOverallScore = clampScore(safetyIndex.overall_score + CHILD_OVERALL_DELTA);

  return {
    ...safetyIndex,
    overall_score: adjustedOverallScore,
    overall_level: scoreToRiskLevel(adjustedOverallScore),
    all_risks: adjustedFactors,
    top_risks: adjustedTopRisks,
  };
}

function adjustDailySummaryForChild(summary: DailySummary): DailySummary {
  return {
    ...summary,
    safety_index: adjustSafetyIndexForChild(summary.safety_index),
    forecast: {
      ...summary.forecast,
      points: summary.forecast.points.map((point) => {
        const adjustedScore = clampScore(point.predicted_score + CHILD_FORECAST_DELTA);
        return {
          ...point,
          predicted_score: adjustedScore,
          predicted_level: scoreToRiskLevel(adjustedScore),
        };
      }),
    },
  };
}

// ─── Generic Fetch Helper ────────────────────────────────

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[API] Failed: ${endpoint}`, error);
    throw error;
  }
}

// ─── Environment Endpoints ───────────────────────────────

export async function getCurrentEnvironment(
  lat = 18.5204,
  lon = 73.8567,
  city = 'Pune',
): Promise<EnvironmentData> {
  return apiFetch(`/api/environment/current?lat=${lat}&lon=${lon}&city=${city}`);
}

export async function getEnvironmentForecast(
  lat = 18.5204,
  lon = 73.8567,
): Promise<{ forecast: EnvironmentData[] }> {
  return apiFetch(`/api/environment/forecast?lat=${lat}&lon=${lon}`);
}

// ─── Risk Assessment Endpoints ───────────────────────────

export async function assessRisk(
  lat = 18.5204,
  lon = 73.8567,
  city = 'Pune',
  age_group: AgeGroup = 'elderly',
  activity: ActivityIntent = 'walking',
  language: Language = 'en',
): Promise<SafetyIndex> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  const safetyIndex = await apiFetch<SafetyIndex>('/api/risk/assess', {
    method: 'POST',
    body: JSON.stringify({
      latitude: lat,
      longitude: lon,
      city,
      age_group: backendAgeGroup,
      activity,
      language,
    }),
  });
  return age_group === 'child' ? adjustSafetyIndexForChild(safetyIndex) : safetyIndex;
}

export async function getAlerts(
  lat = 18.5204,
  lon = 73.8567,
  city = 'Pune',
  age_group: AgeGroup = 'elderly',
): Promise<HealthAlert[]> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  return apiFetch('/api/risk/alerts', {
    method: 'POST',
    body: JSON.stringify({
      latitude: lat,
      longitude: lon,
      city,
      age_group: backendAgeGroup,
    }),
  });
}

export async function getDailySummary(
  lat = 18.5204,
  lon = 73.8567,
  city = 'Pune',
  age_group: AgeGroup = 'elderly',
): Promise<DailySummary> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  const summary = await apiFetch<DailySummary>('/api/risk/daily-summary', {
    method: 'POST',
    body: JSON.stringify({ latitude: lat, longitude: lon, city, age_group: backendAgeGroup }),
  });
  return age_group === 'child' ? adjustDailySummaryForChild(summary) : summary;
}

// ─── Chat Endpoints ──────────────────────────────────────

export async function sendChatMessage(
  message: string,
  lat = 18.5204,
  lon = 73.8567,
  city = 'Pune',
  age_group: AgeGroup = 'elderly',
  language: Language = 'en',
  session_id?: string,
): Promise<ChatResponse> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  const response = await apiFetch<ChatResponse>('/api/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      message,
      latitude: lat,
      longitude: lon,
      city,
      age_group: backendAgeGroup,
      language,
      session_id,
    }),
  });
  if (age_group !== 'child' || !response.safety_index) return response;
  const adjustedSafetyIndex = adjustSafetyIndexForChild(response.safety_index);
  return {
    ...response,
    safety_index: adjustedSafetyIndex,
    risk_level: adjustedSafetyIndex.overall_level,
  };
}

export async function getChatSuggestions(): Promise<{ suggestions: string[] }> {
  return apiFetch('/api/chat/suggestions');
}

// ─── Dashboard Endpoints ─────────────────────────────────

export async function getDashboardSummary(): Promise<{
  current_time: string;
  areas: AreaData[];
}> {
  return apiFetch('/api/dashboard/summary');
}

export async function getTrends(days = 7): Promise<{ trends: TrendPoint[] }> {
  return apiFetch(`/api/dashboard/trends?days=${days}`);
}

export async function getRiskDistribution(): Promise<{
  distribution: RiskDistribution[];
}> {
  return apiFetch('/api/dashboard/risk-distribution');
}

// ─── Map Explorer Endpoints ──────────────────────────────

export async function getMapLandmarks(): Promise<{ landmarks: Landmark[] }> {
  return apiFetch('/api/map/landmarks');
}

export async function getLocationData(
  lat: number,
  lon: number,
  name = '',
): Promise<LocationData> {
  return apiFetch(`/api/map/location-data?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`);
}

export async function sendMapChatMessage(
  message: string,
  lat: number,
  lon: number,
  locationName: string,
  conversationHistory: { role: string; content: string }[] = [],
  sessionId?: string,
  ageGroup: AgeGroup = 'elderly',
): Promise<MapChatResponse> {
  const backendAgeGroup = toBackendAgeGroup(ageGroup);
  return apiFetch('/api/map/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      latitude: lat,
      longitude: lon,
      location_name: locationName,
      age_group: backendAgeGroup,
      session_id: sessionId,
      conversation_history: conversationHistory,
    }),
  });
}
