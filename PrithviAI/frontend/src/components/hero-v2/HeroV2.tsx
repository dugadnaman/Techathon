'use client';

/**
 * PrithviAI — Cinematic Hero V2
 * Premium dark hero with rotating Earth, AQI-reactive glow,
 * elegant typography, and mobile-first CTA flow.
 *
 * Z-INDEX LAYERS:
 * 0 → Starfield
 * 1 → Rotating Earth
 * 2 → AQI Glow Overlay
 * 3 → Atmospheric blur
 * 4 → Navbar + Hero Text
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import NavbarV2 from './NavbarV2';
import GlowOverlay from './GlowOverlay';
import DataConfidenceBadge from '@/components/DataConfidenceBadge';
import { AnimatedCounter } from '@/components/motion';
import { t } from '@/lib/translations';
import { formatLocalizedNumber, getRiskColor, getScoreRingColor } from '@/lib/utils';
import type { Language, SafetyIndex } from '@/types';
import { tRisk } from '@/lib/translations';

// Lazy load heavy canvas components
const Starfield = dynamic(() => import('./Starfield'), { ssr: false });
const EarthBackground = dynamic(() => import('./EarthBackground'), { ssr: false });

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface HeroV2Props {
  /** Live AQI value from environment data */
  aqi?: number;
  /** Safety score data to prioritize in hero */
  safetyIndex?: SafetyIndex | null;
  /** Loading state for safety data */
  loading?: boolean;
  /** Current location label */
  locationLabel?: string;
}

