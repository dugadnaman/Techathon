'use client';

/**
 * PrithviAI — Safety Index Display
 * The central circular gauge showing the Senior Environmental Safety Index.
 */

import type { SafetyIndex } from '@/types';
import type { Language } from '@/types';
import { getRiskColor, getRiskBadgeBg, getScoreRingColor } from '@/lib/utils';
import { t, tRisk } from '@/lib/translations';
import DataConfidenceBadge from '@/components/DataConfidenceBadge';

interface SafetyIndexDisplayProps {
  safetyIndex: SafetyIndex | null;
  loading?: boolean;
  language?: Language;
}

export default function SafetyIndexDisplay({ safetyIndex, loading, language = 'en' }: SafetyIndexDisplayProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-48 h-48 rounded-full border-8 border-gray-100 animate-pulse flex items-center justify-center">
          <div className="text-gray-300 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!safetyIndex) return null;

  const { overall_level, overall_score, summary, top_risks, recommendations } = safetyIndex;
  const ringColor = getScoreRingColor(overall_score);
  const circumference = 2 * Math.PI * 70;
  const progress = (overall_score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {t('seniorSafetyIndex', language)}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{t('realtimeSafetyAssessment', language)}</p>
      </div>

      {/* Data Confidence Indicator */}
      {safetyIndex.data_quality && (
        <div className="mb-4">
          <DataConfidenceBadge dataQuality={safetyIndex.data_quality} />
        </div>
      )}

      {/* Circular Gauge */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="12"
            />
            {/* Progress arc */}
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getRiskColor(overall_level)}`}>
              {Math.round(overall_score)}
            </span>
            <span className={`text-sm font-semibold mt-1 px-3 py-0.5 rounded-full text-white ${getRiskBadgeBg(overall_level)}`}>
              {tRisk(overall_level, language)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center mb-6">
        <p className="text-gray-700 leading-relaxed">{summary}</p>
      </div>

      {/* Top Risks */}
      {top_risks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('keyConcerns', language)}
          </h3>
          <div className="space-y-2">
            {top_risks.map((risk, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  risk.level === 'HIGH'
                    ? 'bg-red-50 border-red-200'
                    : risk.level === 'MODERATE'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{risk.icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{risk.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{risk.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${getRiskColor(risk.level)}`}>
                    {Math.round(risk.score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('whatToDo', language)}
          </h3>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
