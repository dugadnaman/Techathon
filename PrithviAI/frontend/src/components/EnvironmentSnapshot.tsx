'use client';

/**
 * Prithvi — Environment Snapshot
 * Premium metric cards with staggered scale-in animations.
 */

import { motion } from 'framer-motion';
import type { EnvironmentData } from '@/types';
import type { Language } from '@/types';
import { Thermometer, Wind, Droplets, Sun, CloudRain, Volume2, Eye } from 'lucide-react';
import { t } from '@/lib/translations';
import DataConfidenceBadge from '@/components/DataConfidenceBadge';
import { formatLocalizedNumber } from '@/lib/utils';

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
          <div key={i} className="glass-card-solid rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-surface-secondary rounded w-16 mb-2" />
            <div className="h-6 bg-surface-secondary rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const getAqiCategory = (aqi: number): string => {
    if (aqi <= 50) return t('aqi.good', language);
    if (aqi <= 100) return t('aqi.moderate', language);
    if (aqi <= 150) return t('aqi.unhealthySensitive', language);
    if (aqi <= 200) return t('aqi.unhealthy', language);
    if (aqi <= 300) return t('aqi.veryUnhealthy', language);
    return t('aqi.hazardous', language);
  };

  const metrics = [
    {
      label: t('temperature', language),
      value: formatLocalizedNumber(data.temperature, language, { maximumFractionDigits: 0 }),
      suffix: t('units.celsius', language),
      sub: `${t('feelsLike', language)} ${formatLocalizedNumber(data.feels_like, language, { maximumFractionDigits: 0 })}${t('units.celsius', language)}`,
      icon: <Thermometer size={18} className="text-red-400" />,
      riskClass: data.temperature > 35 ? 'text-risk-high' : data.temperature > 28 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('airQuality', language),
      value: formatLocalizedNumber(data.aqi, language, { maximumFractionDigits: 0 }),
      suffix: ` ${t('environment.aqi', language)}`,
      sub: `${getAqiCategory(data.aqi)} · PM2.5: ${formatLocalizedNumber(data.pm25, language, { maximumFractionDigits: 0 })}`,
      icon: <Wind size={18} className="text-blue-400" />,
      riskClass: data.aqi > 200 ? 'text-purple-500' : data.aqi > 150 ? 'text-risk-high' : data.aqi > 100 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('humidity', language),
      value: formatLocalizedNumber(data.humidity, language, { maximumFractionDigits: 0 }),
      suffix: t('units.percent', language),
      sub: data.humidity > 70 ? t('risk.high', language) : data.humidity < 35 ? t('risk.low', language) : t('status.normal', language),
      icon: <Droplets size={18} className="text-cyan-400" />,
      riskClass: data.humidity > 75 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('uvIndex', language),
      value: formatLocalizedNumber(data.uv_index, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      suffix: '',
      sub: data.uv_index > 7 ? t('status.veryHigh', language) : data.uv_index > 5 ? t('risk.high', language) : data.uv_index > 2 ? t('risk.moderate', language) : t('risk.low', language),
      icon: <Sun size={18} className="text-yellow-400" />,
      riskClass: data.uv_index > 7 ? 'text-risk-high' : data.uv_index > 5 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('rainfall', language),
      value: formatLocalizedNumber(data.rainfall, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      suffix: ` ${t('units.millimeter', language)}`,
      sub: data.rainfall > 7.5 ? t('status.heavy', language) : data.rainfall > 2.5 ? t('risk.moderate', language) : data.rainfall > 0 ? t('status.light', language) : t('status.none', language),
      icon: <CloudRain size={18} className="text-blue-500" />,
      riskClass: data.rainfall > 7.5 ? 'text-risk-high' : data.rainfall > 2.5 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('noise', language),
      value: formatLocalizedNumber(data.noise_db, language, { maximumFractionDigits: 0 }),
      suffix: ` ${t('units.decibel', language)}`,
      sub: data.noise_db > 70 ? t('status.loud', language) : data.noise_db > 55 ? t('risk.moderate', language) : t('status.quiet', language),
      icon: <Volume2 size={18} className="text-purple-400" />,
      riskClass: data.noise_db > 70 ? 'text-risk-high' : data.noise_db > 55 ? 'text-risk-moderate' : 'text-risk-low',
    },
    {
      label: t('wind', language),
      value: formatLocalizedNumber(data.wind_speed * 3.6, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      suffix: ` ${t('units.kmh', language)}`,
      sub: data.wind_speed > 10 ? t('status.strong', language) : data.wind_speed > 5 ? t('risk.moderate', language) : t('status.light', language),
      icon: <Wind size={18} className="text-teal-400" />,
      riskClass: 'text-content-primary',
    },
    {
      label: t('visibility', language),
      value: formatLocalizedNumber(data.visibility, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      suffix: ` ${t('units.kilometer', language)}`,
      sub: data.visibility < 2 ? t('status.poor', language) : data.visibility < 5 ? t('risk.moderate', language) : t('aqi.good', language),
      icon: <Eye size={18} className="text-slate-400" />,
      riskClass: data.visibility < 2 ? 'text-risk-high' : 'text-risk-low',
    },
  ];

  return (
    <div>
      {/* Confidence Badge */}
      {data.data_quality && (
        <div className="mb-3">
          <DataConfidenceBadge dataQuality={data.data_quality} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.35,
              delay: idx * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileTap={{ scale: 0.97 }}
            className="glass-card-solid rounded-2xl p-3 sm:p-4 cursor-default shadow-sm transition-shadow duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              {metric.icon}
              <span className="text-micro uppercase tracking-wider text-content-secondary">
                {metric.label}
              </span>
            </div>
            <div className="inline-flex items-baseline gap-0.5 px-2 py-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] mt-1">
              <span className={`text-2xl font-bold tracking-tight ${metric.riskClass}`}>
                {metric.value}
              </span>
              {metric.suffix && (
                <span className="text-sm font-semibold text-content-primary/80">{metric.suffix}</span>
              )}
            </div>
            <div className="text-xs text-content-secondary mt-1.5">{metric.sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
