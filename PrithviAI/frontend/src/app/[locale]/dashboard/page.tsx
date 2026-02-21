'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
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
};

function DashboardMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="glass-card-solid rounded-2xl border border-surface-secondary p-5">
      <p className="text-xs uppercase tracking-wide text-content-secondary">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-content-primary">
        {value}
        {unit ? <span className="text-base ml-1 text-content-secondary">{unit}</span> : null}
      </p>
    </div>
  );
}

export default function DashboardPage() {
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

      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-content-primary">Basic Dashboard</h1>
            <p className="text-sm text-content-secondary mt-1">
              Monitoring view for key environmental indicators.
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
              disabled={loading}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-accent text-white inline-flex items-center justify-center"
              aria-label={t('refresh', language)}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-risk-high/30 bg-risk-high/10 p-4 text-risk-high text-sm mb-4">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardMetric
            label={t('environment.aqi', language)}
            value={
              environment
                ? formatLocalizedNumber(environment.aqi, language, { maximumFractionDigits: 0 })
                : '--'
            }
          />
          <DashboardMetric
            label={t('temperature', language)}
            value={
              environment
                ? formatLocalizedNumber(environment.temperature, language, { maximumFractionDigits: 1 })
                : '--'
            }
            unit={t('units.celsius', language)}
          />
          <DashboardMetric
            label={t('humidity', language)}
            value={
              environment
                ? formatLocalizedNumber(environment.humidity, language, { maximumFractionDigits: 0 })
                : '--'
            }
            unit={t('units.percent', language)}
          />
          <DashboardMetric
            label={t('uvIndex', language)}
            value={
              environment
                ? formatLocalizedNumber(environment.uv_index, language, { maximumFractionDigits: 1 })
                : '--'
            }
          />
        </div>

        <div className="mt-6 glass-card-solid rounded-2xl border border-surface-secondary p-5">
          <h2 className="text-xl font-semibold text-content-primary">Basic Safety Score</h2>
          <p className="text-sm text-content-secondary mt-1">
            Computed from AQI, temperature, humidity, and UV only.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-4xl font-bold text-content-primary">
              {safetyScore !== null
                ? formatLocalizedNumber(safetyScore, language, { maximumFractionDigits: 1 })
                : '--'}
            </span>
            {riskLevel ? (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskPillClass(riskLevel)}`}>
                Risk: {getBasicRiskLevelLabel(riskLevel)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-content-secondary">
            Formula weights: AQI 45%, Temperature 20%, Humidity 20%, UV 15%.
          </p>
        </div>
      </main>
    </div>
  );
}
