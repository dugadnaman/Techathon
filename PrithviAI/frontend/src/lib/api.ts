/**
 * PrithviAI — API Client
 * Handles all communication with the backend.
 */

import type {
  SafetyIndex, EnvironmentData, ChatResponse,
  DailySummary, HealthAlert, AgeGroup, ActivityIntent,
  Language, AreaData, TrendPoint, RiskDistribution,
  Landmark, LocationData, MapChatResponse,
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

function toBackendAgeGroup(ageGroup: AgeGroup): 'elderly' | 'adult' {
  return ageGroup === 'child' ? 'adult' : ageGroup;
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
  lat = 19.076,
  lon = 72.8777,
  city = 'Mumbai',
): Promise<EnvironmentData> {
  return apiFetch(`/api/environment/current?lat=${lat}&lon=${lon}&city=${city}`);
}

export async function getEnvironmentForecast(
  lat = 19.076,
  lon = 72.8777,
): Promise<{ forecast: EnvironmentData[] }> {
  return apiFetch(`/api/environment/forecast?lat=${lat}&lon=${lon}`);
}

// ─── Risk Assessment Endpoints ───────────────────────────

export async function assessRisk(
  lat = 19.076,
  lon = 72.8777,
  city = 'Mumbai',
  age_group: AgeGroup = 'elderly',
  activity: ActivityIntent = 'walking',
  language: Language = 'en',
): Promise<SafetyIndex> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  return apiFetch('/api/risk/assess', {
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
}

export async function getAlerts(
  lat = 19.076,
  lon = 72.8777,
  city = 'Mumbai',
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
  lat = 19.076,
  lon = 72.8777,
  city = 'Mumbai',
  age_group: AgeGroup = 'elderly',
): Promise<DailySummary> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  return apiFetch('/api/risk/daily-summary', {
    method: 'POST',
    body: JSON.stringify({ latitude: lat, longitude: lon, city, age_group: backendAgeGroup }),
  });
}

// ─── Chat Endpoints ──────────────────────────────────────

export async function sendChatMessage(
  message: string,
  lat = 19.076,
  lon = 72.8777,
  city = 'Mumbai',
  age_group: AgeGroup = 'elderly',
  language: Language = 'en',
  session_id?: string,
): Promise<ChatResponse> {
  const backendAgeGroup = toBackendAgeGroup(age_group);
  return apiFetch('/api/chat/message', {
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
