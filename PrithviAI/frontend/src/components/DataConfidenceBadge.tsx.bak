'use client';

/**
 * PrithviAI — Data Confidence Badge
 * Minimal, non-intrusive indicator showing data freshness and confidence level.
 * Expandable on click/hover to show reasons.
 */

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { DataQuality, ConfidenceLevel, FreshnessLabel } from '@/types';

interface DataConfidenceBadgeProps {
  dataQuality?: DataQuality | null;
  compact?: boolean; // Minimal mode for tight spaces
}

const confidenceConfig: Record<ConfidenceLevel, { color: string; bg: string; border: string; dot: string; label: string }> = {
  HIGH:   { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500', label: 'High confidence' },
  MEDIUM: { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500', label: 'Medium confidence' },
  LOW:    { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',   label: 'Low confidence' },
};

function freshnessText(minutes: number): string {
  if (minutes <= 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

export default function DataConfidenceBadge({ dataQuality, compact = false }: DataConfidenceBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!dataQuality) return null;

  const { freshness, confidence } = dataQuality;
  const level = confidence.confidence_level as ConfidenceLevel;
  const config = confidenceConfig[level] || confidenceConfig.MEDIUM;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color} ${config.border} border`}
        title={`${config.label} · Updated ${freshnessText(freshness.freshness_minutes)}\n${confidence.confidence_reasons.join('; ')}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label.split(' ')[0]}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left ${config.color}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
          <span className="text-xs font-medium truncate">{config.label}</span>
          <span className="text-[10px] opacity-70">·</span>
          <span className="text-[10px] opacity-70">Updated {freshnessText(freshness.freshness_minutes)}</span>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp size={12} /> : <Info size={12} />}
        </div>
      </button>

      {expanded && (
        <div className={`px-3 pb-2.5 pt-0 border-t ${config.border}`}>
          <ul className="space-y-0.5 mt-1.5">
            {confidence.confidence_reasons.map((reason, i) => (
              <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
          {dataQuality.sources && Object.keys(dataQuality.sources).length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-gray-200/50">
              <p className="text-[10px] text-gray-400 mb-0.5">Data sources</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(dataQuality.sources).map(([key, source]) => (
                  <span
                    key={key}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 text-gray-500 border border-gray-200"
                  >
                    {key}: {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
