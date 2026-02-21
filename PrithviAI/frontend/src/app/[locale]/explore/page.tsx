'use client';

/**
 * Prithvi — Map Explorer Page
 * Modular environmental intelligence orchestration around InteractiveMap.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Map, Database, MessageSquare, ChevronLeft, ChevronRight, Search, Loader2, X } from 'lucide-react';
import DataPanel from '@/components/DataPanel';
import MapChatBox from '@/components/MapChatBox';
import Navbar from '@/components/Navbar';
import { getMapLandmarks } from '@/lib/api';
import { t } from '@/lib/translations';
import type { Landmark, LocationData, Language } from '@/types';
import { MapProvider, useMapContext } from '@/features/map-engine/context/MapContext';
import { useMapEngineData } from '@/features/map-engine/logic/useMapEngineData';
import { MetricSelector } from '@/features/map-engine/ui/MetricSelector';
import { TimeSlider } from '@/features/map-engine/ui/TimeSlider';
import { MetricMiniCards } from '@/features/map-engine/ui/MetricMiniCards';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-secondary rounded-2xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
      </div>
    </div>
  ),
});

type SidebarTab = 'data' | 'chat';

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceInKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function MapExplorerContent() {
  const locale = useLocale();
  const language = locale as Language;
  const {
    selectedLocation,
    setSelectedLocation,
    visibleBounds,
    selectedMetric,
    selectedTimeIndex,
    seniorMode,
  } = useMapContext();

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('data');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [safestPoint, setSafestPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLandmarks() {
      try {
        const res = await getMapLandmarks();
        setLandmarks(res.landmarks);
      } catch (err) {
        console.error('Failed to load landmarks:', err);
      }
    }
    fetchLandmarks();
  }, []);

  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return landmarks;
    const query = searchQuery.toLowerCase();
    return landmarks.filter(
      (landmark) => landmark.name.toLowerCase().includes(query) || landmark.description.toLowerCase().includes(query),
    );
  }, [landmarks, searchQuery]);

  const {
    mapPoints,
    isLoadingVisibleData,
    microAlerts,
    getOrFetchLocationData,
  } = useMapEngineData({
    landmarks,
    visibleBounds,
    selectedMetric,
    selectedTimeIndex,
    seniorMode,
  });

  const filteredPointNames = useMemo(
    () => new Set(filteredLandmarks.map((landmark) => landmark.name)),
    [filteredLandmarks],
  );

  const filteredMapPoints = useMemo(
    () => mapPoints.filter((point) => filteredPointNames.has(point.name)),
    [mapPoints, filteredPointNames],
  );

  const landmarkRiskLevels = useMemo(() => {
    const levels: Record<string, 'LOW' | 'MODERATE' | 'HIGH'> = {};
    for (const point of mapPoints) {
      levels[point.name] = point.riskLevel;
    }
    return levels;
  }, [mapPoints]);

  const selectedPoint = useMemo(() => {
    if (filteredMapPoints.length === 0) return null;
    if (!selectedLocation) return filteredMapPoints[0];
    if (selectedLocation.name) {
      return filteredMapPoints.find((point) => point.name === selectedLocation.name) || null;
    }

    let best = filteredMapPoints[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const point of filteredMapPoints) {
      const distance = distanceInKm(selectedLocation.lat, selectedLocation.lon, point.lat, point.lon);
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    return best;
  }, [filteredMapPoints, selectedLocation]);

  const handleLocationSelect = useCallback(
    async (lat: number, lon: number, name: string) => {
      setSelectedLocation({ lat, lon, name: name || '' });
      setIsLoadingData(true);
      setDataError(null);
      setSidebarOpen(true);
      setSidebarTab('data');

      try {
        const data = await getOrFetchLocationData(lat, lon, name);
        setLocationData(data);
      } catch (err: any) {
        setDataError(err.message || t('failedLocationData', language));
        setLocationData(null);
      } finally {
        setIsLoadingData(false);
      }
    },
    [getOrFetchLocationData, language, setSelectedLocation],
  );

  const findSafestNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported on this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(current);
        setGeoError(null);

        const nearbyCandidates = filteredMapPoints
          .map((point) => ({
            point,
            distance: distanceInKm(current.lat, current.lon, point.lat, point.lon),
          }))
          .filter((candidate) => candidate.distance <= 5)
          .sort((a, b) => a.point.metricValues.safety_score - b.point.metricValues.safety_score);

        if (nearbyCandidates.length === 0) {
          setSafestPoint(null);
          setGeoError('No mapped locations within 5 km.');
          return;
        }

        const safest = nearbyCandidates[0].point;
        setSafestPoint({ lat: safest.lat, lon: safest.lon, name: safest.name });
        handleLocationSelect(safest.lat, safest.lon, safest.name);
      },
      () => {
        setGeoError('Location access denied. Unable to find safest nearby point.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [filteredMapPoints, handleLocationSelect]);

  return (
    <div className="min-h-screen bg-surface-primary pt-16">
      <Navbar language={language} onLanguageChange={() => {}} />

      <div className="glass-card-solid border-b border-surface-secondary">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent rounded-2xl">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-content-primary">{t('mapExplorerTitle', language)}</h1>
                <p className="text-xs text-content-secondary">
                  {t('clickMapToExplore', language)}
                </p>
              </div>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="text"
                placeholder={t('searchLocations', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-surface-secondary border border-surface-secondary rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 text-content-primary placeholder:text-content-secondary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary hover:text-content-primary"
                >
                  <X size={14} />
                </button>
              )}
              <AnimatePresence>
                {searchQuery && filteredLandmarks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="absolute top-full left-0 right-0 mt-1 glass-card-solid border border-surface-secondary rounded-2xl shadow-elevated z-50 max-h-60 overflow-y-auto"
                  >
                    {filteredLandmarks.map((landmark) => (
                      <button
                        key={landmark.name}
                        onClick={() => {
                          handleLocationSelect(landmark.lat, landmark.lon, landmark.name);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-accent/5 transition-colors border-b border-surface-secondary last:border-0"
                      >
                        <span className="text-sm font-medium text-content-primary">{landmark.name}</span>
                        <span className="text-xs text-content-secondary ml-2">{landmark.description}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-4">
        <div className="space-y-3 mb-3">
          <MetricSelector />
          <MetricMiniCards point={selectedPoint} selectedMetric={selectedMetric} />
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={findSafestNearby}
            className="min-h-[44px] px-4 rounded-xl bg-accent text-white text-sm font-medium"
          >
            Find Safest Nearby
          </button>
          {geoError ? <span className="text-xs text-risk-high">{geoError}</span> : null}
          {isLoadingVisibleData ? (
            <span className="text-xs text-content-secondary inline-flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              Loading visible data
            </span>
          ) : null}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:h-[calc(100vh-17rem)]">
          <motion.div
            layout
            className="flex-1 min-h-[360px] h-[58vh] sm:h-[62vh] lg:h-auto"
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <InteractiveMap
              landmarks={filteredLandmarks}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              landmarkRiskLevels={landmarkRiskLevels}
              points={filteredMapPoints}
              userLocation={userLocation}
              safestPoint={safestPoint}
              isLoading={isLoadingData}
            />
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="self-end lg:self-center p-2.5 min-h-[44px] min-w-[44px] glass-card-solid rounded-2xl shadow-elevated z-10 text-content-secondary transition-colors"
            aria-label={sidebarOpen ? t('closeSidebar', language) : t('openSidebar', language)}
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </motion.button>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="w-full lg:w-[420px] shrink-0 glass-card-solid rounded-3xl border border-surface-secondary shadow-elevated flex flex-col overflow-hidden"
              >
                <div className="flex border-b border-surface-secondary">
                  <button
                    onClick={() => setSidebarTab('data')}
                    className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                      sidebarTab === 'data'
                        ? 'text-accent bg-accent/5 border-b-2 border-accent'
                        : 'text-content-secondary'
                    }`}
                  >
                    <Database size={15} />
                    {t('data', language)}
                  </button>
                  <button
                    onClick={() => setSidebarTab('chat')}
                    className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                      sidebarTab === 'chat'
                        ? 'text-accent bg-accent/5 border-b-2 border-accent'
                        : 'text-content-secondary'
                    }`}
                  >
                    <MessageSquare size={15} />
                    {t('navAIChat', language)}
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  {sidebarTab === 'data' ? (
                    <DataPanel data={locationData} isLoading={isLoadingData} error={dataError} language={language} />
                  ) : (
                    <MapChatBox selectedLocation={selectedLocation} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3">
          <TimeSlider />
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {microAlerts.slice(0, 8).map((alert) => (
            <button
              key={alert.id}
              onClick={() => handleLocationSelect(alert.lat, alert.lon, alert.locationName)}
              className="shrink-0 min-h-[44px] px-3 py-2 rounded-full text-xs border border-amber-400/40 bg-amber-400/10 text-amber-300"
            >
              {alert.locationName}: {alert.text}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-content-secondary shrink-0 font-medium">{t('quick', language)}</span>
          {landmarks.slice(0, 8).map((landmark) => {
            const isActive = selectedLocation?.name === landmark.name;
            const riskLevel = landmarkRiskLevels[landmark.name];
            return (
              <motion.button
                key={landmark.name}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleLocationSelect(landmark.lat, landmark.lon, landmark.name)}
                className={`shrink-0 min-h-[44px] px-4 py-2 text-xs rounded-full border transition-all ${
                  isActive
                    ? 'bg-accent text-white border-accent shadow-glow-green'
                    : 'glass-card-solid text-content-secondary border-surface-secondary'
                }`}
              >
                {riskLevel && (
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor:
                        riskLevel === 'LOW' ? 'var(--risk-low)' : riskLevel === 'MODERATE' ? 'var(--risk-moderate)' : 'var(--risk-high)',
                    }}
                  />
                )}
                {landmark.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MapExplorerPage() {
  return (
    <MapProvider>
      <MapExplorerContent />
    </MapProvider>
  );
}
