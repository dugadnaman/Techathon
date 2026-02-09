'use client';

/**
 * PrithviAI — Admin Dashboard Page
 * Area-wise risk visualization and historical trend analysis.
 */

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { getDashboardSummary, getTrends, getRiskDistribution } from '@/lib/api';
import type { Language, AreaData, TrendPoint, RiskDistribution } from '@/types';
import { getRiskBadgeBg, getRiskHexColor } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Building2, TrendingUp, PieChart as PieIcon, MapPin, Clock } from 'lucide-react';
import { t, tRisk } from '@/lib/translations';

export default function DashboardPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [distribution, setDistribution] = useState<RiskDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, distRes] = await Promise.allSettled([
        getDashboardSummary(),
        getTrends(7),
        getRiskDistribution(),
      ]);

      if (summaryRes.status === 'fulfilled') setAreas(summaryRes.value.areas);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.trends);
      if (distRes.status === 'fulfilled') setDistribution(distRes.value.distribution);
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#f59e0b', '#eab308', '#22c55e', '#22c55e'];

  return (
    <>
      <Navbar language={language} onLanguageChange={setLanguage} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-green-600" size={24} />
            {t('environmentalDashboard', language)}
          </h1>
          <p className="text-gray-500 mt-1">{t('areaWiseMonitoring', language)}</p>
        </div>

        {/* Area-wise Risk Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-green-600" />
            {t('areaWiseSafetyStatus', language)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {areas.map((area) => (
              <div
                key={area.name}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{area.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${getRiskBadgeBg(area.safety_level)}`}>
                    {tRisk(area.safety_level, language)}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{area.score}</div>
                    <div className="text-xs text-gray-400">{t('riskScore', language)}</div>
                  </div>
                  {area.top_concern !== 'None' && (
                    <div className="text-xs text-gray-500 text-right">
                      {t('topConcern', language)}<br />
                      <span className="font-medium text-gray-700">{area.top_concern}</span>
                    </div>
                  )}
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${area.score}%`,
                      backgroundColor: getRiskHexColor(area.safety_level),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AQI Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              {t('aqiTrend', language)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">AQI over time</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.filter((_, i) => i % 2 === 0)}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(val: number) => [`AQI: ${val}`, 'Air Quality']}
                    labelFormatter={() => ''}
                  />
                  <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fill="url(#aqiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <TrendingUp size={18} className="text-red-400" />
              {t('tempTrend', language)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Temperature in °C</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.filter((_, i) => i % 2 === 0)}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(val: number) => [`${val}°C`, 'Temperature']}
                    labelFormatter={() => ''}
                  />
                  <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fill="url(#tempGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Factor Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <PieIcon size={18} className="text-purple-500" />
              {t('riskFactorBreakdown', language)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Current contribution by factor</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="score"
                    nameKey="factor"
                    label={({ factor }: any) => factor}
                  >
                    {distribution.map((entry, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(val: number, name: string) => [`Score: ${val}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Safety Score Bar Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Clock size={18} className="text-green-500" />
              {t('safetyScoreHistory', language)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Risk score over recent readings</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(val: number) => [`${val}/100`, 'Safety Score']}
                    labelFormatter={() => ''}
                  />
                  <Bar
                    dataKey="safety_score"
                    radius={[4, 4, 0, 0]}
                    fill="#22c55e"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-gray-100 mt-8">
          <p className="text-sm text-gray-400">
            {t('dashboardFooter', language)}
          </p>
        </footer>
      </main>
    </>
  );
}
