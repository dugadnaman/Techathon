'use client';

import type { MapBounds } from '@/features/map-engine/context/MapContext';

export interface AsiaAnchorPoint {
  name: string;
  lat: number;
  lon: number;
}

export const ASIA_MAP_BOUNDS: MapBounds = {
  north: 55,
  south: -10,
  west: 25,
  east: 180,
};

export const ASIA_MAP_CENTER: [number, number] = [27, 96];
export const ASIA_DEFAULT_ZOOM = 4;
export const ASIA_MIN_ZOOM = 3;
export const ASIA_MAX_ZOOM = 14;

export const ASIA_HEATMAP_ANCHORS: AsiaAnchorPoint[] = [
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753 },
  { name: 'Tehran', lat: 35.6892, lon: 51.3890 },
  { name: 'Karachi', lat: 24.8607, lon: 67.0011 },
  { name: 'Lahore', lat: 31.5204, lon: 74.3587 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { name: 'Kathmandu', lat: 27.7172, lon: 85.3240 },
  { name: 'Yangon', lat: 16.8409, lon: 96.1735 },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Manila', lat: 14.5995, lon: 120.9842 },
  { name: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297 },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Taipei', lat: 25.0330, lon: 121.5654 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
];

export function clampBoundsToAsia(bounds: MapBounds | null): MapBounds {
  if (!bounds) return ASIA_MAP_BOUNDS;

  return {
    north: Math.min(ASIA_MAP_BOUNDS.north, bounds.north),
    south: Math.max(ASIA_MAP_BOUNDS.south, bounds.south),
    east: Math.min(ASIA_MAP_BOUNDS.east, bounds.east),
    west: Math.max(ASIA_MAP_BOUNDS.west, bounds.west),
  };
}
