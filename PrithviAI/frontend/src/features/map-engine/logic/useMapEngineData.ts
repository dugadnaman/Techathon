'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLocationData } from '@/lib/api';
import type {
  EnvironmentData,
  Landmark,
  LocationData,
  RiskFactor,
  SafetyIndex,
} from '@/types';
import type { MapBounds, MapMetric } from '@/features/map-engine/context/MapContext';
import type { MapPointData } from '@/features/map-engine/layers/types';
import { ASIA_HEATMAP_ANCHORS, clampBoundsToAsia } from '@/features/map-engine/logic/asiaConfig';
import {
  computeSafetyScore,
  getRiskLevelFromScore,
  metricValueFromEnvironment,
  thresholdState,
} from '@/features/map-engine/logic/metrics';

const SERIES_HOURS = 25;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function isInsideBounds(landmark: Landmark, bounds: MapBounds): boolean {
  return (
    landmark.lat <= bounds.north &&
    landmark.lat >= bounds.south &&
    landmark.lon <= bounds.east &&
    landmark.lon >= bounds.west
  );
}

function roundMetricValue(metric: MapMetric, value: number): number {
  if (metric === 'aqi' || metric === 'humidity' || metric === 'noise' || metric === 'safety_score') {
    return Math.round(value);
  }
  return Number(value.toFixed(1));
}

function buildHourlySeries(location: LocationData): Omit<MapPointData['metricHourly'], 'safety_score'> {
  const env = location.environment;
  const seed = Math.abs((location.lat * 1000 + location.lon * 1000) % 360);
  const series = {
    aqi: [] as number[],
    temperature: [] as number[],
    uv: [] as number[],
    rainfall: [] as number[],
    humidity: [] as number[],
    noise: [] as number[],
  };

  for (let hour = 0; hour <= 24; hour += 1) {
    const angle = ((hour + seed) / 24) * Math.PI * 2;
    const dayPulse = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const rushPulse = Math.exp(-((hour - 9) ** 2) / 8) + Math.exp(-((hour - 18) ** 2) / 8);

    const temperature = clamp(env.temperature + Math.sin(angle) * 3.5 + dayPulse * 2.2, -5, 50);
    const humidity = clamp(env.humidity - Math.sin(angle) * 10, 20, 100);
    const uv = clamp(env.uv_index * dayPulse, 0, 12);
    const aqi = clamp(env.aqi + Math.cos(angle) * 18 + rushPulse * 12, 5, 450);
    const noise = clamp(env.noise_db + rushPulse * 12 + Math.sin(angle * 2) * 3, 30, 120);
    const rainfall = clamp(env.rainfall + (1 - dayPulse) * 1.5 + Math.abs(Math.sin(angle * 1.4)), 0, 80);

    series.temperature.push(Number(temperature.toFixed(1)));
    series.humidity.push(Number(humidity.toFixed(0)));
    series.uv.push(Number(uv.toFixed(1)));
    series.aqi.push(Number(aqi.toFixed(0)));
    series.noise.push(Number(noise.toFixed(0)));
    series.rainfall.push(Number(rainfall.toFixed(1)));
  }

  return series;
}

function buildSafetySeries(
  metricHourlyBase: Omit<MapPointData['metricHourly'], 'safety_score'>,
  seniorMode: boolean,
): number[] {
  return metricHourlyBase.aqi.map((_, hourIdx) => {
    return computeSafetyScore(
      {
        aqi: metricHourlyBase.aqi[hourIdx],
        temperature: metricHourlyBase.temperature[hourIdx],
        noise_db: metricHourlyBase.noise[hourIdx],
        uv_index: metricHourlyBase.uv[hourIdx],
        humidity: metricHourlyBase.humidity[hourIdx],
        rainfall: metricHourlyBase.rainfall[hourIdx],
      },
      seniorMode,
    );
  });
}

