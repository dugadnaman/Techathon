'use client';

/**
 * PrithviAI — Environment Snapshot
 * Quick visual overview of current environmental conditions.
 */

import type { EnvironmentData } from '@/types';
import type { Language } from '@/types';
import { Thermometer, Wind, Droplets, Sun, CloudRain, Volume2, Eye } from 'lucide-react';
import { t } from '@/lib/translations';

interface EnvironmentSnapshotProps {
  data: EnvironmentData | null;
  loading?: boolean;
  language?: Language;
}

export default function EnvironmentSnapshot({ data, loading, language = 'en' }: EnvironmentSnapshotProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-100 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  // AQI category label based on US EPA standards
  const getAqiCategory = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy (SG)';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const metrics = [
    {
      label: t('temperature', language),
      value: `${data.temperature.toFixed(0)}°C`,
      sub: `${t('feelsLike', language)} ${data.feels_like.toFixed(0)}°C`,
      icon: <Thermometer size={18} className="text-red-400" />,
      color: data.temperature > 35 ? 'text-red-600' : data.temperature > 28 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('airQuality', language),
      value: `AQI ${data.aqi}`,
      sub: `${getAqiCategory(data.aqi)} · PM2.5: ${data.pm25.toFixed(0)} µg/m³`,
      icon: <Wind size={18} className="text-blue-400" />,
      color: data.aqi > 200 ? 'text-purple-700' : data.aqi > 150 ? 'text-red-600' : data.aqi > 100 ? 'text-amber-600' : data.aqi > 50 ? 'text-yellow-600' : 'text-green-600',
    },
    {
      label: t('humidity', language),
      value: `${data.humidity.toFixed(0)}%`,
      sub: data.humidity > 70 ? 'High' : data.humidity < 35 ? 'Low' : 'Normal',
      icon: <Droplets size={18} className="text-cyan-400" />,
      color: data.humidity > 75 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('uvIndex', language),
      value: data.uv_index.toFixed(1),
      sub: data.uv_index > 7 ? 'Very High' : data.uv_index > 5 ? 'High' : data.uv_index > 2 ? 'Moderate' : 'Low',
      icon: <Sun size={18} className="text-yellow-400" />,
      color: data.uv_index > 7 ? 'text-red-600' : data.uv_index > 5 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('rainfall', language),
      value: `${data.rainfall.toFixed(1)} mm`,
      sub: data.rainfall > 7.5 ? 'Heavy' : data.rainfall > 2.5 ? 'Moderate' : data.rainfall > 0 ? 'Light' : 'None',
      icon: <CloudRain size={18} className="text-blue-500" />,
      color: data.rainfall > 7.5 ? 'text-red-600' : data.rainfall > 2.5 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('noise', language),
      value: `${data.noise_db.toFixed(0)} dB`,
      sub: data.noise_db > 70 ? 'Loud' : data.noise_db > 55 ? 'Moderate' : 'Quiet',
      icon: <Volume2 size={18} className="text-purple-400" />,
      color: data.noise_db > 70 ? 'text-red-600' : data.noise_db > 55 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('wind', language),
      value: `${data.wind_speed.toFixed(1)} m/s`,
      sub: data.wind_speed > 10 ? 'Strong' : data.wind_speed > 5 ? 'Moderate' : 'Light',
      icon: <Wind size={18} className="text-teal-400" />,
      color: 'text-gray-700',
    },
    {
      label: t('visibility', language),
      value: `${data.visibility.toFixed(1)} km`,
      sub: data.visibility < 2 ? 'Poor' : data.visibility < 5 ? 'Moderate' : 'Good',
      icon: <Eye size={18} className="text-gray-400" />,
      color: data.visibility < 2 ? 'text-red-600' : 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            {metric.icon}
            <span className="text-xs font-medium text-gray-500">{metric.label}</span>
          </div>
          <div className={`text-xl font-bold ${metric.color}`}>
            {metric.value}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{metric.sub}</div>
        </div>
      ))}
    </div>
  );
}
