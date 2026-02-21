'use client';

import type { EnvironmentData, RiskLevel } from '@/types';
import type { MapMetric } from '@/features/map-engine/context/MapContext';

export interface MetricGradientStop {
  max: number;
  color: string;
}

export const METRIC_GRADIENTS: Record<MapMetric, MetricGradientStop[]> = {
  aqi: [
    { max: 50, color: '#22c55e' },
    { max: 100, color: '#eab308' },
    { max: 150, color: '#f97316' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
  temperature: [
    { max: 20, color: '#3b82f6' },
    { max: 30, color: '#22c55e' },
    { max: 35, color: '#f97316' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
  uv: [
    { max: 2, color: '#22c55e' },
    { max: 5, color: '#eab308' },
    { max: 7, color: '#f97316' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
  rainfall: [
    { max: 2, color: '#7dd3fc' },
    { max: 10, color: '#38bdf8' },
    { max: Number.POSITIVE_INFINITY, color: '#1d4ed8' },
  ],
  humidity: [
    { max: 40, color: '#f97316' },
    { max: 60, color: '#22c55e' },
    { max: 80, color: '#eab308' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
  noise: [
    { max: 55, color: '#22c55e' },
    { max: 70, color: '#eab308' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
  safety_score: [
    { max: 30, color: '#22c55e' },
    { max: 60, color: '#eab308' },
    { max: Number.POSITIVE_INFINITY, color: '#ef4444' },
  ],
};

export function getMetricColor(metric: MapMetric, value: number): string {
  const stops = METRIC_GRADIENTS[metric];
  const stop = stops.find((s) => value <= s.max);
  return stop ? stop.color : stops[stops.length - 1].color;
}

function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function computeSafetyScore(
  env: Pick<EnvironmentData, 'aqi' | 'temperature' | 'noise_db' | 'uv_index' | 'humidity' | 'rainfall'>,
  seniorMode: boolean,
): number {
  const weights = seniorMode
    ? { aqi: 0.4, temperature: 0.3, uv: 0.2, noise: 0.05, humidity: 0.03, rainfall: 0.02 }
    : { aqi: 0.3, temperature: 0.25, noise: 0.15, uv: 0.15, humidity: 0.1, rainfall: 0.05 };

  const weighted =
    normalize(env.aqi, 0, 300) * weights.aqi +
    normalize(env.temperature, 10, 45) * weights.temperature +
    normalize(env.noise_db, 35, 100) * weights.noise +
    normalize(env.uv_index, 0, 12) * weights.uv +
    normalize(env.humidity, 20, 100) * weights.humidity +
    normalize(env.rainfall, 0, 30) * weights.rainfall;

  return Math.round(weighted * 100);
}

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MODERATE';
  return 'HIGH';
}

export function metricValueFromEnvironment(
  metric: MapMetric,
  env: Pick<EnvironmentData, 'aqi' | 'temperature' | 'uv_index' | 'rainfall' | 'humidity' | 'noise_db'>,
  safetyScore: number,
): number {
  switch (metric) {
    case 'aqi':
      return env.aqi;
    case 'temperature':
      return env.temperature;
    case 'uv':
      return env.uv_index;
    case 'rainfall':
      return env.rainfall;
    case 'humidity':
      return env.humidity;
    case 'noise':
      return env.noise_db;
    case 'safety_score':
      return safetyScore;
    default:
      return env.aqi;
  }
}

export function thresholdState(
  metric: MapMetric,
  value: number,
): 'normal' | 'moderate' | 'high' | 'severe' {
  switch (metric) {
    case 'aqi':
      if (value >= 200) return 'severe';
      if (value >= 150) return 'high';
      if (value >= 100) return 'moderate';
      return 'normal';
    case 'temperature':
      if (value >= 40) return 'severe';
      if (value >= 35) return 'high';
      if (value >= 30) return 'moderate';
      return 'normal';
    case 'uv':
      if (value >= 10) return 'severe';
      if (value >= 8) return 'high';
      if (value >= 6) return 'moderate';
      return 'normal';
    case 'noise':
      if (value >= 90) return 'severe';
      if (value >= 75) return 'high';
      if (value >= 65) return 'moderate';
      return 'normal';
    case 'rainfall':
      if (value >= 20) return 'severe';
      if (value >= 12) return 'high';
      if (value >= 6) return 'moderate';
      return 'normal';
    case 'humidity':
      if (value >= 90) return 'high';
      if (value >= 80 || value <= 25) return 'moderate';
      return 'normal';
    case 'safety_score':
      if (value >= 80) return 'severe';
      if (value >= 60) return 'high';
      if (value >= 40) return 'moderate';
      return 'normal';
    default:
      return 'normal';
  }
}
