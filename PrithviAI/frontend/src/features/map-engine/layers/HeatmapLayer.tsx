'use client';

import { memo, useMemo } from 'react';
import { Circle } from 'react-leaflet';
import L from 'leaflet';
import { getMetricColor, thresholdState } from '@/features/map-engine/logic/metrics';
import type { HeatmapLayerProps } from './types';

function HeatmapLayerComponent({ points, selectedMetric, timeIndex }: HeatmapLayerProps) {
  const renderer = useMemo(() => L.canvas({ padding: 0.3 }), []);

  if (points.length === 0) return null;

  return (
    <>
      <style jsx global>{`
        .map-heat-circle {
          transition: fill 240ms ease, stroke 240ms ease, fill-opacity 240ms ease, stroke-opacity 240ms ease;
        }
      `}</style>
      {points.map((point) => {
        const series = point.metricHourly[selectedMetric];
        const value = series[Math.max(0, Math.min(series.length - 1, timeIndex))];
        const threshold = thresholdState(selectedMetric, value);
        const color = getMetricColor(selectedMetric, value);
        const radius =
          threshold === 'severe' ? 420 :
            threshold === 'high' ? 340 :
              threshold === 'moderate' ? 280 : 220;

        return (
          <Circle
            key={`heat-${point.name}`}
            center={[point.lat, point.lon]}
            radius={radius}
            renderer={renderer}
            pathOptions={{
              className: 'map-heat-circle',
              color,
              fillColor: color,
              weight: 0,
              fillOpacity: threshold === 'normal' ? 0.15 : threshold === 'moderate' ? 0.24 : threshold === 'high' ? 0.31 : 0.36,
            }}
          />
        );
      })}
    </>
  );
}

export const HeatmapLayer = memo(HeatmapLayerComponent);