function buildTrendByMetric(
  metricHourly: MapPointData['metricHourly'],
  hour: number,
  previousHour: number,
): MapPointData['trendByMetric'] {
  return {
    aqi:
      metricHourly.aqi[hour] > metricHourly.aqi[previousHour]
        ? 'up'
        : metricHourly.aqi[hour] < metricHourly.aqi[previousHour]
          ? 'down'
          : 'stable',
    temperature:
      metricHourly.temperature[hour] > metricHourly.temperature[previousHour]
        ? 'up'
        : metricHourly.temperature[hour] < metricHourly.temperature[previousHour]
          ? 'down'
          : 'stable',
    uv:
      metricHourly.uv[hour] > metricHourly.uv[previousHour]
        ? 'up'
        : metricHourly.uv[hour] < metricHourly.uv[previousHour]
          ? 'down'
          : 'stable',
    rainfall:
      metricHourly.rainfall[hour] > metricHourly.rainfall[previousHour]
        ? 'up'
        : metricHourly.rainfall[hour] < metricHourly.rainfall[previousHour]
          ? 'down'
          : 'stable',
    humidity:
      metricHourly.humidity[hour] > metricHourly.humidity[previousHour]
        ? 'up'
        : metricHourly.humidity[hour] < metricHourly.humidity[previousHour]
          ? 'down'
          : 'stable',
    noise:
      metricHourly.noise[hour] > metricHourly.noise[previousHour]
        ? 'up'
        : metricHourly.noise[hour] < metricHourly.noise[previousHour]
          ? 'down'
          : 'stable',
    safety_score:
      metricHourly.safety_score[hour] > metricHourly.safety_score[previousHour]
        ? 'up'
        : metricHourly.safety_score[hour] < metricHourly.safety_score[previousHour]
          ? 'down'
          : 'stable',
  };
}

function calculatePrimaryRisk(point: MapPointData): string {
  const metrics: { key: MapMetric; score: number; label: string }[] = [
    { key: 'aqi', score: point.metricValues.aqi / 3, label: 'AQI' },
    { key: 'temperature', score: point.metricValues.temperature * 2, label: 'Heat' },
    { key: 'uv', score: point.metricValues.uv * 8, label: 'UV' },
    { key: 'noise', score: point.metricValues.noise, label: 'Noise' },
    { key: 'humidity', score: point.metricValues.humidity, label: 'Humidity' },
    { key: 'rainfall', score: point.metricValues.rainfall * 4, label: 'Rainfall' },
  ];
  metrics.sort((a, b) => b.score - a.score);
  return metrics[0].label;
}

function buildFallbackEnvironment(lat: number, lon: number): EnvironmentData {
  const climateWave = Math.sin((lat + lon) * 0.08);
  const continentality = Math.cos(lon * 0.05);
  const humidity = clamp(45 + continentality * 18 + Math.sin(lat * 0.15) * 12, 20, 98);
  const temperature = clamp(30 - Math.abs(lat - 23) * 0.28 + climateWave * 3, 2, 43);
  const aqi = clamp(82 + Math.abs(Math.sin((lat + lon) * 0.1)) * 90 + Math.max(0, 32 - lat) * 0.7, 25, 280);
  const uvIndex = clamp(4.5 + Math.cos(lat * 0.07) * 2.2 + Math.max(0, 22 - Math.abs(lat - 20)) * 0.03, 0.2, 11.5);
  const rainfall = clamp(1.2 + Math.max(0, humidity - 60) * 0.1 + Math.abs(Math.sin(lon * 0.11)), 0, 24);
  const noiseDb = clamp(52 + Math.abs(Math.sin((lat - lon) * 0.09)) * 18, 34, 92);

  return {
    pm25: Number((aqi / 3.3).toFixed(1)),
    pm10: Number((aqi / 2.2).toFixed(1)),
    aqi: Math.round(aqi),
    temperature: Number(temperature.toFixed(1)),
    feels_like: Number((temperature + Math.max(0, humidity - 65) * 0.06).toFixed(1)),
    humidity: Math.round(humidity),
    wind_speed: Number((2.5 + Math.abs(Math.cos(lon * 0.12)) * 2.5).toFixed(1)),
    rainfall: Number(rainfall.toFixed(1)),
    uv_index: Number(uvIndex.toFixed(1)),
    noise_db: Math.round(noiseDb),
    water_level: Number((0.9 + Math.abs(Math.sin(lat * 0.1)) * 1.8).toFixed(2)),
    visibility: Math.round(clamp(9000 - (aqi - 40) * 20, 2200, 12000)),
    weather_desc: 'Variable conditions',
    timestamp: new Date().toISOString(),
  };
}

