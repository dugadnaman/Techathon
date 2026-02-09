'use client';

/**
 * PrithviAI — Daily Summary Card
 * Shows morning/afternoon/evening advice for seniors.
 */

import { Sun, Sunset, Moon, CloudRain } from 'lucide-react';
import type { DailySummary } from '@/types';
import type { Language } from '@/types';
import { formatDate } from '@/lib/utils';
import { t } from '@/lib/translations';

interface DailySummaryCardProps {
  summary: DailySummary | null;
  loading?: boolean;
  language?: Language;
}

export default function DailySummaryCard({ summary, loading, language = 'en' }: DailySummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const timeBlocks = [
    {
      label: t('morning', language),
      icon: <Sun className="text-amber-400" size={22} />,
      advice: summary.morning_advice,
      time: '6 AM – 12 PM',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      label: t('afternoon', language),
      icon: <Sunset className="text-orange-400" size={22} />,
      advice: summary.afternoon_advice,
      time: '12 PM – 6 PM',
      bg: 'bg-orange-50 border-orange-100',
    },
    {
      label: t('evening', language),
      icon: <Moon className="text-indigo-400" size={22} />,
      advice: summary.evening_advice,
      time: '6 PM – 10 PM',
      bg: 'bg-indigo-50 border-indigo-100',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800">{t('dailySafetyGuide', language)}</h2>
        <p className="text-sm text-gray-500">{summary.location} — {summary.date}</p>
      </div>

      <div className="space-y-3">
        {timeBlocks.map((block) => (
          <div
            key={block.label}
            className={`rounded-xl border p-4 ${block.bg}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {block.icon}
              <div>
                <span className="font-semibold text-gray-800">{block.label}</span>
                <span className="text-xs text-gray-500 ml-2">{block.time}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed pl-9">
              {block.advice}
            </p>
          </div>
        ))}
      </div>

      {/* Early Warnings */}
      {summary.forecast && summary.forecast.early_warnings?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            🔮 {t('forecastAlerts', language)}
          </h3>
          <div className="space-y-2">
            {summary.forecast.early_warnings.map((warning, idx) => (
              <p key={idx} className="text-sm text-gray-600">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
