'use client';

/**
 * PrithviAI — Home Page
 * Main citizen-facing view with Safety Index, alerts, environment data, and daily summary.
 */

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SafetyIndexDisplay from '@/components/SafetyIndex';
import RiskCard from '@/components/RiskCard';
import AlertBanner from '@/components/AlertBanner';
import DailySummaryCard from '@/components/DailySummary';
import EnvironmentSnapshot from '@/components/EnvironmentSnapshot';
import ForecastChart from '@/components/ForecastChart';
import { assessRisk, getAlerts, getDailySummary, getCurrentEnvironment } from '@/lib/api';
import type { SafetyIndex, HealthAlert, DailySummary, EnvironmentData, Language, AgeGroup, ActivityIntent } from '@/types';
import { Shield, MapPin, UserCircle, Activity } from 'lucide-react';
import { t } from '@/lib/translations';

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elderly');
  const [activity, setActivity] = useState<ActivityIntent>('walking');
  const [city, setCity] = useState('Pune');

  // Accurate coordinates for each city
  const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    Pune: { lat: 18.5204, lon: 73.8567 },
    Mumbai: { lat: 19.0760, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.2090 },
    Bangalore: { lat: 12.9716, lon: 77.5946 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Hyderabad: { lat: 17.3850, lon: 78.4867 },
  };

  const coords = CITY_COORDS[city] || CITY_COORDS.Pune;

  const [safetyIndex, setSafetyIndex] = useState<SafetyIndex | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [envData, setEnvData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [language, ageGroup, activity, city]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [riskResult, alertResult, summaryResult, envResult] = await Promise.allSettled([
        assessRisk(coords.lat, coords.lon, city, ageGroup, activity, language),
        getAlerts(coords.lat, coords.lon, city, ageGroup),
        getDailySummary(coords.lat, coords.lon, city, ageGroup),
        getCurrentEnvironment(coords.lat, coords.lon, city),
      ]);

      if (riskResult.status === 'fulfilled') setSafetyIndex(riskResult.value);
      if (alertResult.status === 'fulfilled') setAlerts(alertResult.value);
      if (summaryResult.status === 'fulfilled') setDailySummary(summaryResult.value);
      if (envResult.status === 'fulfilled') setEnvData(envResult.value);

      // If all failed, show error
      if ([riskResult, alertResult, summaryResult, envResult].every(r => r.status === 'rejected')) {
        setError('Unable to connect to backend. Please ensure the server is running on port 8000.');
      }
    } catch (e) {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar language={language} onLanguageChange={setLanguage} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            <span className="gradient-text">Prithvi</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t('tagline', language)}
          </p>
        </div>

        {/* User Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
            <MapPin size={16} className="text-green-600" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
            <UserCircle size={16} className="text-green-600" />
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="elderly">{t('seniorCitizen', language)}</option>
              <option value="adult">{t('adult', language)}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
            <Activity size={16} className="text-green-600" />
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityIntent)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="walking">{t('walking', language)}</option>
              <option value="rest">{t('resting', language)}</option>
              <option value="exercise">{t('exercise', language)}</option>
              <option value="outdoor_work">{t('outdoorWork', language)}</option>
              <option value="commute">{t('commuting', language)}</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 shadow-sm"
          >
            {t('refresh', language)}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-500 text-sm mt-1">
              Run: <code className="bg-red-100 px-2 py-0.5 rounded">cd backend && uvicorn main:app --reload --port 8000</code>
            </p>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <AlertBanner alerts={alerts} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Safety Index (Center/Top) */}
          <div className="lg:col-span-1">
            <SafetyIndexDisplay safetyIndex={safetyIndex} loading={loading} language={language} />
          </div>

          {/* Daily Summary + Environment */}
          <div className="lg:col-span-2 space-y-6">
            <EnvironmentSnapshot data={envData} loading={loading} language={language} />
            <DailySummaryCard summary={dailySummary} loading={loading} language={language} />
          </div>
        </div>

        {/* All Risk Factors */}
        {safetyIndex && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-green-600" />
              {t('detailedRiskAnalysis', language)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safetyIndex.all_risks.map((risk, idx) => (
                <RiskCard key={idx} risk={risk} expanded />
              ))}
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        {dailySummary?.forecast && (
          <div className="mb-8">
            <ForecastChart points={dailySummary.forecast.points} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-100 mt-12">
          <p className="text-sm text-gray-400">
            {t('footer', language)}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {t('disclaimer', language)}
          </p>
        </footer>
      </main>
    </>
  );
}
