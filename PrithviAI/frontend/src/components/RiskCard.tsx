'use client';

/**
 * Prithvi — Risk Factor Card
 * Premium risk card with score bar, motion, and theme support.
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLocale } from 'next-intl';
import type { Language, RiskFactor } from '@/types';
import { getRiskColor } from '@/lib/utils';
import { tRisk } from '@/lib/translations';

interface RiskCardProps {
  risk: RiskFactor;
  expanded?: boolean;
  index?: number;
}

export default function RiskCard({ risk, expanded = false, index = 0 }: RiskCardProps) {
  const language = useLocale() as Language;
  const { name, level, score, reason, recommendation, icon } = risk;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const riskIcons: Record<string, string> = {
    'Air Quality': '💨', 'Thermal Comfort': '🌡️', 'Humidity': '💧',
    'UV Exposure': '☀️', 'Flood / Waterlogging': '🌊', 'Noise Pollution': '🔊',
  };
  const displayIcon = icon || riskIcons[name] || '📊';

  const riskBg = level === 'HIGH' ? 'bg-risk-high/5 border-risk-high/15'
    : level === 'MODERATE' ? 'bg-risk-moderate/5 border-risk-moderate/15'
    : 'bg-risk-low/5 border-risk-low/15';

  const barColor = level === 'HIGH' ? 'bg-risk-high'
    : level === 'MODERATE' ? 'bg-risk-moderate'
    : 'bg-risk-low';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl border p-5 cursor-default hover:shadow-elevated transition-shadow duration-200 ${riskBg}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{displayIcon}</span>
          <div>
            <h3 className="font-semibold text-content-primary">{name}</h3>
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full text-white mt-1 ${barColor}`}>
              {tRisk(level, language)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.07]">
            <span className={`text-3xl font-extrabold tracking-tighter leading-none ${getRiskColor(level)}`}>
              {Math.round(score)}
            </span>
            <span className="text-xs font-semibold text-content-secondary">/100</span>
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-surface-secondary rounded-full h-1.5 mb-3 overflow-hidden">
        <motion.div
          className={`h-1.5 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(score, 100)}%` } : { width: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <p className="text-sm text-content-secondary mb-2">{reason}</p>

      {(expanded || level === 'HIGH') && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-sm text-content-secondary">
            💡 {recommendation}
          </p>
        </div>
      )}
    </motion.div>
  );
}
