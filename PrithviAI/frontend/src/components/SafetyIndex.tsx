'use client';

/**
 * Prithvi — Safety Index Display
 * Premium animated circular gauge with stroke animation and glow effects.
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { SafetyIndex } from '@/types';
import type { Language } from '@/types';
import { getRiskColor, getScoreRingColor } from '@/lib/utils';
import { t, tRisk } from '@/lib/translations';
import DataConfidenceBadge from '@/components/DataConfidenceBadge';
import { AnimatedCounter } from '@/components/motion';

interface SafetyIndexDisplayProps {
  safetyIndex: SafetyIndex | null;
  loading?: boolean;
  language?: Language;
}

function getRiskGlow(level: string): string {
  switch (level) {
    case 'LOW': return 'shadow-glow-green';
    case 'MODERATE': return 'shadow-glow-amber';
    case 'HIGH': return 'shadow-glow-red';
    default: return '';
  }
}

function getRiskGradient(level: string): string {
  switch (level) {
    case 'LOW': return 'risk-gradient-low';
    case 'MODERATE': return 'risk-gradient-moderate';
    case 'HIGH': return 'risk-gradient-high';
    default: return '';
  }
}

export default function SafetyIndexDisplay({ safetyIndex, loading, language = 'en' }: SafetyIndexDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-52 h-52 rounded-full border-4 border-surface-secondary animate-pulse" />
      </div>
    );
  }

  if (!safetyIndex) return null;

  const { overall_level, overall_score, summary, top_risks, recommendations } = safetyIndex;
  const ringColor = getScoreRingColor(overall_score);
  const circumference = 2 * Math.PI * 70;
  const progress = (overall_score / 100) * circumference;

  return (
    <div ref={ref} className={`glass-card-solid rounded-3xl p-6 md:p-8 ${getRiskGradient(overall_level)}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-content-primary">
          {t('seniorSafetyIndex', language)}
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          {t('realtimeSafetyAssessment', language)}
        </p>
      </div>

      {/* Confidence Badge */}
      {safetyIndex.data_quality && (
        <div className="mb-5">
          <DataConfidenceBadge dataQuality={safetyIndex.data_quality} />
        </div>
      )}

      {/* Animated Circular Gauge */}
      <div className="flex justify-center mb-6">
        <div className={`relative w-52 h-52 rounded-full ${getRiskGlow(overall_level)}`}>
          <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke="var(--bg-secondary)"
              strokeWidth="10"
              opacity={0.5}
            />
            {/* Animated progress arc */}
            <motion.circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={isInView ? { strokeDashoffset: circumference - progress } : { strokeDashoffset: circumference }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]">
              <span className={`text-6xl font-extrabold tracking-tighter ${getRiskColor(overall_level)}`}>
                <AnimatedCounter value={overall_score} duration={1.5} />
              </span>
            </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={`text-xs font-semibold mt-2 px-3 py-1 rounded-full text-white
                ${overall_level === 'LOW' ? 'bg-risk-low' : overall_level === 'MODERATE' ? 'bg-risk-moderate' : 'bg-risk-high'}`}
            >
              {tRisk(overall_level, language)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-6"
      >
        <p className="text-body-lg text-content-secondary leading-relaxed">{summary}</p>
      </motion.div>

      {/* Top Risks */}
      {top_risks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-micro uppercase tracking-wider text-content-secondary mb-3">
            {t('keyConcerns', language)}
          </h3>
          <div className="space-y-2">
            {top_risks.map((risk, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -16 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.8 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center justify-between p-3 rounded-2xl border border-white/10
                  ${risk.level === 'HIGH' ? 'bg-risk-high/5' : risk.level === 'MODERATE' ? 'bg-risk-moderate/5' : 'bg-risk-low/5'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{risk.icon}</span>
                  <div>
                    <span className="font-medium text-content-primary text-sm">{risk.name}</span>
                    <p className="text-xs text-content-secondary mt-0.5">{risk.reason}</p>
                  </div>
                </div>
                <span className={`text-base font-extrabold tracking-tight ${getRiskColor(risk.level)}`}>
                  {Math.round(risk.score)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-micro uppercase tracking-wider text-content-secondary mb-3">
            {t('whatToDo', language)}
          </h3>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-content-secondary">
                <span className="text-accent mt-0.5">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
