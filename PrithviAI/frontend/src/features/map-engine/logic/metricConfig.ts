'use client';

import type { MapMetric } from '@/features/map-engine/context/MapContext';

export interface MetricOption {
  key: MapMetric;
  label: string;
  shortLabel: string;
  unit: string;
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: 'aqi', label: 'AQI', shortLabel: 'AQI', unit: '' },
  { key: 'temperature', label: 'Temperature', shortLabel: 'Temp', unit: '°C' },
  { key: 'uv', label: 'UV', shortLabel: 'UV', unit: '' },
  { key: 'rainfall', label: 'Rainfall', shortLabel: 'Rain', unit: 'mm' },
  { key: 'humidity', label: 'Humidity', shortLabel: 'Humidity', unit: '%' },
  { key: 'noise', label: 'Noise', shortLabel: 'Noise', unit: 'dB' },
  { key: 'safety_score', label: 'Safety Score', shortLabel: 'Safety', unit: '/100' },
];

export function metricDisplayName(metric: MapMetric): string {
  const option = METRIC_OPTIONS.find((item) => item.key === metric);
  return option ? option.label : 'AQI';
}

export function metricUnit(metric: MapMetric): string {
  const option = METRIC_OPTIONS.find((item) => item.key === metric);
  return option ? option.unit : '';
}
