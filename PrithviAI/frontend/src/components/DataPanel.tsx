'use client';

/**
 * Prithvi — Data Panel Component
 * Theme-aware floating panel with environmental metrics.
 */

import { motion } from 'framer-motion';
import { Wind, Thermometer, Droplets, Sun, CloudRain, Volume2, Eye, Gauge } from 'lucide-react';
import type { LocationData, RiskLevel } from '@/types';
import { getRiskColor, getRiskBgColor, getRiskBadgeBg, getRiskHexColor, getRiskEmoji } from '@/lib/utils';
import DataConfidenceBadge from '@/components/DataConfidenceBadge';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface DataPanelProps {
  data: LocationData | null;
  isLoading: boolean;
  error: string | null;
}

function MetricCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-secondary/50 rounded-2xl hover:bg-surface-secondary transition-colors">
      <div className={`p-2 rounded-xl ${color || 'bg-blue-500/10 text-blue-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-micro uppercase tracking-wider text-content-secondary truncate">{label}</p>
        <p className="text-sm font-semibold text-content-primary">
          {value} <span className="text-xs font-normal text-content-secondary">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function DataPanel({ data, isLoading, error }: DataPanelProps) {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-sm font-semibold text-risk-high mb-1">Error Loading Data</h3>
          <p className="text-xs text-content-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-content-secondary">Fetching environmental data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">📍</div>
          <h3 className="text-base font-semibold text-content-primary mb-2">Select a Location</h3>
          <p className="text-sm text-content-secondary max-w-[220px]">
            Click anywhere on the map or tap a marker to view real-time environmental data
          </p>
        </div>
      </div>
    );
  }

  const env = data.environment;
  const safety = data.safety_index;
  const level = safety.overall_level as RiskLevel;

  return (
    <div className="h-full overflow-y-auto">
      {/* Location Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className={`p-4 ${getRiskBgColor(level)} border-b border-surface-secondary`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-content-primary">{data.location_name}</h2>
            <p className="text-xs text-content-secondary mt-0.5">
              {data.lat.toFixed(4)}°N, {data.lon.toFixed(4)}°E
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold ${getRiskBadgeBg(level)}`}>
            {getRiskEmoji(level)} {level}
          </span>
        </div>

        {/* Safety Score Bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-content-secondary">Safety Score</span>
            <span className={`text-sm font-bold ${getRiskColor(level)}`}>
              {Math.round(safety.overall_score)}/100
            </span>
          </div>
          <div className="w-full h-2 bg-surface-primary/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, safety.overall_score)}%` }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
              className="h-full rounded-full"
              style={{ backgroundColor: getRiskHexColor(level) }}
            />
          </div>
        </div>

        {data.data_quality && (
          <div className="mt-3">
            <DataConfidenceBadge dataQuality={data.data_quality} />
          </div>
        )}
      </motion.div>

      {/* Environmental Metrics Grid */}
      <div className="p-4">
        <h3 className="text-micro font-semibold text-content-secondary uppercase tracking-wider mb-3">
          Environmental Data
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard icon={<Thermometer size={16} />} label="Temperature" value={env.temperature?.toFixed(1) ?? '--'} unit="°C" color="bg-red-500/10 text-red-500" />
          <MetricCard icon={<Thermometer size={16} />} label="Feels Like" value={env.feels_like?.toFixed(1) ?? '--'} unit="°C" color="bg-orange-500/10 text-orange-500" />
          <MetricCard icon={<Wind size={16} />} label="AQI" value={env.aqi ?? '--'} unit="" color="bg-purple-500/10 text-purple-500" />
          <MetricCard icon={<Gauge size={16} />} label="PM2.5" value={env.pm25?.toFixed(0) ?? '--'} unit="µg/m³" color="bg-violet-500/10 text-violet-500" />
          <MetricCard icon={<Droplets size={16} />} label="Humidity" value={env.humidity?.toFixed(0) ?? '--'} unit="%" color="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={<Wind size={16} />} label="Wind" value={env.wind_speed?.toFixed(1) ?? '--'} unit="m/s" color="bg-teal-500/10 text-teal-500" />
          <MetricCard icon={<Sun size={16} />} label="UV Index" value={env.uv_index?.toFixed(1) ?? '--'} unit="" color="bg-yellow-500/10 text-yellow-500" />
          <MetricCard icon={<CloudRain size={16} />} label="Rainfall" value={env.rainfall?.toFixed(1) ?? '--'} unit="mm/hr" color="bg-sky-500/10 text-sky-500" />
          <MetricCard icon={<Volume2 size={16} />} label="Noise" value={env.noise_db?.toFixed(0) ?? '--'} unit="dB" color="bg-pink-500/10 text-pink-500" />
          <MetricCard icon={<Eye size={16} />} label="Visibility" value={env.visibility ? (env.visibility / 1000).toFixed(1) : '--'} unit="km" color="bg-emerald-500/10 text-emerald-500" />
        </div>
      </div>

      {/* Risk Factors */}
      {safety.top_risks && safety.top_risks.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-micro font-semibold text-content-secondary uppercase tracking-wider mb-3">
            Top Risk Factors
          </h3>
          <div className="space-y-2">
            {safety.top_risks.map((risk: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: EASE_OUT }}
                className={`p-3 rounded-2xl border ${getRiskBgColor(risk.level)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-content-primary">
                    {risk.icon} {risk.name}
                  </span>
                  <span className={`text-xs font-bold ${getRiskColor(risk.level)}`}>
                    {risk.score}/100
                  </span>
                </div>
                <p className="text-xs text-content-secondary">{risk.reason}</p>
                <p className="text-xs text-content-secondary/70 mt-1 italic">{risk.recommendation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {safety.summary && (
        <div className="px-4 pb-4">
          <h3 className="text-micro font-semibold text-content-secondary uppercase tracking-wider mb-2">
            Assessment
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed bg-surface-secondary/50 p-3 rounded-2xl">
            {safety.summary}
          </p>
        </div>
      )}
    </div>
  );
}
