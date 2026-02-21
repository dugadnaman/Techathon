'use client';

/**
 * Prithvi — Interactive Map Component
 * Leaflet map shell that delegates layer rendering to LayerManager.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Landmark, RiskLevel } from '@/types';
import { LayerManager } from '@/features/map-engine/layers/LayerManager';
import { useMapContext } from '@/features/map-engine/context/MapContext';
import type { MapPointData } from '@/features/map-engine/layers/types';
import type { MapMetric } from '@/features/map-engine/context/MapContext';

import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 14, { duration: 1 });
  }, [lat, lon, map]);
  return null;
}

function MapViewportBridge() {
  const { setVisibleBounds } = useMapContext();
  const map = useMap();

  useEffect(() => {
    const bounds = map.getBounds();
    setVisibleBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [map, setVisibleBounds]);

  useMapEvents({
    moveend: (event) => {
      const bounds = event.target.getBounds();
      setVisibleBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend: (event) => {
      const bounds = event.target.getBounds();
      setVisibleBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  return null;
}

interface InteractiveMapProps {
  landmarks: Landmark[];
  selectedLocation: { lat: number; lon: number; name: string } | null;
  onLocationSelect: (lat: number, lon: number, name: string) => void;
  landmarkRiskLevels?: Record<string, RiskLevel>;
  isLoading?: boolean;
}

export default function InteractiveMap({
  landmarks,
  selectedLocation,
  onLocationSelect,
  landmarkRiskLevels = {},
  isLoading = false,
}: InteractiveMapProps) {
  const [clickedPos, setClickedPos] = useState<{ lat: number; lon: number } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [userLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [safestPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);

  const {
    selectedMetric,
    selectedTimeIndex,
    setSelectedLocation: setContextSelectedLocation,
  } = useMapContext();

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setContextSelectedLocation(selectedLocation);
  }, [selectedLocation, setContextSelectedLocation]);

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      setClickedPos({ lat, lon });
      setContextSelectedLocation({ lat, lon, name: '' });
      onLocationSelect(lat, lon, '');
    },
    [onLocationSelect, setContextSelectedLocation],
  );

  const handleLandmarkClick = useCallback(
    (lm: Landmark) => {
      setClickedPos({ lat: lm.lat, lon: lm.lon });
      setContextSelectedLocation({ lat: lm.lat, lon: lm.lon, name: lm.name });
      onLocationSelect(lm.lat, lm.lon, lm.name);
    },
    [onLocationSelect, setContextSelectedLocation],
  );

  const handleClickedPointSelect = useCallback(
    (lat: number, lon: number) => {
      setContextSelectedLocation({ lat, lon, name: '' });
      onLocationSelect(lat, lon, '');
    },
    [onLocationSelect, setContextSelectedLocation],
  );

  const points = useMemo<MapPointData[]>(() => {
    return landmarks.map((lm) => {
      const riskLevel = landmarkRiskLevels[lm.name] || 'MODERATE';
      const baseScore = riskLevel === 'LOW' ? 25 : riskLevel === 'HIGH' ? 75 : 50;
      const defaultSeries = Array.from({ length: 25 }, (_, hour) =>
        Math.max(0, Math.min(100, baseScore + Math.round(Math.sin(hour / 24 * Math.PI * 2) * 5))),
      );

      return {
        name: lm.name,
        lat: lm.lat,
        lon: lm.lon,
        riskLevel,
        primaryRisk: 'AQI',
        alerts: [],
        metricValues: {
          aqi: baseScore * 2,
          temperature: 22 + baseScore * 0.2,
          uv: 2 + baseScore * 0.06,
          rainfall: baseScore * 0.08,
          humidity: 35 + baseScore * 0.5,
          noise: 45 + baseScore * 0.4,
          safety_score: baseScore,
        },
        metricHourly: {
          aqi: defaultSeries.map((v) => v * 2),
          temperature: defaultSeries.map((v) => 18 + v * 0.25),
          uv: defaultSeries.map((v) => 1 + v * 0.08),
          rainfall: defaultSeries.map((v) => v * 0.12),
          humidity: defaultSeries.map((v) => 30 + v * 0.55),
          noise: defaultSeries.map((v) => 40 + v * 0.5),
          safety_score: defaultSeries,
        } satisfies Record<MapMetric, number[]>,
      };
    });
  }, [landmarks, landmarkRiskLevels]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-surface-secondary shadow-elevated">
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-surface-primary/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 glass-card-solid px-5 py-3 rounded-2xl shadow-elevated">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-content-primary font-medium">Loading location data...</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
      `}</style>

      <MapContainer
        center={[19.076, 72.8777]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

        <MapClickHandler onMapClick={handleMapClick} />
        <MapViewportBridge />

        {selectedLocation && (
          <FlyToLocation lat={selectedLocation.lat} lon={selectedLocation.lon} />
        )}

        <LayerManager
          markerLayer={{
            landmarks,
            selectedLocation,
            clickedPos,
            landmarkRiskLevels,
            onLandmarkClick: handleLandmarkClick,
            onClickedPointSelect: handleClickedPointSelect,
          }}
          points={points}
          selectedMetric={selectedMetric}
          selectedTimeIndex={selectedTimeIndex}
          dismissedAlerts={dismissedAlerts}
          onDismissAlert={(id) => {
            setDismissedAlerts((prev) => {
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }}
          userLocation={userLocation}
          safestPoint={safestPoint}
        />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-2xl px-4 py-3 text-xs">
        <p className="font-semibold text-content-primary mb-2">Risk Level</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-content-secondary">
            <span className="w-3 h-3 rounded-full bg-risk-low inline-block" /> Low
          </span>
          <span className="flex items-center gap-1.5 text-content-secondary">
            <span className="w-3 h-3 rounded-full bg-risk-moderate inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1.5 text-content-secondary">
            <span className="w-3 h-3 rounded-full bg-risk-high inline-block" /> High
          </span>
        </div>
      </div>
    </div>
  );
}
