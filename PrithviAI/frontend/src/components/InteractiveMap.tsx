'use client';

/**
 * PrithviAI — Interactive Map Component
 * Leaflet-based map with clickable locations and landmark markers.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Landmark } from '@/types';
import { getRiskHexColor } from '@/lib/utils';
import type { RiskLevel } from '@/types';

import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default icon issue with Next.js ────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom colored marker factory ──────────────────────

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
      ${isSelected ? 'animation: pulse 1.5s ease infinite;' : ''}
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

// ─── Click handler component ────────────────────────────

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Fly to selected location ───────────────────────────

function FlyToLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 14, { duration: 1 });
  }, [lat, lon, map]);
  return null;
}

// ─── Props ──────────────────────────────────────────────

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

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-md">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 font-medium">Loading location data...</span>
          </div>
        </div>
      )}

      {/* Pulse animation for selected marker */}
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Fly to selected location */}
        {selectedLocation && (
          <FlyToLocation lat={selectedLocation.lat} lon={selectedLocation.lon} />
        )}

        {/* Landmark markers */}
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

        {/* Clicked position marker (when clicking arbitrary location) */}
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
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md text-xs">
        <p className="font-semibold text-gray-700 mb-2">Risk Level</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> High
          </span>
        </div>
      </div>
    </div>
  );
}
