'use client';

import type { Landmark, RiskLevel } from '@/types';
import type { MapMetric } from '@/features/map-engine/context/MapContext';

export interface MapMetricValues {
  aqi: number;
  temperature: number;
  uv: number;
  rainfall: number;
  humidity: number;
  noise: number;
  safety_score: number;
}

export interface MapPointData {
  name: string;
  lat: number;
  lon: number;
  riskLevel: RiskLevel;
  metricValues: MapMetricValues;
  metricHourly: Record<MapMetric, number[]>;
  alerts: string[];
  primaryRisk: string;
}

export interface MarkerLayerProps {
  landmarks: Landmark[];
  selectedLocation: { lat: number; lon: number; name: string } | null;
  clickedPos: { lat: number; lon: number } | null;
  landmarkRiskLevels: Record<string, RiskLevel>;
  onLandmarkClick: (landmark: Landmark) => void;
  onClickedPointSelect: (lat: number, lon: number) => void;
}

export interface HeatmapLayerProps {
  points: MapPointData[];
  selectedMetric: MapMetric;
  timeIndex: number;
}

export interface PulseLayerProps {
  points: MapPointData[];
  selectedMetric: MapMetric;
  timeIndex: number;
}

export interface AlertLayerProps {
  points: MapPointData[];
  timeIndex: number;
  dismissedAlerts: Set<string>;
  onDismissAlert: (id: string) => void;
}

export interface RouteLayerProps {
  userLocation: { lat: number; lon: number } | null;
  safestPoint: { lat: number; lon: number; name: string } | null;
}
