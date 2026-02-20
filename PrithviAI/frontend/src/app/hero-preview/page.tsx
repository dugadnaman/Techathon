'use client';

/**
 * PrithviAI — Hero V2 Preview Page
 * Experimental cinematic hero preview at /hero-preview
 * Does NOT affect main homepage.
 */

import { useState, useEffect, useCallback } from 'react';
import HeroV2 from '@/components/hero-v2/HeroV2';
import { getCurrentEnvironment } from '@/lib/api';

export default function HeroPreviewPage() {
  const [aqi, setAqi] = useState(72);

  // Fetch real AQI on mount
  useEffect(() => {
    const fetchAqi = async () => {
      try {
        const data = await getCurrentEnvironment(18.5204, 73.8567); // Pune
        if (data?.aqi) setAqi(data.aqi);
      } catch {
        // Fallback to default
      }
    };
    fetchAqi();
  }, []);

  return (
    <main className="min-h-screen" style={{ background: '#000' }}>
      <HeroV2 aqi={aqi} />

      {/* Below-fold content placeholder */}
      <div
        className="py-20 px-6 text-center"
        style={{ background: 'var(--bg-primary, #0F172A)' }}
      >
        <p className="text-content-secondary text-sm">
          ↑ Cinematic Hero V2 Preview — Scroll up to see the full hero experience
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-content-secondary">Test AQI:</span>
          {[25, 72, 142, 250, 350].map((val) => (
            <button
              key={val}
              onClick={() => setAqi(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                aqi === val
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
              }`}
            >
              AQI {val}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