function buildFallbackSafetyIndex(env: EnvironmentData): SafetyIndex {
  const overallScore = computeSafetyScore(
    {
      aqi: env.aqi,
      temperature: env.temperature,
      noise_db: env.noise_db,
      uv_index: env.uv_index,
      humidity: env.humidity,
      rainfall: env.rainfall,
    },
    false,
  );

  const riskFactors: RiskFactor[] = [
    {
      name: 'Air Quality',
      level: getRiskLevelFromScore(Math.round((env.aqi / 300) * 100)),
      score: Math.round((env.aqi / 300) * 100),
      reason: `AQI at ${env.aqi} indicates elevated particulate exposure.`,
      recommendation: 'Reduce prolonged outdoor exposure during peak pollution hours.',
      icon: '🌫️',
    },
    {
      name: 'Thermal Comfort',
      level: getRiskLevelFromScore(Math.round((env.temperature / 45) * 100)),
      score: Math.round((env.temperature / 45) * 100),
      reason: `Temperature near ${env.temperature.toFixed(1)}°C may increase heat stress.`,
      recommendation: 'Stay hydrated and avoid direct sun during the afternoon.',
      icon: '🌡️',
    },
    {
      name: 'UV Exposure',
      level: getRiskLevelFromScore(Math.round((env.uv_index / 12) * 100)),
      score: Math.round((env.uv_index / 12) * 100),
      reason: `UV index at ${env.uv_index.toFixed(1)} can raise skin and eye risk.`,
      recommendation: 'Use shade and sun protection for extended outdoor stays.',
      icon: '☀️',
    },
    {
      name: 'Noise',
      level: getRiskLevelFromScore(Math.round((env.noise_db / 100) * 100)),
      score: Math.round((env.noise_db / 100) * 100),
      reason: `Noise around ${env.noise_db} dB may cause discomfort.`,
      recommendation: 'Prefer quieter routes and limit long exposure in traffic zones.',
      icon: '🔊',
    },
  ];

  const topRisks = [...riskFactors].sort((a, b) => b.score - a.score).slice(0, 2);
  const overallLevel = getRiskLevelFromScore(overallScore);

  return {
    overall_level: overallLevel,
    overall_score: overallScore,
    top_risks: topRisks,
    all_risks: riskFactors,
    summary: `Environmental risk is ${overallLevel.toLowerCase()} for this location.`,
    recommendations: [
      'Monitor AQI and heat before long outdoor activities.',
      'Prefer lower-traffic and shaded routes where possible.',
    ],
    timestamp: new Date().toISOString(),
  };
}

function buildFallbackLocationData(name: string, lat: number, lon: number): LocationData {
  const environment = buildFallbackEnvironment(lat, lon);
  return {
    lat,
    lon,
    location_name: name,
    environment,
    safety_index: buildFallbackSafetyIndex(environment),
    timestamp: new Date().toISOString(),
  };
}

interface HeatmapAnchorSnapshot {
  name: string;
  lat: number;
  lon: number;
  locationData: LocationData;
  metricHourly: MapPointData['metricHourly'];
}

interface WeightedAnchor {
  anchor: HeatmapAnchorSnapshot;
  weight: number;
  distance: number;
}

