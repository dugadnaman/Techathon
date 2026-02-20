'use client';

/**
 * PrithviAI — Cinematic Hero V2
 * Premium dark hero with rotating Earth, AQI-reactive glow,
 * elegant typography, and glass dashboard preview.
 *
 * Z-INDEX LAYERS:
 * 0 → Starfield
 * 1 → Rotating Earth
 * 2 → AQI Glow Overlay
 * 3 → Atmospheric blur
 * 4 → Navbar + Hero Text
 * 5 → Glass Dashboard Preview
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import NavbarV2 from './NavbarV2';
import GlowOverlay from './GlowOverlay';
import GlassPreview from './GlassPreview';

// Lazy load heavy canvas components
const Starfield = dynamic(() => import('./Starfield'), { ssr: false });
const EarthBackground = dynamic(() => import('./EarthBackground'), { ssr: false });

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface HeroV2Props {
  /** Live AQI value from environment data */
  aqi?: number;
}

export default function HeroV2({ aqi = 72 }: HeroV2Props) {
  const [currentAqi, setCurrentAqi] = useState(aqi);

  useEffect(() => {
    setCurrentAqi(aqi);
  }, [aqi]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: '#000000',
        minHeight: '100vh',
      }}
    >
      {/* ═══ Z-0: Starfield ═══ */}
      <Starfield />

      {/* ═══ Z-1: Rotating Earth ═══ */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 1, transform: 'scale(1.2) translateY(8%)' }}
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
          top: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 500,
          background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* ═══ Z-4: Content Layer ═══ */}
      <div className="relative" style={{ zIndex: 4 }}>
        {/* Navbar */}
        <NavbarV2 />

        {/* Hero Content */}
        <div
          className="flex flex-col items-center text-center mx-auto px-6"
          style={{ maxWidth: 900, marginTop: 100 }}
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
                fontSize: 'clamp(42px, 6vw, 76px)',
                letterSpacing: '-2px',
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
                fontSize: 'clamp(32px, 5vw, 76px)',
                letterSpacing: '-2px',
                lineHeight: 1.1,
                fontWeight: 400,
              }}
            >
              Environmental intelligence for real life.
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
              fontSize: 18,
              lineHeight: '26px',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: 650,
            }}
          >
            Real-time environmental risk analysis, predictive safety insights,
            and voice-powered guidance — built for the people who need it most.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT }}
            className="flex flex-col sm:flex-row items-center mt-8"
            style={{ gap: 22 }}
          >
            {/* Primary */}
            <motion.a
              href="#environment-data"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center justify-center text-white font-medium text-sm"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: '#14B8A6',
                padding: '14px 24px',
                borderRadius: 10,
                boxShadow: '0 0 30px rgba(20, 184, 166, 0.3)',
              }}
            >
              Check My Area
            </motion.a>

            {/* Secondary */}
            <motion.a
              href="/chat"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center justify-center text-white font-medium text-sm"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '14px 24px',
                borderRadius: 10,
              }}
            >
              Use Voice Assistant
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
              AQI {currentAqi} · {currentAqi <= 50 ? 'Good' : currentAqi <= 100 ? 'Moderate' : currentAqi <= 200 ? 'Unhealthy' : 'Severe'}
            </span>
          </motion.div>
        </div>

        {/* ═══ Z-5: Glass Dashboard Preview ═══ */}
        <GlassPreview />
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
