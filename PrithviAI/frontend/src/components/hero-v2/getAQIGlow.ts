/**
 * PrithviAI — AQI-reactive Glow Mapping
 * Maps live AQI values to radial glow colors for the Earth overlay.
 * Max opacity capped at 0.30 for elegance.
 */

export interface AQIGlowState {
  color: string;
  label: string;
  intensity: number; // 0-1 normalized
}

export function getAQIGlow(aqi: number): string {
  if (aqi <= 50) return 'rgba(34,197,94,0.18)';
  if (aqi <= 100) return 'rgba(20,184,166,0.20)';
  if (aqi <= 200) return 'rgba(245,158,11,0.24)';
  if (aqi <= 300) return 'rgba(239,68,68,0.26)';
  return 'rgba(185,28,28,0.30)';
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#22C55E';
  if (aqi <= 100) return '#14B8A6';
  if (aqi <= 200) return '#F59E0B';
  if (aqi <= 300) return '#EF4444';
  return '#B91C1C';
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAQIState(aqi: number): AQIGlowState {
  return {
    color: getAQIGlow(aqi),
    label: getAQILabel(aqi),
    intensity: Math.min(aqi / 300, 1),
  };
}
