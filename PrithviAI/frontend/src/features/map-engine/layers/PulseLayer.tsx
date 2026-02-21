'use client';

import { memo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { getMetricColor, thresholdState } from '@/features/map-engine/logic/metrics';
import type { PulseLayerProps } from './types';

function createPulseIcon(color: string, durationSeconds: number): L.DivIcon {
  return L.divIcon({
    className: 'map-pulse-zone',
    html: `<span class="map-pulse-ring" style="--pulse-color:${color};--pulse-duration:${durationSeconds}s;"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function PulseLayerComponent({ points, selectedMetric, timeIndex }: PulseLayerProps) {
  const pulseMarkers = points
    .map((point) => {
      const series = point.metricHourly[selectedMetric];
      const value = series[Math.max(0, Math.min(series.length - 1, timeIndex))];
      const state = thresholdState(selectedMetric, value);
      if (state === 'normal' || state === 'moderate') return null;

      const pulseDuration =
        state === 'severe' ? 1.1 :
          state === 'high' ? 1.8 : 2.8;
      const color = getMetricColor(selectedMetric, value);
      return {
        point,
        pulseDuration,
        color,
        state,
        metricValue: value,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      const stateWeight = (value: 'high' | 'severe') => (value === 'severe' ? 2 : 1);
      return stateWeight(b.state) - stateWeight(a.state) || b.metricValue - a.metricValue;
    })
    .slice(0, 36);

  if (pulseMarkers.length === 0) return null;

  return (
    <>
      <style jsx global>{`
        .map-pulse-ring {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          display: block;
          border: 2px solid var(--pulse-color);
          background: color-mix(in srgb, var(--pulse-color) 30%, transparent);
          animation: map-zone-pulse var(--pulse-duration) ease-out infinite;
        }
        @keyframes map-zone-pulse {
          0% { transform: scale(0.72); opacity: 0.95; }
          65% { transform: scale(1.45); opacity: 0.25; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>
      {pulseMarkers.map(({ point, pulseDuration, color }) => (
        <Marker
          key={`pulse-${point.name}`}
          position={[point.lat, point.lon]}
          icon={createPulseIcon(color, pulseDuration)}
          interactive={false}
        />
      ))}
    </>
  );
}

export const PulseLayer = memo(PulseLayerComponent);
