'use client';

import { memo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { thresholdState } from '@/features/map-engine/logic/metrics';
import type { AlertLayerProps } from './types';

function createAlertIcon(color: string, text: string): L.DivIcon {
  return L.divIcon({
    className: 'map-alert-pill',
    html: `<span class="map-alert-pill__text" style="--alert-color:${color};">${text}</span>`,
    iconSize: [96, 24],
    iconAnchor: [48, 12],
  });
}

function AlertLayerComponent({
  points,
  timeIndex,
  selectedMetric,
  dismissedAlerts,
  onDismissAlert,
}: AlertLayerProps) {
  const badges = points.flatMap((point) => {
    const alertBadges = point.alerts.map((alertText, idx) => ({
      id: `${point.name}-base-${idx}-${timeIndex}`,
      text: alertText,
      lat: point.lat + idx * 0.00055,
      lon: point.lon + idx * 0.0004,
      color: '#f59e0b',
    }));

    const metricValue = point.metricHourly[selectedMetric][Math.max(0, Math.min(24, timeIndex))];
    const metricState = thresholdState(selectedMetric, metricValue);
    if (metricState !== 'normal') {
      alertBadges.push({
        id: `${point.name}-${selectedMetric}-${timeIndex}`,
        text: `${selectedMetric.replace('_', ' ')} ${metricState}`,
        lat: point.lat - 0.00045,
        lon: point.lon - 0.00035,
        color: metricState === 'severe' ? '#ef4444' : metricState === 'high' ? '#f97316' : '#f59e0b',
      });
    }

    return alertBadges.filter((badge) => !dismissedAlerts.has(badge.id));
  });

  if (badges.length === 0) return null;

  return (
    <>
      <style jsx global>{`
        .map-alert-pill__text {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          min-width: 86px;
          padding: 0 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          background: var(--alert-color);
          box-shadow: 0 3px 10px color-mix(in srgb, var(--alert-color) 35%, transparent);
        }
      `}</style>
      {badges.map((badge) => (
        <Marker
          key={badge.id}
          position={[badge.lat, badge.lon]}
          icon={createAlertIcon(badge.color, badge.text)}
          eventHandlers={{
            click: () => onDismissAlert(badge.id),
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.9} sticky>
            <span className="text-xs">Tap to dismiss</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

export const AlertLayer = memo(AlertLayerComponent);
