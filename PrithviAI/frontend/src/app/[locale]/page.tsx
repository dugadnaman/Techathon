'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/routing';
import { getCurrentEnvironment } from '@/lib/api';
import {
  computeBasicSafetyScore,
  getBasicRiskLevelFromScore,
  getBasicRiskLevelLabel,
  getRiskPillClass,
} from '@/lib/basicRisk';
import { formatLocalizedNumber } from '@/lib/utils';
import { t } from '@/lib/translations';
import type { EnvironmentData, Language } from '@/types';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Pune: { lat: 18.5204, lon: 73.8567 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Delhi: { lat: 28.6139, lon: 77.209 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
};

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="glass-card-solid rounded-2xl p-4 border border-surface-secondary">
      <p className="text-xs uppercase tracking-wide text-content-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-content-primary">
        {value}
        {unit ? <span className="text-base ml-1 text-content-secondary">{unit}</span> : null}
      </p>
    </div>
  );
}

export default function HomePage() {
  const language = useLocale() as Language;
  const [city, setCity] = useState('Pune');
  const [environment, setEnvironment] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnvironment = async () => {
    const coords = CITY_COORDS[city] || CITY_COORDS.Pune;
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentEnvironment(coords.lat, coords.lon, city);
      setEnvironment(data);
    } catch {
      setError(t('common.backendUnavailable', language));
      setEnvironment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const safetyScore = useMemo(
    () => (environment ? computeBasicSafetyScore(environment) : null),
    [environment],
  );
  const riskLevel = safetyScore !== null ? getBasicRiskLevelFromScore(safetyScore) : null;

  return (
    <div className="min-h-screen bg-surface-primary">
      <Navbar language={language} onLanguageChange={() => {}} />

      <main className="pt-16">
        <section className="border-b border-surface-secondary bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]">
          <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
            <p className="text-sm font-medium text-accent">Round 1 MVP</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold text-content-primary leading-tight">
              PrithviAI Environmental Intelligence Prototype
            </h1>
            <p className="mt-4 max-w-2xl text-content-secondary leading-relaxed">
              A focused MVP demonstrating real-time environment monitoring, a basic safety score,
              and location-based risk visibility for informed decisions.
            </p>
            <div className="mt-8">
              <Link
                href="/explore"
                className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white font-medium"
              >
                Explore Prototype
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-content-primary">Basic Dashboard</h2>
              <p className="text-sm text-content-secondary mt-1">
                Real-time metrics with a simple weighted safety score model.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-surface-secondary text-content-primary border border-surface-secondary"
              >
                {Object.keys(CITY_COORDS).map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
                  </option>
                ))}
              </select>
              <button
                onClick={loadEnvironment}
                className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-accent text-white inline-flex items-center justify-center"
                aria-label={t('refresh', language)}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-risk-high/30 bg-risk-high/10 p-4 text-risk-high text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricCard
              label={t('environment.aqi', language)}
              value={
                environment
                  ? formatLocalizedNumber(environment.aqi, language, { maximumFractionDigits: 0 })
                  : '--'
              }
            />
            <MetricCard
              label={t('temperature', language)}
              value={
                environment
                  ? formatLocalizedNumber(environment.temperature, language, { maximumFractionDigits: 1 })
                  : '--'
              }
              unit={t('units.celsius', language)}
            />
            <MetricCard
              label={t('humidity', language)}
              value={
                environment
                  ? formatLocalizedNumber(environment.humidity, language, { maximumFractionDigits: 0 })
                  : '--'
              }
              unit={t('units.percent', language)}
            />
            <MetricCard
              label={t('uvIndex', language)}
              value={
                environment
                  ? formatLocalizedNumber(environment.uv_index, language, { maximumFractionDigits: 1 })
                  : '--'
              }
            />
            <div className="glass-card-solid rounded-2xl p-4 border border-surface-secondary">
              <p className="text-xs uppercase tracking-wide text-content-secondary">Safety Score</p>
              <p className="mt-2 text-2xl font-semibold text-content-primary">
                {safetyScore !== null
                  ? formatLocalizedNumber(safetyScore, language, { maximumFractionDigits: 1 })
                  : '--'}
              </p>
              {riskLevel ? (
                <span
                  className={`inline-flex mt-2 px-2.5 py-1 text-xs rounded-full ${getRiskPillClass(riskLevel)}`}
                >
                  Risk: {getBasicRiskLevelLabel(riskLevel)}
                </span>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-xs text-content-secondary">
            Score formula: AQI (45%), Temperature (20%), Humidity (20%), UV (15%).
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="glass-card-solid rounded-2xl p-6 border border-surface-secondary">
            <h3 className="text-xl font-semibold text-content-primary">Project Roadmap</h3>
            <ul className="mt-4 space-y-3 text-sm text-content-secondary">
              <li className="flex items-center justify-between border-b border-surface-secondary pb-2">
                <span>Heatmap Visualization</span>
                <span className="text-amber-400 font-medium">In Progress</span>
              </li>
              <li className="flex items-center justify-between border-b border-surface-secondary pb-2">
                <span>Senior Mode</span>
                <span className="text-amber-400 font-medium">In Progress</span>
              </li>
              <li className="flex items-center justify-between border-b border-surface-secondary pb-2">
                <span>24h Risk Timeline</span>
                <span className="text-content-secondary font-medium">Coming Soon</span>
              </li>
              <li className="flex items-center justify-between">
                <span>AI Advisory Layer</span>
                <span className="text-content-secondary font-medium">Planned</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
