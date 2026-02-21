'use client';

import { createContext, useContext, useMemo, useState } from 'react';

export type MapMetric =
  | 'aqi'
  | 'temperature'
  | 'uv'
  | 'rainfall'
  | 'humidity'
  | 'noise'
  | 'safety_score';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapSelectedLocation {
  lat: number;
  lon: number;
  name: string;
}

interface MapContextValue {
  selectedMetric: MapMetric;
  setSelectedMetric: (metric: MapMetric) => void;
  seniorMode: boolean;
  setSeniorMode: (enabled: boolean) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  selectedLocation: MapSelectedLocation | null;
  setSelectedLocation: (location: MapSelectedLocation | null) => void;
  visibleBounds: MapBounds | null;
  setVisibleBounds: (bounds: MapBounds | null) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({
  children,
  initialLocation = null,
}: {
  children: React.ReactNode;
  initialLocation?: MapSelectedLocation | null;
}) {
  const [selectedMetric, setSelectedMetric] = useState<MapMetric>('aqi');
  const [seniorMode, setSeniorMode] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(new Date().getHours());
  const [selectedLocation, setSelectedLocation] = useState<MapSelectedLocation | null>(initialLocation);
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null);

  const value = useMemo<MapContextValue>(
    () => ({
      selectedMetric,
      setSelectedMetric,
      seniorMode,
      setSeniorMode,
      selectedTimeIndex,
      setSelectedTimeIndex,
      selectedLocation,
      setSelectedLocation,
      visibleBounds,
      setVisibleBounds,
    }),
    [selectedMetric, seniorMode, selectedTimeIndex, selectedLocation, visibleBounds],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const value = useContext(MapContext);
  if (!value) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return value;
}
