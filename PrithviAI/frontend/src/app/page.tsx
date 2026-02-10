'use client';

/**
 * PrithviAI — Home Page
 * Main citizen-facing view with Safety Index, alerts, environment data, and daily summary.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import SafetyIndexDisplay from '@/components/SafetyIndex';
import RiskCard from '@/components/RiskCard';
import AlertBanner from '@/components/AlertBanner';
import DailySummaryCard from '@/components/DailySummary';
import EnvironmentSnapshot from '@/components/EnvironmentSnapshot';
import ForecastChart from '@/components/ForecastChart';
import { assessRisk, getAlerts, getDailySummary, getCurrentEnvironment } from '@/lib/api';
import type { SafetyIndex, HealthAlert, DailySummary, EnvironmentData, Language, AgeGroup, ActivityIntent } from '@/types';
import { Shield, MapPin, UserCircle, Activity, LocateFixed, Loader2 } from 'lucide-react';
import { t } from '@/lib/translations';

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

/** Haversine distance (km) between two lat/lon points */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest supported city within a threshold (km) */
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
  const [language, setLanguage] = useState<Language>('en');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elderly');
  const [activity, setActivity] = useState<ActivityIntent>('walking');
  const [city, setCity] = useState('Pune');

  // Custom coordinates when using detected location outside preset cities
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  // Precise locality text shown after detection (e.g. "Koregaon Park, Pune")
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

  /** Detect user location via browser Geolocation API */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Always reverse-geocode to get the precise locality name
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

        // Try Nominatim for more granular area name (suburb/neighbourhood)
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

        // Build a precise locality string like "Koregaon Park, Pune" or "Andheri, Mumbai"
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
          // User is near a supported city — use it for API requests
          setCity(nearest);
          setCustomCoords(null);
        } else {
          // User is far from preset cities — use exact coords
          setCustomCoords({ lat: latitude, lon: longitude, label: cityName || locality });
          setCity('__custom__');
        }
        setLocationDetected(true);
        setDetectingLocation(false);
      },
      () => {
        // Permission denied or error — keep Pune default
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Auto-detect location on first mount
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
              onChange={(e) => {
                setCity(e.target.value);
                if (e.target.value !== '__custom__') setCustomCoords(null);
              }}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
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

          {/* Detect Location Button */}
          <button
            onClick={detectLocation}
            disabled={detectingLocation}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border shadow-sm transition-colors ${
              locationDetected
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
            } ${detectingLocation ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
            title="Detect my location"
          >
            {detectingLocation ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <LocateFixed size={15} />
            )}
            {detectingLocation ? 'Detecting...' : locationDetected ? 'Re-detect' : 'Detect Location'}
          </button>

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

        {/* Detected Location Banner */}
        {detectedLocality && locationDetected && (
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl max-w-lg mx-auto">
            <MapPin size={16} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              Your location: <span className="font-semibold text-green-800">{detectedLocality}</span>
            </span>
          </div>
        )}
        {detectingLocation && (
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl max-w-lg mx-auto">
            <Loader2 size={16} className="text-gray-400 animate-spin flex-shrink-0" />
            <span className="text-sm text-gray-500">Detecting your location...</span>
          </div>
        )}

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
