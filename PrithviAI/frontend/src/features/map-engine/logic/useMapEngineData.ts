'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLocationData } from '@/lib/api';
import type { Landmark, LocationData } from '@/types';
import type { MapBounds, MapMetric } from '@/features/map-engine/context/MapContext';
import type { MapPointData } from '@/features/map-engine/layers/types';
import {
  computeSafetyScore,
  getRiskLevelFromScore,
  metricValueFromEnvironment,
  thresholdState,
} from '@/features/map-engine/logic/metrics';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isInsideBounds(landmark: Landmark, bounds: MapBounds): boolean {
  return (
    landmark.lat <= bounds.north &&
    landmark.lat >= bounds.south &&
    landmark.lon <= bounds.east &&
    landmark.lon >= bounds.west
  );
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

    const temperature = clamp(env.temperature + Math.sin(angle) * 3.5 + dayPulse * 2.2, 10, 50);
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

  const mapPoints = useMemo<MapPointData[]>(() => {
    const points: MapPointData[] = [];

    for (const landmark of visibleLandmarks) {
      const locationData = locationCacheRef.current.get(landmark.name);
      if (!locationData) continue;

      let metricHourlyBase = hourlyCacheRef.current.get(landmark.name);
      if (!metricHourlyBase) {
        metricHourlyBase = buildHourlySeries(locationData);
        hourlyCacheRef.current.set(landmark.name, metricHourlyBase);
      }

      const safetySeries = metricHourlyBase.aqi.map((_, hourIdx) => {
        return computeSafetyScore(
          {
            aqi: metricHourlyBase!.aqi[hourIdx],
            temperature: metricHourlyBase!.temperature[hourIdx],
            noise_db: metricHourlyBase!.noise[hourIdx],
            uv_index: metricHourlyBase!.uv[hourIdx],
            humidity: metricHourlyBase!.humidity[hourIdx],
            rainfall: metricHourlyBase!.rainfall[hourIdx],
          },
          seniorMode,
        );
      });

      const metricHourly: MapPointData['metricHourly'] = {
        ...metricHourlyBase,
        safety_score: safetySeries,
      };

      const hour = clamp(selectedTimeIndex, 0, 24);
      const previousHour = clamp(hour - 1, 0, 24);

      const metricValues = {
        aqi: metricHourly.aqi[hour],
        temperature: metricHourly.temperature[hour],
        uv: metricHourly.uv[hour],
        rainfall: metricHourly.rainfall[hour],
        humidity: metricHourly.humidity[hour],
        noise: metricHourly.noise[hour],
        safety_score: metricHourly.safety_score[hour],
      };

      const trendByMetric = {
        aqi: metricHourly.aqi[hour] > metricHourly.aqi[previousHour] ? 'up' : metricHourly.aqi[hour] < metricHourly.aqi[previousHour] ? 'down' : 'stable',
        temperature: metricHourly.temperature[hour] > metricHourly.temperature[previousHour] ? 'up' : metricHourly.temperature[hour] < metricHourly.temperature[previousHour] ? 'down' : 'stable',
        uv: metricHourly.uv[hour] > metricHourly.uv[previousHour] ? 'up' : metricHourly.uv[hour] < metricHourly.uv[previousHour] ? 'down' : 'stable',
        rainfall: metricHourly.rainfall[hour] > metricHourly.rainfall[previousHour] ? 'up' : metricHourly.rainfall[hour] < metricHourly.rainfall[previousHour] ? 'down' : 'stable',
        humidity: metricHourly.humidity[hour] > metricHourly.humidity[previousHour] ? 'up' : metricHourly.humidity[hour] < metricHourly.humidity[previousHour] ? 'down' : 'stable',
        noise: metricHourly.noise[hour] > metricHourly.noise[previousHour] ? 'up' : metricHourly.noise[hour] < metricHourly.noise[previousHour] ? 'down' : 'stable',
        safety_score: metricHourly.safety_score[hour] > metricHourly.safety_score[previousHour] ? 'up' : metricHourly.safety_score[hour] < metricHourly.safety_score[previousHour] ? 'down' : 'stable',
      } as MapPointData['trendByMetric'];

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
    isLoadingVisibleData,
    microAlerts,
    getOrFetchLocationData,
  };
}
