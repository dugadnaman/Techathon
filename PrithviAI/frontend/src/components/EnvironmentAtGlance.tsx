'use client';

/**
 * Prithvi — Environment At-a-Glance
 * Compact summary cards to fill space below Daily Safety Guide.
 */

import { motion } from 'framer-motion';
import { Droplets, Thermometer, Wind, Eye, Volume2, CloudRain } from 'lucide-react';
import type { EnvironmentData } from '@/types';

interface EnvironmentAtGlanceProps {
  data: EnvironmentData | null;
}

function getAqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: 'Good', color: 'text-risk-low' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-risk-moderate' };
  return { label: 'Unhealthy', color: 'text-risk-high' };
}

function getComfortLevel(temp: number, humidity: number): { label: string; icon: string } {
  if (temp > 38) return { label: 'Uncomfortable — Stay Hydrated', icon: '🥵' };
  if (temp > 32) return { label: 'Warm — Limit Outdoor Time', icon: '😓' };
  if (temp < 10) return { label: 'Cold — Dress Warmly', icon: '🥶' };
  return { label: 'Comfortable', icon: '😊' };
}

export default function EnvironmentAtGlance({ data }: EnvironmentAtGlanceProps) {
  if (!data) return null;

  const aqiInfo = getAqiLabel(data.aqi || 0);
  const comfort = getComfortLevel(data.temperature || 25, data.humidity || 50);

  const highlights = [
    {
      icon: <Thermometer size={16} className="text-orange-400" />,
      label: 'Comfort Level',
      value: `${comfort.icon} ${comfort.label}`,
    },
    {
      icon: <Wind size={16} className="text-blue-400" />,
      label: 'Air Quality',
      value: `${aqiInfo.label}`,
      valueClass: aqiInfo.color,
    },
    {
      icon: <Eye size={16} className="text-purple-400" />,
      label: 'Visibility',
      value: (data.visibility || 0) >= 8 ? '👁️ Clear' : (data.visibility || 0) >= 4 ? '🌫️ Moderate' : '⚠️ Poor',
    },
    {
      icon: <Volume2 size={16} className="text-indigo-400" />,
      label: 'Noise',
      value: (data.noise_db || 0) <= 50 ? '🤫 Quiet' : (data.noise_db || 0) <= 70 ? '🔊 Moderate' : '📢 Loud',
    },
  ];

  return (
    <div className="glass-card-solid rounded-3xl p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-content-primary">Environment At a Glance</h3>
        <p className="text-xs text-content-secondary">Quick status summary</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {highlights.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ scale: 1.03, y: -1 }}
            className="p-3 rounded-xl bg-surface-primary/50 dark:bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon}
              <span className="text-xs text-content-secondary font-medium">{item.label}</span>
            </div>
            <p className={`text-sm font-semibold ${item.valueClass || 'text-content-primary'}`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Outdoor Activity Score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-content-secondary font-medium">Outdoor Activity Score</p>
            <p className="text-sm text-content-primary font-semibold mt-0.5">
              {getOutdoorScore(data)} / 10
            </p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.03 }}
                className={`w-1.5 rounded-full origin-bottom ${
                  i < getOutdoorScore(data)
                    ? 'bg-accent'
                    : 'bg-surface-secondary'
                }`}
                style={{ height: `${12 + i * 1.5}px` }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getOutdoorScore(data: EnvironmentData): number {
  let score = 10;
  const aqi = data.aqi || 0;
  if (aqi > 150) score -= 4;
  else if (aqi > 100) score -= 3;
  else if (aqi > 50) score -= 1;

  const temp = data.temperature || 25;
  if (temp > 38 || temp < 5) score -= 3;
  else if (temp > 34 || temp < 10) score -= 1;

  const vis = data.visibility || 10;
  if (vis < 2) score -= 2;
  else if (vis < 5) score -= 1;

  const noise = data.noise_db || 40;
  if (noise > 80) score -= 1;

  return Math.max(1, Math.min(10, score));
}
