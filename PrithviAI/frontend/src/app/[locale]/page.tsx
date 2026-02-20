'use client';

/**
 * Prithvi — Home Page
 * Production homepage with HeroV2 cinematic hero section.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { HeroV2 } from '@/components/hero-v2';
import SafetyIndexDisplay from '@/components/SafetyIndex';
import RiskCard from '@/components/RiskCard';
import AlertBanner from '@/components/AlertBanner';
import DailySummaryCard from '@/components/DailySummary';
import EnvironmentSnapshot from '@/components/EnvironmentSnapshot';
import ForecastChart from '@/components/ForecastChart';
import DailyIntelligenceSection from '@/components/DailyIntelligenceSection';
import EnvironmentAtGlance from '@/components/EnvironmentAtGlance';
import { RevealSection, StaggerContainer, StaggerItem, FadeIn } from '@/components/motion';
import { assessRisk, getAlerts, getDailySummary, getCurrentEnvironment } from '@/lib/api';
import type { SafetyIndex, HealthAlert, DailySummary, EnvironmentData, AgeGroup, ActivityIntent, Language } from '@/types';
import { Shield, MapPin, UserCircle, Activity, LocateFixed, Loader2 } from 'lucide-react';
import { t } from '@/lib/translations';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Pune: { lat: 18.5204, lon: 73.8567 },
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Delhi: { lat: 28.6139, lon: 77.2090 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Hyderabad: { lat: 17.3850, lon: 78.4867 },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(lat: number, lon: number, thresholdKm = 150): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [name, c] of Object.entries(CITY_COORDS)) {
    const d = haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return bestDist <= thresholdKm ? best : null;
}

export default function HomePage() {
  const locale = useLocale();
  const language = locale as Language;

  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elderly');
  const [activity, setActivity] = useState<ActivityIntent>('walking');
  const [city, setCity] = useState('Pune');

  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [detectedLocality, setDetectedLocality] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const geoInitDone = useRef(false);

  const coords = city === '__custom__' && customCoords
    ? { lat: customCoords.lat, lon: customCoords.lon }
    : CITY_COORDS[city] || CITY_COORDS.Pune;

  const displayCity = city === '__custom__' && customCoords ? customCoords.label : city;

  const [safetyIndex, setSafetyIndex] = useState<SafetyIndex | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [envData, setEnvData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let locality = '';
        let areaName = '';
        let cityName = '';
        let stateName = '';
        try {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=e503869a950072c03bdd6d06b1ccc7b0`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.[0]) {
              cityName = data[0].name || '';
              stateName = data[0].state || '';
            }
          }
        } catch { /* fallback below */ }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data?.address;
            if (addr) {
              areaName = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.county || '';
            }
          }
        } catch { /* use OWM data */ }

        if (areaName && cityName) {
          locality = `${areaName}, ${cityName}`;
        } else if (areaName) {
          locality = areaName;
        } else if (cityName && stateName) {
          locality = `${cityName}, ${stateName}`;
        } else if (cityName) {
          locality = cityName;
        } else {
          locality = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        }

        setDetectedLocality(locality);
        const nearest = findNearestCity(latitude, longitude);
        if (nearest) {
          setCity(nearest);
          setCustomCoords(null);
        } else {
          setCustomCoords({ lat: latitude, lon: longitude, label: cityName || locality });
          setCity('__custom__');
        }
        setLocationDetected(true);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!geoInitDone.current) {
      geoInitDone.current = true;
      detectLocation();
    }
  }, [detectLocation]);

  useEffect(() => {
    loadData();
  }, [language, ageGroup, activity, city, customCoords]);

  async function loadData() {
    setLoading(true);
    setError(null);
    const cityName = displayCity;
    try {
      const [riskResult, alertResult, summaryResult, envResult] = await Promise.allSettled([
        assessRisk(coords.lat, coords.lon, cityName, ageGroup, activity, language),
        getAlerts(coords.lat, coords.lon, cityName, ageGroup),
        getDailySummary(coords.lat, coords.lon, cityName, ageGroup),
        getCurrentEnvironment(coords.lat, coords.lon, cityName),
      ]);
      if (riskResult.status === 'fulfilled') setSafetyIndex(riskResult.value);
      if (alertResult.status === 'fulfilled') setAlerts(alertResult.value);
      if (summaryResult.status === 'fulfilled') setDailySummary(summaryResult.value);
      if (envResult.status === 'fulfilled') setEnvData(envResult.value);
      if ([riskResult, alertResult, summaryResult, envResult].every(r => r.status === 'rejected')) {
        setError(t('common.backendUnavailable', language));
      }
    } catch {
      setError(t('common.connectionError', language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ═══════════════ CINEMATIC HERO (HeroV2) ═══════════════ */}
      <HeroV2 aqi={envData?.aqi ?? 72} />

      {/* ═══════════════ CONTROLS BAR ═══════════════ */}
      <section className="py-3 px-3 sm:px-4 max-w-5xl mx-auto">
        <RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="flex items-center gap-2 glass-card-solid rounded-2xl px-3 py-2.5 min-h-[44px]">
              <MapPin size={16} className="text-accent" />
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (e.target.value !== '__custom__') setCustomCoords(null);
                }}
                className="text-sm text-content-primary bg-transparent outline-none cursor-pointer w-full"
              >
                {customCoords && (
                  <option value="__custom__">📍 {customCoords.label}</option>
                )}
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm rounded-2xl border transition-all duration-300 ${
                locationDetected
                  ? 'bg-risk-low/10 border-risk-low/30 text-risk-low'
                  : 'glass-card-solid text-content-secondary'
              } ${detectingLocation ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
              title={t('detectLocation', language)}
            >
              {detectingLocation ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LocateFixed size={15} />
              )}
              {detectingLocation ? t('common.detecting', language) : locationDetected ? t('common.redetect', language) : t('detectLocation', language)}
            </button>

            <div className="flex items-center gap-2 glass-card-solid rounded-2xl px-3 py-2.5 min-h-[44px]">
              <UserCircle size={16} className="text-accent" />
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="text-sm text-content-primary bg-transparent outline-none cursor-pointer w-full"
              >
                <option value="elderly">{t('seniorCitizen', language)}</option>
                <option value="adult">{t('adult', language)}</option>
              </select>
            </div>

            <div className="flex items-center gap-2 glass-card-solid rounded-2xl px-3 py-2.5 min-h-[44px]">
              <Activity size={16} className="text-accent" />
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityIntent)}
                className="text-sm text-content-primary bg-transparent outline-none cursor-pointer w-full"
              >
                <option value="walking">{t('walking', language)}</option>
                <option value="rest">{t('resting', language)}</option>
                <option value="exercise">{t('exercise', language)}</option>
                <option value="outdoor_work">{t('outdoorWork', language)}</option>
                <option value="commute">{t('commuting', language)}</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={loadData}
              className="px-5 py-2.5 min-h-[44px] bg-accent text-white text-sm rounded-2xl font-medium shadow-glow-green active:shadow-none"
            >
              {t('refresh', language)}
            </motion.button>
          </div>
        </RevealSection>
      </section>

      {/* ═══════════════ ERROR STATE ═══════════════ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-2xl mx-auto px-4 mb-8"
          >
            <div className="p-4 bg-risk-high/10 border border-risk-high/20 rounded-2xl text-center">
              <p className="text-risk-high font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ ALERTS ═══════════════ */}
      {alerts.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <AlertBanner alerts={alerts} />
        </div>
      )}

      {/* ═══════════════ ENVIRONMENT DATA ═══════════════ */}
      <section id="environment-data" className="py-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <RevealSection>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-accent" />
            <h2 className="text-lg font-bold text-content-primary tracking-tight">
              {t('liveEnvironmentData', language)}
            </h2>
          </div>
          <EnvironmentSnapshot data={envData} loading={loading} language={language} />
        </RevealSection>
      </section>

      {/* ═══════════════ SAFETY INDEX + DAILY SUMMARY ═══════════════ */}
      <section className="py-2 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevealSection>
            <SafetyIndexDisplay safetyIndex={safetyIndex} loading={loading} language={language} />
          </RevealSection>
          <div className="space-y-4">
            <RevealSection delay={0.05}>
              <DailySummaryCard summary={dailySummary} loading={loading} language={language} />
            </RevealSection>
            <RevealSection delay={0.1}>
              <EnvironmentAtGlance data={envData} />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════ DAILY INTELLIGENCE ═══════════════ */}
      {(dailySummary?.forecast || safetyIndex) && (
        <DailyIntelligenceSection
          forecastPoints={dailySummary?.forecast?.points || []}
          safetyIndex={safetyIndex}
        />
      )}

      {/* ═══════════════ RISK FACTORS ═══════════════ */}
      {safetyIndex && (
        <section className="py-5 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <RevealSection>
            <div className="flex items-center gap-2 mb-5">
              <Shield size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-content-primary tracking-tight">
                {t('detailedRiskAnalysis', language)}
              </h2>
            </div>
          </RevealSection>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyIndex.all_risks.map((risk, idx) => (
              <StaggerItem key={idx}>
                <RiskCard risk={risk} expanded />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* ═══════════════ FORECAST ═══════════════ */}
      {dailySummary?.forecast && (
        <section className="py-5 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <RevealSection>
            <ForecastChart points={dailySummary.forecast.points} />
          </RevealSection>
        </section>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-8 px-4 text-center border-t border-surface-secondary">
        <FadeIn>
          <p className="text-sm text-content-secondary/60">
            {t('footer', language)}
          </p>
          <p className="text-xs text-content-secondary/40 mt-2">
            {t('disclaimer', language)}
          </p>
        </FadeIn>
      </footer>
    </>
  );
}
