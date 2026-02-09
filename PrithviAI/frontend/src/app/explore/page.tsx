'use client';

/**
 * PrithviAI — Map Explorer Page
 * Interactive map-based data visualization tool with integrated AI assistant.
 *
 * Components: InteractiveMap | DataPanel | MapChatBox
 * Data: OpenWeatherMap + AQICN (real-time, free tier) | Gemini AI (free tier)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Map, Database, MessageSquare, ChevronLeft, ChevronRight, Search, Loader2, X } from 'lucide-react';
import DataPanel from '@/components/DataPanel';
import MapChatBox from '@/components/MapChatBox';
import Navbar from '@/components/Navbar';
import { getMapLandmarks, getLocationData } from '@/lib/api';
import { t } from '@/lib/translations';
import type { Landmark, LocationData, RiskLevel } from '@/types';
import type { Language } from '@/types';

// Dynamic import to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

type SidebarTab = 'data' | 'chat';

export default function MapExplorerPage() {
  // ── State ──
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
  const [language, setLanguage] = useState<Language>('en');

  // ── Load landmarks on mount ──
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

  // ── Fetch location data when a point is selected ──
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

        // Update landmark risk levels cache
        if (data.location_name && data.safety_index) {
          setLandmarkRiskLevels((prev) => ({
            ...prev,
            [data.location_name]: data.safety_index.overall_level as RiskLevel,
          }));
        }
      } catch (err: any) {
        setDataError(err.message || 'Failed to load data for this location');
        setLocationData(null);
      } finally {
        setIsLoadingData(false);
      }
    },
    [],
  );

  // ── Search / filter landmarks ──
  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return landmarks;
    const q = searchQuery.toLowerCase();
    return landmarks.filter(
      (lm) => lm.name.toLowerCase().includes(q) || lm.description.toLowerCase().includes(q),
    );
  }, [landmarks, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Navbar */}
      <Navbar language={language} onLanguageChange={setLanguage} />

      {/* Page Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('mapExplorerTitle', language)}</h1>
                <p className="text-xs text-gray-500">
                  {t('clickMapToExplore', language)}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchLocations', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
              {/* Search Results Dropdown */}
              {searchQuery && filteredLandmarks.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {filteredLandmarks.map((lm) => (
                    <button
                      key={lm.name}
                      onClick={() => {
                        handleLocationSelect(lm.lat, lm.lon, lm.name);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors border-b last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-800">{lm.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{lm.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto p-4">
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          {/* Map Area */}
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? '' : 'w-full'}`}>
            <InteractiveMap
              landmarks={filteredLandmarks}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              landmarkRiskLevels={landmarkRiskLevels}
              isLoading={isLoadingData}
            />
          </div>

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="self-center p-2 bg-white border rounded-xl shadow-md hover:bg-gray-50 transition-colors z-10"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Sidebar: Data Panel + Chat */}
          {sidebarOpen && (
            <div className="w-[420px] shrink-0 bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setSidebarTab('data')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    sidebarTab === 'data'
                      ? 'text-green-700 bg-green-50 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Database size={15} />
                  {t('data', language)}
                </button>
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    sidebarTab === 'chat'
                      ? 'text-green-700 bg-green-50 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare size={15} />
                  {t('navAIChat', language)}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {sidebarTab === 'data' ? (
                  <DataPanel
                    data={locationData}
                    isLoading={isLoadingData}
                    error={dataError}
                  />
                ) : (
                  <MapChatBox selectedLocation={selectedLocation} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Quick-Access Pills (bottom of map) */}
      <div className="max-w-[1920px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-gray-500 shrink-0 font-medium">{t('quick', language)}</span>
          {landmarks.slice(0, 8).map((lm) => {
            const isActive = selectedLocation?.name === lm.name;
            const riskLevel = landmarkRiskLevels[lm.name];
            return (
              <button
                key={lm.name}
                onClick={() => handleLocationSelect(lm.lat, lm.lon, lm.name)}
                className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${
                  isActive
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                }`}
              >
                {riskLevel && (
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor:
                        riskLevel === 'LOW' ? '#22c55e' : riskLevel === 'MODERATE' ? '#f59e0b' : '#ef4444',
                    }}
                  />
                )}
                {lm.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
