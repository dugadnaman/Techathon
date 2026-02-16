'use client';

/**
 * Prithvi — Data Confidence Badge
 * Premium expandable badge showing data quality, freshness, and confidence.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { DataQuality, ConfidenceLevel } from '@/types';

interface DataConfidenceBadgeProps {
  dataQuality?: DataQuality | null;
  compact?: boolean;
}

const levelConfig: Record<ConfidenceLevel, {
  icon: typeof CheckCircle;
  label: string;
  dotClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  HIGH: {
    icon: CheckCircle,
    label: 'High Confidence',
    dotClass: 'bg-risk-low',
    bgClass: 'bg-risk-low/10',
    textClass: 'text-risk-low',
    borderClass: 'border-risk-low/20',
  },
  MEDIUM: {
    icon: AlertTriangle,
    label: 'Medium Confidence',
    dotClass: 'bg-risk-moderate',
    bgClass: 'bg-risk-moderate/10',
    textClass: 'text-risk-moderate',
    borderClass: 'border-risk-moderate/20',
  },
  LOW: {
    icon: AlertCircle,
    label: 'Low Confidence',
    dotClass: 'bg-risk-high',
    bgClass: 'bg-risk-high/10',
    textClass: 'text-risk-high',
    borderClass: 'border-risk-high/20',
  },
};

export default function DataConfidenceBadge({ dataQuality, compact = false }: DataConfidenceBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!dataQuality) return null;

  const { freshness, confidence, sources } = dataQuality;
  const level = confidence.confidence_level as ConfidenceLevel;
  const config = levelConfig[level] || levelConfig.HIGH;
  const Icon = config.icon;

  const freshnessText = freshness.freshness_minutes < 1
    ? 'Just now'
    : freshness.freshness_minutes < 60
    ? `Updated ${Math.round(freshness.freshness_minutes)}m ago`
    : `Updated ${Math.floor(freshness.freshness_minutes / 60)}h ago`;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
        ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        <span className="font-medium">{config.label}</span>
      </span>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border ${config.borderClass} ${config.bgClass} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className={config.textClass} />
          <span className={`text-sm font-medium ${config.textClass}`}>
            {config.label}
          </span>
          <span className="text-xs text-content-secondary">
            · {freshnessText}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-content-secondary" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-secondary">Score</span>
                <span className={`font-semibold ${config.textClass}`}>
                  {confidence.confidence_score}/100
                </span>
              </div>

              {confidence.confidence_reasons.length > 0 && (
                <div className="space-y-1">
                  {confidence.confidence_reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-content-secondary">
                      <Info size={11} className="mt-0.5 flex-shrink-0 opacity-50" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {sources && Object.keys(sources).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(sources).map(([key, val]) => (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-surface-secondary text-content-secondary"
                    >
                      {key}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
