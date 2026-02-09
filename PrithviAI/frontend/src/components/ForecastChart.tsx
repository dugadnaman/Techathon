'use client';

/**
 * PrithviAI — Forecast Chart
 * Displays 24-48 hour safety forecast using Recharts.
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ForecastPoint } from '@/types';
import { formatTime, getRiskHexColor } from '@/lib/utils';

interface ForecastChartProps {
  points: ForecastPoint[];
}

export default function ForecastChart({ points }: ForecastChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-gray-400 text-center">No forecast data available</p>
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">48-Hour Safety Forecast</h3>
      <p className="text-sm text-gray-500 mb-4">Predicted environmental risk for seniors</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${Math.round(value)}/100`,
                'Risk Score',
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {/* Risk zones */}
            <Area
              type="monotone"
              dataKey="score"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk zone legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Low (0-30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Moderate (30-60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>High (60-100)</span>
        </div>
      </div>
    </div>
  );
}
