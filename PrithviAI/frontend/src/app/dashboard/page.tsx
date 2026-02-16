'use client';

/**
 * Prithvi — Dashboard Page
 * Area-wise risk visualization with theme-aware animated charts.
 */

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import { RevealSection, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/motion';
import { getDashboardSummary, getTrends, getRiskDistribution } from '@/lib/api';
import type { Language, AreaData, TrendPoint, RiskDistribution } from '@/types';
import { getRiskBadgeBg, getRiskHexColor } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Building2, TrendingUp, PieChart as PieIcon, MapPin, Clock } from 'lucide-react';
import { t, tRisk } from '@/lib/translations';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ChartCard({ children, title, subtitle, icon }: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="glass-card-solid rounded-3xl p-6"
    >
      <h3 className="text-lg font-semibold text-content-primary mb-1 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <p className="text-sm text-content-secondary mb-4">{subtitle}</p>
      <div className="h-56">{children}</div>
    </motion.div>
  );
}

const tooltipStyle = {
  borderRadius: '16px',
  border: '1px solid var(--glass-border)',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
};

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

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <RevealSection className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-accent" size={28} />
            <h1 className="text-section font-bold text-content-primary">
              {t('environmentalDashboard', language)}
            </h1>
          </div>
          <p className="text-body-lg text-content-secondary">{t('areaWiseMonitoring', language)}</p>
        </RevealSection>

        {/* Area-wise Risk Summary */}
        <section className="mb-16">
          <RevealSection>
            <div className="flex items-center gap-2 mb-6">
              <MapPin size={18} className="text-accent" />
              <h2 className="text-subheading font-semibold text-content-primary">
                {t('areaWiseSafetyStatus', language)}
              </h2>
            </div>
          </RevealSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {areas.map((area) => (
              <StaggerItem key={area.name}>
                <div className="glass-card-solid rounded-3xl p-5 hover:shadow-elevated transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-content-primary">{area.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${getRiskBadgeBg(area.safety_level)}`}>
                      {tRisk(area.safety_level, language)}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-content-primary">
                        <AnimatedCounter value={area.score} />
                      </div>
                      <div className="text-micro uppercase tracking-wider text-content-secondary mt-0.5">{t('riskScore', language)}</div>
                    </div>
                    {area.top_concern !== 'None' && (
                      <div className="text-xs text-content-secondary text-right">
                        {t('topConcern', language)}<br />
                        <span className="font-medium text-content-primary">{area.top_concern}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-1.5 mt-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${area.score}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }}
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: getRiskHexColor(area.safety_level) }}
                    />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <ChartCard
            title={t('aqiTrend', language)}
            subtitle="AQI over time"
            icon={<TrendingUp size={18} className="text-blue-400" />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.filter((_, i) => i % 2 === 0)}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
                <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: 'var(--bg-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`AQI: ${val}`, 'Air Quality']} labelFormatter={() => ''} />
                <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fill="url(#aqiGrad)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('tempTrend', language)}
            subtitle="Temperature in °C"
            icon={<TrendingUp size={18} className="text-red-400" />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.filter((_, i) => i % 2 === 0)}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
                <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: 'var(--bg-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}°C`, 'Temperature']} labelFormatter={() => ''} />
                <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fill="url(#tempGrad)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('riskFactorBreakdown', language)}
            subtitle="Current contribution by factor"
            icon={<PieIcon size={18} className="text-purple-400" />}
          >
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
                  animationDuration={1200}
                >
                  {distribution.map((entry, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number, name: string) => [`Score: ${val}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('safetyScoreHistory', language)}
            subtitle="Risk score over recent readings"
            icon={<Clock size={18} className="text-accent" />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.slice(0, 14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
                <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: 'var(--bg-secondary)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}/100`, 'Safety Score']} labelFormatter={() => ''} />
                <Bar dataKey="safety_score" radius={[6, 6, 0, 0]} fill="var(--accent-primary)" animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-surface-secondary">
          <p className="text-sm text-content-secondary/60">
            {t('dashboardFooter', language)}
          </p>
        </footer>
      </main>
    </>
  );
}
