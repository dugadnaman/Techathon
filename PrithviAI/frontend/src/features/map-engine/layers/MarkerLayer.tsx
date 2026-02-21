'use client';

import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getRiskHexColor } from '@/lib/utils';
import type { MarkerLayerProps } from './types';

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

function MarkerLayerComponent({
  landmarks,
  selectedLocation,
  clickedPos,
  landmarkRiskLevels,
  pointsByName,
  selectedMetric,
  selectedTimeIndex,
  onLandmarkClick,
  onClickedPointSelect,
}: MarkerLayerProps) {
  const trendArrow = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <span className="text-red-500 font-semibold">↑</span>;
    if (trend === 'down') return <span className="text-green-500 font-semibold">↓</span>;
    return <span className="text-gray-500 font-semibold">→</span>;
  };

  return (
    <>
      {landmarks.map((landmark) => {
        const riskLevel = landmarkRiskLevels[landmark.name];
        const point = pointsByName[landmark.name];
        const trend = point?.trendByMetric[selectedMetric] ?? 'stable';
        const metricSeries = point?.metricHourly[selectedMetric] ?? [];
        const metricValue = metricSeries[Math.max(0, Math.min(selectedTimeIndex, metricSeries.length - 1))];
        const color = riskLevel ? getRiskHexColor(riskLevel) : '#3b82f6';
        const isSelected = selectedLocation?.name === landmark.name;

        return (
          <Marker
            key={landmark.name}
            position={[landmark.lat, landmark.lon]}
            icon={createColoredIcon(color, isSelected)}
            eventHandlers={{
              click: () => onLandmarkClick(landmark),
            }}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-sm">{landmark.name}</strong>
                <p className="text-xs text-gray-500 mt-1">{landmark.description}</p>
                {Number.isFinite(metricValue) ? (
                  <p className="text-xs text-gray-700 mt-1 inline-flex items-center gap-1">
                    <span className="capitalize">{selectedMetric.replace('_', ' ')}</span>
                    <span className="font-semibold">{metricValue.toFixed(selectedMetric === 'temperature' || selectedMetric === 'rainfall' || selectedMetric === 'uv' ? 1 : 0)}</span>
                    {trendArrow(trend)}
                  </p>
                ) : null}
                <button
                  onClick={() => onLandmarkClick(landmark)}
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
              <button
                onClick={() => onClickedPointSelect(clickedPos.lat, clickedPos.lon)}
                className="mt-2 text-xs px-3 py-1 bg-violet-500 text-white rounded-full hover:bg-violet-600"
              >
                View Data
              </button>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

export const MarkerLayer = memo(MarkerLayerComponent);
