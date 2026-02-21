'use client';

/**
 * Prithvi — Interactive Map Component
 * Leaflet map with dark/light tile support and theme-aware styling.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Landmark } from '@/types';
import { getRiskHexColor } from '@/lib/utils';
import type { RiskLevel } from '@/types';

import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColoredIcon(color: string, isSelected = false): L.DivIcon {
  const size = isSelected ? 18 : 12;
  const border = isSelected ? 4 : 3;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${border}px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

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

  // Detect dark mode
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      setClickedPos({ lat, lon });
      onLocationSelect(lat, lon, '');
    },
    [onLocationSelect],
  );

  const handleLandmarkClick = useCallback(
    (lm: Landmark) => {
      setClickedPos({ lat: lm.lat, lon: lm.lon });
      onLocationSelect(lm.lat, lm.lon, lm.name);
    },
    [onLocationSelect],
  );

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-surface-secondary shadow-elevated">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-surface-primary/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 glass-card-solid px-5 py-3 rounded-2xl shadow-elevated">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-content-primary font-medium">Loading location data...</span>
          </div>
        </div>
      )}

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

        {selectedLocation && (
          <FlyToLocation lat={selectedLocation.lat} lon={selectedLocation.lon} />
        )}

        {landmarks.map((lm) => {
          const riskLevel = landmarkRiskLevels[lm.name];
          const color = riskLevel ? getRiskHexColor(riskLevel) : '#3b82f6';
          const isSelected = selectedLocation?.name === lm.name;

          return (
            <Marker
              key={lm.name}
              position={[lm.lat, lm.lon]}
              icon={createColoredIcon(color, isSelected)}
              eventHandlers={{
                click: () => handleLandmarkClick(lm),
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-sm">{lm.name}</strong>
                  <p className="text-xs text-gray-500 mt-1">{lm.description}</p>
                  <button
                    onClick={() => handleLandmarkClick(lm)}
                    className="mt-2 text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                  >
                    View Data
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {clickedPos && !landmarks.some((lm) => lm.lat === clickedPos.lat && lm.lon === clickedPos.lon) && (
          <Marker
            position={[clickedPos.lat, clickedPos.lon]}
            icon={createColoredIcon('#8b5cf6', true)}
          >
            <Popup>
              <div className="text-center text-xs">
                <strong>Selected Point</strong>
                <p className="text-gray-500">
                  {clickedPos.lat.toFixed(4)}, {clickedPos.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map legend */}
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
