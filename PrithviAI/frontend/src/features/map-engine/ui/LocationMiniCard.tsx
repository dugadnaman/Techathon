'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus, MessageSquare, X } from 'lucide-react';
import type { MapPointData } from '@/features/map-engine/layers/types';
import type { MapMetric } from '@/features/map-engine/context/MapContext';
import { metricDisplayName, metricUnit } from '@/features/map-engine/logic/metricConfig';

function TrendLabel({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-risk-high text-xs font-semibold">
        <ArrowUpRight size={13} />
        Rising
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-risk-low text-xs font-semibold">
        <ArrowDownRight size={13} />
        Improving
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-content-secondary text-xs font-semibold">
      <Minus size={13} />
      Stable
    </span>
  );
}

function MetricValue({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-surface-secondary bg-surface-secondary/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-content-secondary">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-content-primary">
        {Number.isFinite(value) ? value.toFixed(unit === '°C' || unit === 'mm' ? 1 : 0) : '--'}
        {unit ? <span className="ml-0.5 text-[11px] font-medium text-content-secondary">{unit}</span> : null}
      </div>
    </div>
  );
}

function MiniCardContent({
  point,
  selectedMetric,
  onAskAI,
  onClose,
  mobile,
}: {
  point: MapPointData;
  selectedMetric: MapMetric;
  onAskAI: () => void;
  onClose: () => void;
  mobile?: boolean;
}) {
  const activeValue = point.metricValues[selectedMetric];
  const activeTrend = point.trendByMetric[selectedMetric];

  return (
    <div className="glass-card-solid border border-surface-secondary rounded-2xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-content-primary">{point.name}</h3>
          <p className="text-xs text-content-secondary">
            Primary risk: <span className="text-content-primary">{point.primaryRisk}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] rounded-xl text-content-secondary inline-flex items-center justify-center"
          aria-label="Close location card"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 rounded-xl bg-surface-secondary/45 border border-surface-secondary px-3 py-2">
        <div className="text-[11px] text-content-secondary">{metricDisplayName(selectedMetric)}</div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold text-content-primary">
            {Number.isFinite(activeValue) ? activeValue.toFixed(metricUnit(selectedMetric) === '°C' || metricUnit(selectedMetric) === 'mm' ? 1 : 0) : '--'}
            {metricUnit(selectedMetric) ? (
              <span className="ml-1 text-xs font-medium text-content-secondary">{metricUnit(selectedMetric)}</span>
            ) : null}
          </div>
          <TrendLabel trend={activeTrend} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <MetricValue label="AQI" value={point.metricValues.aqi} unit="" />
        <MetricValue label="Temp" value={point.metricValues.temperature} unit="°C" />
        <MetricValue label="UV" value={point.metricValues.uv} unit="" />
        <MetricValue label="Safety" value={point.metricValues.safety_score} unit="/100" />
      </div>

      <button
        onClick={onAskAI}
        className="mt-3 w-full min-h-[44px] rounded-xl bg-accent text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
      >
        <MessageSquare size={14} />
        Ask AI about this location
      </button>

      {mobile ? <div className="h-2" /> : null}
    </div>
  );
}

export function LocationMiniCard({
  point,
  selectedMetric,
  onAskAI,
  onClose,
}: {
  point: MapPointData | null;
  selectedMetric: MapMetric;
  onAskAI: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {point ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block absolute top-3 right-3 z-[1002] w-[300px]"
          >
            <MiniCardContent
              point={point}
              selectedMetric={selectedMetric}
              onAskAI={onAskAI}
              onClose={onClose}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {point ? (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 260 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140) onClose();
            }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[1003] px-3 pb-3"
          >
            <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-surface-secondary" />
            <MiniCardContent
              point={point}
              selectedMetric={selectedMetric}
              onAskAI={onAskAI}
              onClose={onClose}
              mobile
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
