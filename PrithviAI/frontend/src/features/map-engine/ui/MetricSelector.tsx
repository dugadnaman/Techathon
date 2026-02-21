'use client';

import { METRIC_OPTIONS } from '@/features/map-engine/logic/metricConfig';
import { useMapContext } from '@/features/map-engine/context/MapContext';

export function MetricSelector() {
  const { selectedMetric, setSelectedMetric, seniorMode, setSeniorMode } = useMapContext();

  return (
    <div className="glass-card-solid rounded-2xl border border-surface-secondary p-2.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] uppercase tracking-wide text-content-secondary">Metric Layers</p>
        <label className="inline-flex items-center gap-2 text-xs text-content-secondary">
          <span>Senior Mode</span>
          <button
            type="button"
            onClick={() => setSeniorMode(!seniorMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${seniorMode ? 'bg-accent' : 'bg-surface-secondary'}`}
            aria-pressed={seniorMode}
            aria-label="Toggle senior mode"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${seniorMode ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 pb-1">
          {METRIC_OPTIONS.map((metric) => {
            const active = selectedMetric === metric.key;
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedMetric(metric.key)}
                className={`min-h-[44px] shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-accent text-white shadow-glow-green'
                    : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
                }`}
              >
                <span className="sm:hidden">{metric.shortLabel}</span>
                <span className="hidden sm:inline">{metric.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
