'use client';

/**
 * Prithvi — Map Explorer Page
 * Layered map layout with floating glass sidebar and AI assistant.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Map, Database, MessageSquare, ChevronLeft, ChevronRight, Search, Loader2, X } from 'lucide-react';
import DataPanel from '@/components/DataPanel';
import MapChatBox from '@/components/MapChatBox';
import Navbar from '@/components/Navbar';
import { getMapLandmarks, getLocationData } from '@/lib/api';
import { t } from '@/lib/translations';
import type { Landmark, LocationData, RiskLevel, Language } from '@/types';

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

export default function MapExplorerPage() {
  const locale = useLocale();
  const language = locale as Language;

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('data');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [landmarkRiskLevels, setLandmarkRiskLevels] = useState<Record<string, RiskLevel>>({});

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

  const handleLocationSelect = useCallback(
    async (lat: number, lon: number, name: string) => {
      setSelectedLocation({ lat, lon, name: name || '' });
      setIsLoadingData(true);
      setDataError(null);
      setSidebarOpen(true);
      setSidebarTab('data');

      try {
        const data = await getLocationData(lat, lon, name);
        setLocationData(data);
        if (data.location_name && data.safety_index) {
          setLandmarkRiskLevels((prev) => ({
            ...prev,
            [data.location_name]: data.safety_index.overall_level as RiskLevel,
          }));
        }
      } catch (err: any) {
        setDataError(err.message || t('failedLocationData', language));
        setLocationData(null);
      } finally {
        setIsLoadingData(false);
      }
    },
    [],
  );

  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return landmarks;
    const q = searchQuery.toLowerCase();
    return landmarks.filter(
      (lm) => lm.name.toLowerCase().includes(q) || lm.description.toLowerCase().includes(q),
    );
  }, [landmarks, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-primary pt-16">
      <Navbar language={language} onLanguageChange={() => {}} />

      {/* Page Header */}
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
                    {filteredLandmarks.map((lm) => (
                      <button
                        key={lm.name}
                        onClick={() => {
                          handleLocationSelect(lm.lat, lm.lon, lm.name);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-accent/5 transition-colors border-b border-surface-secondary last:border-0"
                      >
                        <span className="text-sm font-medium text-content-primary">{lm.name}</span>
                        <span className="text-xs text-content-secondary ml-2">{lm.description}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:h-[calc(100vh-10rem)]">
          {/* Map Area */}
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
              isLoading={isLoadingData}
            />
          </motion.div>

          {/* Sidebar Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="self-end lg:self-center p-2.5 min-h-[44px] min-w-[44px] glass-card-solid rounded-2xl shadow-elevated z-10 text-content-secondary transition-colors"
            aria-label={sidebarOpen ? t('closeSidebar', language) : t('openSidebar', language)}
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </motion.button>

          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="w-full lg:w-[420px] shrink-0 glass-card-solid rounded-3xl border border-surface-secondary shadow-elevated flex flex-col overflow-hidden"
              >
                {/* Tabs */}
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

                {/* Tab Content */}
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
      </div>

      {/* Quick-Access Pills */}
      <div className="max-w-[1920px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-content-secondary shrink-0 font-medium">{t('quick', language)}</span>
          {landmarks.slice(0, 8).map((lm) => {
            const isActive = selectedLocation?.name === lm.name;
            const riskLevel = landmarkRiskLevels[lm.name];
            return (
              <motion.button
                key={lm.name}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleLocationSelect(lm.lat, lm.lon, lm.name)}
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
                {lm.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
