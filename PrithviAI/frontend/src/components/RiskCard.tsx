'use client';

/**
 * PrithviAI — Risk Factor Card
 * Individual risk factor display with icon, score, and details.
 */

import type { RiskFactor } from '@/types';
import { getRiskColor, getRiskBgColor, getRiskBadgeBg } from '@/lib/utils';

interface RiskCardProps {
  risk: RiskFactor;
  expanded?: boolean;
}

export default function RiskCard({ risk, expanded = false }: RiskCardProps) {
  const { name, level, score, reason, recommendation, icon } = risk;

  // Map risk names to icons if emoji not present
  const riskIcons: Record<string, string> = {
    'Air Quality': '💨',
    'Thermal Comfort': '🌡️',
    'Humidity': '💧',
    'UV Exposure': '☀️',
    'Flood / Waterlogging': '🌊',
    'Noise Pollution': '🔊',
  };

  const displayIcon = icon || riskIcons[name] || '📊';

  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-md ${getRiskBgColor(level)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{displayIcon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{name}</h3>
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mt-1 ${getRiskBadgeBg(level)}`}>
              {level}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getRiskColor(level)}`}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-gray-400 block">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            level === 'HIGH' ? 'bg-red-500' :
            level === 'MODERATE' ? 'bg-amber-500' :
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-600 mb-2">{reason}</p>

      {/* Recommendation (shown if expanded or always for high risk) */}
      {(expanded || level === 'HIGH') && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-sm font-medium text-gray-700">
            💡 {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
