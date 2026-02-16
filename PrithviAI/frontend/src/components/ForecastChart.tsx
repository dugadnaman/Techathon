'use client';

/**
 * Prithvi — Forecast Chart
 * Premium theme-aware 48-hour safety forecast with fade-in.
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ForecastPoint } from '@/types';
import { formatTime } from '@/lib/utils';

interface ForecastChartProps {
  points: ForecastPoint[];
}

export default function ForecastChart({ points }: ForecastChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (!points || points.length === 0) {
    return (
      <div className="glass-card-solid rounded-3xl p-6">
        <p className="text-content-secondary text-center">No forecast data available</p>
      </div>
    );
  }

  const chartData = points.map((p) => ({
    time: formatTime(p.time),
    score: p.predicted_score,
    level: p.predicted_level,
    concern: p.key_concern,
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card-solid rounded-3xl p-6"
    >
      <h3 className="text-lg font-semibold text-content-primary mb-1">48-Hour Safety Forecast</h3>
      <p className="text-sm text-content-secondary mb-4">Predicted environmental risk for seniors</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                <stop offset="50%" stopColor="var(--risk-moderate)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--risk-high)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--bg-secondary)' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [
                `${Math.round(value)}/100`,
                'Risk Score',
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-content-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-low" />
          <span>Low (0-30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-moderate" />
          <span>Moderate (30-60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-high" />
          <span>High (60-100)</span>
        </div>
      </div>
    </motion.div>
  );
}