function buildInterpolationWeights(
  anchors: HeatmapAnchorSnapshot[],
  lat: number,
  lon: number,
): WeightedAnchor[] {
  return anchors
    .map((anchor) => {
      const distance = Math.max(5, distanceKm(lat, lon, anchor.lat, anchor.lon));
      return {
        anchor,
        distance,
        weight: 1 / Math.pow(distance + 60, 1.45),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8);
}

function interpolateMetricHour(
  weights: WeightedAnchor[],
  metric: MapMetric,
  hourIndex: number,
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of weights) {
    weightedSum += item.anchor.metricHourly[metric][hourIndex] * item.weight;
    totalWeight += item.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function buildInterpolatedHourly(weights: WeightedAnchor[]): MapPointData['metricHourly'] {
  const metricHourly: MapPointData['metricHourly'] = {
    aqi: [],
    temperature: [],
    uv: [],
    rainfall: [],
    humidity: [],
    noise: [],
    safety_score: [],
  };

  const metrics: MapMetric[] = ['aqi', 'temperature', 'uv', 'rainfall', 'humidity', 'noise', 'safety_score'];

  for (let hour = 0; hour < SERIES_HOURS; hour += 1) {
    for (const metric of metrics) {
      const interpolated = interpolateMetricHour(weights, metric, hour);
      metricHourly[metric].push(roundMetricValue(metric, interpolated));
    }
  }

  return metricHourly;
}

export interface MapEngineMicroAlert {
  id: string;
  locationName: string;
  lat: number;
  lon: number;
  severity: 'moderate' | 'high' | 'severe';
  text: string;
}

export function useMapEngineData({
  landmarks,
  visibleBounds,
  selectedMetric,
  selectedTimeIndex,
  seniorMode,
}: {
  landmarks: Landmark[];
  visibleBounds: MapBounds | null;
  selectedMetric: MapMetric;
  selectedTimeIndex: number;
  seniorMode: boolean;
}) {
  const locationCacheRef = useRef<Map<string, LocationData>>(new Map());
  const hourlyCacheRef = useRef<Map<string, Omit<MapPointData['metricHourly'], 'safety_score'>>>(new Map());
  const [cacheVersion, setCacheVersion] = useState(0);
  const [isLoadingVisibleData, setIsLoadingVisibleData] = useState(false);

  const visibleLandmarks = useMemo(() => {
    if (!visibleBounds) return landmarks.slice(0, 40);
    return landmarks.filter((landmark) => isInsideBounds(landmark, visibleBounds));
  }, [landmarks, visibleBounds]);

  const getOrFetchLocationData = useCallback(async (lat: number, lon: number, name: string) => {
    const cacheKey = name || `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = locationCacheRef.current.get(cacheKey);
    if (cached) return cached;
    const data = await getLocationData(lat, lon, name);
    locationCacheRef.current.set(cacheKey, data);
    setCacheVersion((v) => v + 1);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function warmVisibleCache() {
      if (visibleLandmarks.length === 0) return;
      const uncached = visibleLandmarks.filter(
        (landmark) => !locationCacheRef.current.has(landmark.name),
      );
      if (uncached.length === 0) return;

      setIsLoadingVisibleData(true);
      try {
        const results = await Promise.all(
          uncached.map(async (landmark) => {
            try {
              const data = await getLocationData(landmark.lat, landmark.lon, landmark.name);
              return { key: landmark.name, data };
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;

        let hasUpdates = false;
        for (const result of results) {
          if (!result) continue;
          locationCacheRef.current.set(result.key, result.data);
          hasUpdates = true;
        }
        if (hasUpdates) {
          setCacheVersion((v) => v + 1);
        }
      } finally {
        if (!cancelled) setIsLoadingVisibleData(false);
      }
    }

    warmVisibleCache();
    return () => {
      cancelled = true;
    };
  }, [visibleLandmarks]);

  useEffect(() => {
    let cancelled = false;
    async function warmAsiaAnchorCache() {
      const uncachedAnchors = ASIA_HEATMAP_ANCHORS.filter(
        (anchor) => !locationCacheRef.current.has(`asia:${anchor.name}`),
      );
      if (uncachedAnchors.length === 0) return;

      const results = await Promise.all(
        uncachedAnchors.map(async (anchor) => {
          try {
            const data = await getLocationData(anchor.lat, anchor.lon, anchor.name);
            return { key: `asia:${anchor.name}`, data };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      let hasUpdates = false;
      for (const result of results) {
        if (!result) continue;
        locationCacheRef.current.set(result.key, result.data);
        hourlyCacheRef.current.delete(result.key);
        hasUpdates = true;
      }

      if (hasUpdates) {
        setCacheVersion((v) => v + 1);
      }
    }

    warmAsiaAnchorCache();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapPoints = useMemo<MapPointData[]>(() => {
    const points: MapPointData[] = [];
    const hour = clamp(selectedTimeIndex, 0, 24);
    const previousHour = clamp(hour - 1, 0, 24);

    for (const landmark of visibleLandmarks) {
      const locationData = locationCacheRef.current.get(landmark.name);
      if (!locationData) continue;

      let metricHourlyBase = hourlyCacheRef.current.get(landmark.name);
      if (!metricHourlyBase) {
        metricHourlyBase = buildHourlySeries(locationData);
        hourlyCacheRef.current.set(landmark.name, metricHourlyBase);
      }

      const safetySeries = buildSafetySeries(metricHourlyBase, seniorMode);
      const metricHourly: MapPointData['metricHourly'] = {
        ...metricHourlyBase,
        safety_score: safetySeries,
      };

      const metricValues = {
        aqi: metricHourly.aqi[hour],
        temperature: metricHourly.temperature[hour],
        uv: metricHourly.uv[hour],
        rainfall: metricHourly.rainfall[hour],
        humidity: metricHourly.humidity[hour],
        noise: metricHourly.noise[hour],
        safety_score: metricHourly.safety_score[hour],
      };

      const trendByMetric = buildTrendByMetric(metricHourly, hour, previousHour);

      const currentMetricValue = metricValueFromEnvironment(
        selectedMetric,
        {
          aqi: metricValues.aqi,
          temperature: metricValues.temperature,
          uv_index: metricValues.uv,
          rainfall: metricValues.rainfall,
          humidity: metricValues.humidity,
          noise_db: metricValues.noise,
        },
        metricValues.safety_score,
      );

      const alerts: string[] = [];
      if (metricHourly.temperature[hour] > 38) alerts.push('Temperature above 38°C');
      if (metricHourly.aqi[hour] - metricHourly.aqi[previousHour] > 18) alerts.push('AQI rising rapidly');
      if (metricHourly.noise[hour] > 70) alerts.push('Noise above safe threshold');

      const riskLevel = getRiskLevelFromScore(metricValues.safety_score);
      const point: MapPointData = {
        name: landmark.name,
        lat: landmark.lat,
        lon: landmark.lon,
        riskLevel,
        trendByMetric,
        metricValues,
        metricHourly,
        alerts,
        primaryRisk: 'AQI',
        locationData,
      };
      point.primaryRisk = calculatePrimaryRisk(point);

      if (thresholdState(selectedMetric, currentMetricValue) !== 'normal' || alerts.length > 0) {
        points.push(point);
      } else {
        points.push(point);
      }
    }

    return points;
  }, [visibleLandmarks, cacheVersion, selectedTimeIndex, selectedMetric, seniorMode]);

  const heatmapPoints = useMemo<MapPointData[]>(() => {
    const bounded = clampBoundsToAsia(visibleBounds);
    const latSpan = Math.max(1, bounded.north - bounded.south);
    const lonSpan = Math.max(1, bounded.east - bounded.west);
    const rowCount = clamp(Math.round(latSpan / 5), 6, 12);
    const colCount = clamp(Math.round(lonSpan / 7), 8, 16);
    const latStep = latSpan / rowCount;
    const lonStep = lonSpan / colCount;
    const hour = clamp(selectedTimeIndex, 0, 24);
    const previousHour = clamp(hour - 1, 0, 24);

    const anchors: HeatmapAnchorSnapshot[] = ASIA_HEATMAP_ANCHORS.map((anchor) => {
      const cacheKey = `asia:${anchor.name}`;
      const locationData = locationCacheRef.current.get(cacheKey) ?? buildFallbackLocationData(anchor.name, anchor.lat, anchor.lon);

      let metricHourlyBase = hourlyCacheRef.current.get(cacheKey);
      if (!metricHourlyBase) {
        metricHourlyBase = buildHourlySeries(locationData);
        hourlyCacheRef.current.set(cacheKey, metricHourlyBase);
      }

      return {
        name: anchor.name,
        lat: anchor.lat,
        lon: anchor.lon,
        locationData,
        metricHourly: {
          ...metricHourlyBase,
          safety_score: buildSafetySeries(metricHourlyBase, seniorMode),
        },
      };
    });

    const points: MapPointData[] = [];
    for (let row = 0; row <= rowCount; row += 1) {
      const lat = bounded.south + row * latStep;
      for (let col = 0; col <= colCount; col += 1) {
        const lon = bounded.west + col * lonStep;
        const weights = buildInterpolationWeights(anchors, lat, lon);
        if (weights.length === 0) continue;

        const metricHourly = buildInterpolatedHourly(weights);
        const metricValues = {
          aqi: metricHourly.aqi[hour],
          temperature: metricHourly.temperature[hour],
          uv: metricHourly.uv[hour],
          rainfall: metricHourly.rainfall[hour],
          humidity: metricHourly.humidity[hour],
          noise: metricHourly.noise[hour],
          safety_score: metricHourly.safety_score[hour],
        };

        const riskLevel = getRiskLevelFromScore(metricValues.safety_score);
        const point: MapPointData = {
          name: `asia-${row}-${col}`,
          lat: Number(lat.toFixed(4)),
          lon: Number(lon.toFixed(4)),
          riskLevel,
          trendByMetric: buildTrendByMetric(metricHourly, hour, previousHour),
          metricValues,
          metricHourly,
          alerts: [],
          primaryRisk: 'AQI',
          locationData: weights[0].anchor.locationData,
        };
        point.primaryRisk = calculatePrimaryRisk(point);
        points.push(point);
      }
    }

    return points;
  }, [cacheVersion, visibleBounds, selectedTimeIndex, seniorMode]);

  const microAlerts = useMemo<MapEngineMicroAlert[]>(() => {
    const alerts: MapEngineMicroAlert[] = [];

    for (const point of mapPoints) {
      const hour = clamp(selectedTimeIndex, 0, 24);
      const previousHour = clamp(hour - 1, 0, 24);
      const currentMetric = point.metricHourly[selectedMetric][hour];
      const state = thresholdState(selectedMetric, currentMetric);

      if (point.metricHourly.temperature[hour] > 38) {
        alerts.push({
          id: `${point.name}-temp-${hour}`,
          locationName: point.name,
          lat: point.lat,
          lon: point.lon,
          severity: 'high',
          text: 'Heat alert',
        });
      }

      if (point.metricHourly.aqi[hour] - point.metricHourly.aqi[previousHour] > 18) {
        alerts.push({
          id: `${point.name}-aqi-${hour}`,
          locationName: point.name,
          lat: point.lat,
          lon: point.lon,
          severity: 'severe',
          text: 'AQI rising fast',
        });
      }

      if (point.metricHourly.noise[hour] > 70) {
        alerts.push({
          id: `${point.name}-noise-${hour}`,
          locationName: point.name,
          lat: point.lat,
          lon: point.lon,
          severity: 'moderate',
          text: 'High noise',
        });
      }

      if (state !== 'normal') {
        alerts.push({
          id: `${point.name}-${selectedMetric}-${hour}`,
          locationName: point.name,
          lat: point.lat,
          lon: point.lon,
          severity: state === 'severe' ? 'severe' : state === 'high' ? 'high' : 'moderate',
          text: `${selectedMetric.replace('_', ' ')} elevated`,
        });
      }
    }

    const dedup = new Map<string, MapEngineMicroAlert>();
    for (const alert of alerts) {
      dedup.set(alert.id, alert);
    }
    return Array.from(dedup.values()).slice(0, 24);
  }, [mapPoints, selectedMetric, selectedTimeIndex]);

  return {
    mapPoints,
    heatmapPoints,
    isLoadingVisibleData,
    microAlerts,
    getOrFetchLocationData,
  };
}
