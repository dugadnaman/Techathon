'use client';

import { memo } from 'react';
import { CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import type { RouteLayerProps } from './types';

function RouteLayerComponent({ userLocation, safestPoint }: RouteLayerProps) {
  if (!userLocation || !safestPoint) return null;

  return (
    <>
      <Polyline
        positions={[
          [userLocation.lat, userLocation.lon],
          [safestPoint.lat, safestPoint.lon],
        ]}
        pathOptions={{
          color: '#14b8a6',
          weight: 3,
          opacity: 0.9,
          dashArray: '6 6',
        }}
      />
      <CircleMarker
        center={[userLocation.lat, userLocation.lon]}
        radius={7}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.95 }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
          You are here
        </Tooltip>
      </CircleMarker>
      <CircleMarker
        center={[safestPoint.lat, safestPoint.lon]}
        radius={8}
        pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.95 }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
          Safest nearby: {safestPoint.name}
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export const RouteLayer = memo(RouteLayerComponent);