export default function HeroV2({
  aqi = 72,
  safetyIndex = null,
  loading = false,
  locationLabel = '',
}: HeroV2Props) {
  const locale = useLocale() as Language;
  const [currentAqi, setCurrentAqi] = useState(aqi);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setCurrentAqi(aqi);
  }, [aqi]);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const aqiLabel = useMemo(() => {
    if (currentAqi <= 50) return t('aqi.good', locale);
    if (currentAqi <= 100) return t('aqi.moderate', locale);
    if (currentAqi <= 200) return t('aqi.unhealthy', locale);
    return t('aqi.severe', locale);
  }, [currentAqi, locale]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: '#000000',
        minHeight: '100vh',
      }}
    >
      {/* ═══ Z-0: Starfield ═══ */}
      {!isMobile && <Starfield />}

      {/* ═══ Z-1: Rotating Earth ═══ */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          zIndex: 1,
          transform: isMobile ? 'scale(1.02) translateY(10%)' : 'scale(1.14) translateY(8%)',
        }}
      >
        <EarthBackground />
      </div>

      {/* ═══ Z-2: AQI Glow Overlay ═══ */}
      <GlowOverlay aqi={currentAqi} />

      {/* ═══ Z-3: Atmospheric Blur Layer ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 3,
          top: isMobile ? 140 : 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? 420 : 900,
          height: isMobile ? 280 : 500,
          background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.08) 0%, transparent 72%)',
          filter: `blur(${isMobile ? 56 : 80}px)`,
        }}
        aria-hidden="true"
      />

      {/* ═══ Z-4: Content Layer ═══ */}
      <div className="relative" style={{ zIndex: 4 }}>
        {/* Navbar */}
        <NavbarV2 />

        {/* Hero Content */}
        <div
          className="flex flex-col items-center text-center mx-auto px-4 sm:px-6"
          style={{ maxWidth: 900, marginTop: isMobile ? 56 : 92 }}
        >
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <h1
              className="text-white font-bold"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(34px, 12vw, 76px)',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              Prithvi
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          >
            <h2
              className="text-white mt-2"
              style={{
                fontFamily: "'Instrument Serif', 'Georgia', serif",
                fontStyle: 'italic',
                fontSize: 'clamp(24px, 9vw, 62px)',
                letterSpacing: '-0.04em',
                lineHeight: 1.12,
                fontWeight: 400,
              }}
            >
              {t('hero.subtitle', locale)}
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
            className="mt-6"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: isMobile ? 15 : 18,
              lineHeight: isMobile ? '22px' : '26px',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: isMobile ? 340 : 650,
            }}
          >
            {t('hero.description', locale)}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center mt-7 w-full sm:w-auto"
            style={{ gap: 22 }}
          >
            {/* Primary */}
            <motion.a
              href="#environment-data"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex min-h-[44px] items-center justify-center text-white font-medium text-sm w-full sm:w-auto"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: '#14B8A6',
                padding: '14px 24px',
                borderRadius: 10,
                boxShadow: '0 0 30px rgba(20, 184, 166, 0.3)',
              }}
            >
              {t('hero.checkMyArea', locale)}
            </motion.a>

            {/* Secondary */}
            <motion.a
              href="/chat"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex min-h-[44px] items-center justify-center text-white font-medium text-sm w-full sm:w-auto"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '14px 24px',
                borderRadius: 10,
              }}
            >
              {t('hero.voiceAssistant', locale)}
            </motion.a>
          </motion.div>

          {/* AQI Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6, ease: EASE_OUT }}
            className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: currentAqi <= 50 ? '#22C55E' : currentAqi <= 100 ? '#14B8A6' : currentAqi <= 200 ? '#F59E0B' : '#EF4444',
                boxShadow: `0 0 8px ${currentAqi <= 50 ? 'rgba(34,197,94,0.5)' : currentAqi <= 100 ? 'rgba(20,184,166,0.5)' : currentAqi <= 200 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}`,
              }}
            />
            <span
              className="text-white/70 text-xs"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {t('environment.aqi', locale)} {formatLocalizedNumber(currentAqi, locale, { maximumFractionDigits: 0 })} · {aqiLabel}
            </span>
          </motion.div>

          {/* Priority Safety Index Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72, ease: EASE_OUT }}
            className="mt-6 w-full"
            style={{ maxWidth: isMobile ? 360 : 720 }}
          >
            <div
              className="glass-card-solid rounded-3xl border border-white/10"
              style={{
                background: 'linear-gradient(160deg, rgba(17,24,39,0.92), rgba(30,27,75,0.82))',
                backdropFilter: 'blur(14px)',
              }}
            >
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-5">
                <div className="text-center">
                  <h3 className="text-lg sm:text-2xl font-semibold text-white">
                    {t('seniorSafetyIndex', locale)}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-1">
                    {t('realtimeSafetyAssessment', locale)}
                    {locationLabel ? ` · ${locationLabel}` : ''}
                  </p>
                </div>

                {safetyIndex?.data_quality && (
                  <div className="mt-3">
                    <DataConfidenceBadge dataQuality={safetyIndex.data_quality} />
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  {loading ? (
                    <div className="w-40 h-40 rounded-full border-4 border-surface-secondary animate-pulse" />
                  ) : safetyIndex ? (
                    (() => {
                      const score = safetyIndex.overall_score;
                      const ringColor = getScoreRingColor(score);
                      const circumference = 2 * Math.PI * 60;
                      const progress = (score / 100) * circumference;
                      return (
                        <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle
                              cx="80"
                              cy="80"
                              r="60"
                              fill="none"
                              stroke="rgba(255,255,255,0.14)"
                              strokeWidth="10"
                            />
                            <motion.circle
                              cx="80"
                              cy="80"
                              r="60"
                              fill="none"
                              stroke={ringColor}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: circumference - progress }}
                              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-2xl bg-black/30">
                              <span className={`text-4xl font-extrabold tracking-tighter ${getRiskColor(safetyIndex.overall_level)}`}>
                                <AnimatedCounter value={score} duration={1.2} />
                              </span>
                            </span>
                            <span
                              className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                                safetyIndex.overall_level === 'LOW'
                                  ? 'bg-risk-low'
                                  : safetyIndex.overall_level === 'MODERATE'
                                    ? 'bg-risk-moderate'
                                    : 'bg-risk-high'
                              }`}
                            >
                              {tRisk(safetyIndex.overall_level, locale)}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-40 h-40 rounded-full border border-white/20 flex items-center justify-center text-white/70 text-sm">
                      {t('loading', locale)}...
                    </div>
                  )}
                </div>

                {safetyIndex?.summary ? (
                  <p className="mt-4 text-sm sm:text-lg text-white/82 leading-relaxed text-center">
                    {safetyIndex.summary}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Bottom gradient fade to page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 200,
          background: 'linear-gradient(to top, var(--bg-primary, #0F172A) 0%, transparent 100%)',
          zIndex: 6,
        }}
      />
    </section>
  );
}
