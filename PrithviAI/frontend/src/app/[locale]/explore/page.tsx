'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import { getMapLandmarks, getLocationData } from '@/lib/api';
import {
  computeBasicSafetyScore,
  getBasicRiskLevelFromScore,
  getBasicRiskLevelLabel,
  getRiskPillClass,
} from '@/lib/basicRisk';
import { formatLocalizedNumber } from '@/lib/utils';
import { t } from '@/lib/translations';
import type { Landmark, LocationData, Language } from '@/types';

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-surface-secondary py-2">
      <span className="text-sm text-content-secondary">{label}</span>
      <span className="text-sm font-medium text-content-primary">{value}</span>
    </div>
  );
}

export default function ExplorePage() {
  const language = useLocale() as Language;
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLandmarks = async () => {
      try {
        const response = await getMapLandmarks();
        setLandmarks(response.landmarks);
      } catch {
        setLandmarks([]);
      }
    };
    loadLandmarks();
  }, []);

  const handleLocationSelect = async (lat: number, lon: number, name: string) => {
    setSelectedLocation({ lat, lon, name: name || 'Selected Point' });
    setLoading(true);
    setError(null);
    try {
      const data = await getLocationData(lat, lon, name);
      setLocationData(data);
    } catch {
      setError(t('failedLocationData', language));
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  };

  const riskInfo = useMemo(() => {
    if (!locationData) return null;
    const score = computeBasicSafetyScore(locationData.environment);
    const level = getBasicRiskLevelFromScore(score);
    return {
      score,
      level,
      label: getBasicRiskLevelLabel(level),
    };
  }, [locationData]);

  return (
    <div className="min-h-screen bg-surface-primary">
      <Navbar language={language} onLanguageChange={() => {}} />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-content-primary">{t('mapExplorerTitle', language)}</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Click on a marker to view AQI, temperature, and risk level.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div className="min-h-[480px] h-[60vh] lg:h-[70vh]">
            <InteractiveMap
              landmarks={landmarks}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              isLoading={loading}
            />
          </div>

          <aside className="glass-card-solid rounded-2xl border border-surface-secondary p-5">
            <h2 className="text-lg font-semibold text-content-primary">Location Snapshot</h2>

            {error ? (
              <div className="mt-4 rounded-xl border border-risk-high/30 bg-risk-high/10 p-3 text-sm text-risk-high">
                {error}
              </div>
            ) : null}

            {!locationData && !loading ? (
              <p className="mt-4 text-sm text-content-secondary">
                Select a map marker to load data.
              </p>
            ) : null}

            {locationData ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-content-primary">
                  {locationData.location_name}
                </p>
                <div className="mt-3 space-y-1">
                  <InfoRow
                    label={t('environment.aqi', language)}
                    value={formatLocalizedNumber(locationData.environment.aqi, language, { maximumFractionDigits: 0 })}
                  />
                  <InfoRow
                    label={t('temperature', language)}
                    value={`${formatLocalizedNumber(locationData.environment.temperature, language, { maximumFractionDigits: 1 })}${t('units.celsius', language)}`}
                  />
                  <InfoRow
                    label="Risk Level"
                    value={riskInfo ? riskInfo.label : '--'}
                  />
                </div>

                {riskInfo ? (
                  <div className="mt-4">
                    <div className="text-sm text-content-secondary">Basic Safety Score</div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-2xl font-semibold text-content-primary">
                        {formatLocalizedNumber(riskInfo.score, language, { maximumFractionDigits: 1 })}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskPillClass(riskInfo.level)}`}>
                        {riskInfo.label}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
