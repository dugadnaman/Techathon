'use client';

/**
 * Prithvi — Daily Summary Card
 * Time-block advice with theme-aware styling.
 */

import { motion } from 'framer-motion';
import { Sun, Sunset, Moon } from 'lucide-react';
import type { DailySummary } from '@/types';
import type { Language } from '@/types';
import { t } from '@/lib/translations';
import { formatDate } from '@/lib/utils';

interface DailySummaryCardProps {
  summary: DailySummary | null;
  loading?: boolean;
  language?: Language;
}

export default function DailySummaryCard({ summary, loading, language = 'en' }: DailySummaryCardProps) {
  /* Always visible — parent RevealSection handles scroll gate */

  if (loading) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 animate-pulse">
        <div className="h-6 bg-surface-secondary rounded w-48 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-surface-secondary rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const timeBlocks = [
    {
      label: t('morning', language),
      icon: <Sun className="text-amber-400" size={20} />,
      advice: summary.morning_advice,
      time: t('daily.hoursMorning', language),
      bg: 'bg-amber-500/5 border-amber-500/10',
    },
    {
      label: t('afternoon', language),
      icon: <Sunset className="text-orange-400" size={20} />,
      advice: summary.afternoon_advice,
      time: t('daily.hoursAfternoon', language),
      bg: 'bg-orange-500/5 border-orange-500/10',
    },
    {
      label: t('evening', language),
      icon: <Moon className="text-indigo-400" size={20} />,
      advice: summary.evening_advice,
      time: t('daily.hoursEvening', language),
      bg: 'bg-indigo-500/5 border-indigo-500/10',
    },
  ];

  return (
    <div className="glass-card-solid rounded-3xl p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-content-primary">{t('dailySafetyGuide', language)}</h2>
        <p className="text-xs text-content-secondary">{summary.location} — {formatDate(summary.date, language)}</p>
      </div>

      <div className="space-y-3">
        {timeBlocks.map((block, idx) => (
          <motion.div
            key={block.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border p-4 ${block.bg}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {block.icon}
              <div>
                <span className="font-semibold text-content-primary text-sm">{block.label}</span>
                <span className="text-xs text-content-secondary ml-2">{block.time}</span>
              </div>
            </div>
            <p className="text-sm text-content-secondary leading-relaxed pl-9">{block.advice}</p>
          </motion.div>
        ))}
      </div>

      {summary.forecast && summary.forecast.early_warnings?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5">
          <h3 className="text-micro uppercase tracking-wider text-content-secondary mb-3">
            🔮 {t('forecastAlerts', language)}
          </h3>
          <div className="space-y-2">
            {summary.forecast.early_warnings.map((warning, idx) => (
              <p key={idx} className="text-sm text-content-secondary">{warning}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
