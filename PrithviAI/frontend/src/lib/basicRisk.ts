import type { EnvironmentData, RiskLevel } from '@/types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round 1 MVP score model (0-100):
 * - AQI: up to 45-point penalty
 * - Temperature: up to 20-point penalty
 * - Humidity: up to 20-point penalty
 * - UV: up to 15-point penalty
 */
export function computeBasicSafetyScore(environment: EnvironmentData): number {
  const aqiPenalty = clamp((environment.aqi / 300) * 45, 0, 45);

  const temperatureDelta = Math.abs(environment.temperature - 28);
  const temperaturePenalty = clamp((temperatureDelta / 14) * 20, 0, 20);

  const humidityDelta = Math.abs(environment.humidity - 55);
  const humidityPenalty = clamp((humidityDelta / 45) * 20, 0, 20);

  const uvPenalty = clamp((environment.uv_index / 11) * 15, 0, 15);

  const score = 100 - (aqiPenalty + temperaturePenalty + humidityPenalty + uvPenalty);
  return Number(clamp(score, 0, 100).toFixed(1));
}

export function getBasicRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 70) return 'LOW';
  if (score >= 45) return 'MODERATE';
  return 'HIGH';
}

export function getBasicRiskLevelLabel(level: RiskLevel): string {
  if (level === 'LOW') return 'Low';
  if (level === 'MODERATE') return 'Moderate';
  return 'High';
}

export function getRiskPillClass(level: RiskLevel): string {
  if (level === 'LOW') return 'bg-risk-low/20 text-risk-low border border-risk-low/30';
  if (level === 'MODERATE') return 'bg-risk-moderate/20 text-risk-moderate border border-risk-moderate/30';
  return 'bg-risk-high/20 text-risk-high border border-risk-high/30';
}
