'use client';

import { memo } from 'react';
import { MarkerLayer } from './MarkerLayer';
import { HeatmapLayer } from './HeatmapLayer';
import { PulseLayer } from './PulseLayer';
import { AlertLayer } from './AlertLayer';
import { RouteLayer } from './RouteLayer';
import type { MapPointData, MarkerLayerProps } from './types';
import type { MapMetric } from '@/features/map-engine/context/MapContext';

interface LayerManagerProps {
  markerLayer: MarkerLayerProps;
  points: MapPointData[];
  heatmapPoints?: MapPointData[];
  selectedMetric: MapMetric;
  selectedTimeIndex: number;
  dismissedAlerts: Set<string>;
  onDismissAlert: (id: string) => void;
  userLocation: { lat: number; lon: number } | null;
  safestPoint: { lat: number; lon: number; name: string } | null;
}

function LayerManagerComponent({
  markerLayer,
  points,
  heatmapPoints,
  selectedMetric,
  selectedTimeIndex,
  dismissedAlerts,
  onDismissAlert,
  userLocation,
  safestPoint,
}: LayerManagerProps) {
  const surfacePoints = heatmapPoints ?? points;

  return (
    <>
      <HeatmapLayer
        points={surfacePoints}
        selectedMetric={selectedMetric}
        timeIndex={selectedTimeIndex}
      />
      <PulseLayer
        points={surfacePoints}
        selectedMetric={selectedMetric}
        timeIndex={selectedTimeIndex}
      />
      <RouteLayer userLocation={userLocation} safestPoint={safestPoint} />
      <AlertLayer
        points={points}
        timeIndex={selectedTimeIndex}
        selectedMetric={selectedMetric}
        dismissedAlerts={dismissedAlerts}
        onDismissAlert={onDismissAlert}
      />
      <MarkerLayer {...markerLayer} />
    </>
  );
}

export const LayerManager = memo(LayerManagerComponent);
