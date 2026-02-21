'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { MapPointData } from '@/features/map-engine/layers/types';
import { METRIC_OPTIONS } from '@/features/map-engine/logic/metricConfig';
import type { MapMetric } from '@/features/map-engine/context/MapContext';

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <ArrowUpRight size={12} className="text-risk-high" />;
  if (trend === 'down') return <ArrowDownRight size={12} className="text-risk-low" />;
  return <Minus size={12} className="text-content-secondary" />;
}

export function MetricMiniCards({
  point,
  selectedMetric,
}: {
  point: MapPointData | null;
  selectedMetric: MapMetric;
}) {
  if (!point) return null;

  const cards = METRIC_OPTIONS.slice(0, 4).map((option) => ({
    key: option.key,
    label: option.shortLabel,
    value: point.metricValues[option.key],
    unit: option.unit,
    trend: point.trendByMetric[option.key],
    active: option.key === selectedMetric,
  }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border p-2.5 ${
            card.active
              ? 'border-accent/50 bg-accent/10'
              : 'border-surface-secondary bg-surface-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-content-secondary">{card.label}</span>
            <TrendIcon trend={card.trend} />
          </div>
          <div className="mt-1 text-sm font-bold text-content-primary">
            {Number.isFinite(card.value) ? card.value.toFixed(card.key === 'temperature' || card.key === 'rainfall' || card.key === 'uv' ? 1 : 0) : '--'}
            {card.unit ? <span className="ml-0.5 text-[11px] font-medium text-content-secondary">{card.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
