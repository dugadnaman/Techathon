'use client';

/**
 * PrithviAI — AQI-Reactive Glow Overlay
 * Radial gradient overlay that smoothly reflects current AQI state.
 * Implements cinematic neutral-fade transition between states.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAQIGlow } from './getAQIGlow';

interface GlowOverlayProps {
  aqi: number;
}

const NEUTRAL = 'rgba(0,0,0,0.18)';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function GlowOverlay({ aqi }: GlowOverlayProps) {
  const [displayColor, setDisplayColor] = useState(() => getAQIGlow(aqi));
  const [isMobile, setIsMobile] = useState(false);
  const transitioningRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAqiRef = useRef(aqi);
  const [transitionDuration, setTransitionDuration] = useState('1s');

  const transitionToNewColor = useCallback((targetAqi: number) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    // Step 1: Fade to neutral (400ms)
    setTransitionDuration('0.4s');
    setDisplayColor(NEUTRAL);

    // Step 2: Pause 250ms, then apply new color (700ms)
    setTimeout(() => {
      setTransitionDuration('0.7s');
      setDisplayColor(getAQIGlow(targetAqi));

      // Cooldown
      setTimeout(() => {
        transitioningRef.current = false;
      }, 750);
    }, 650); // 400ms transition + 250ms pause
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (aqi === prevAqiRef.current) return;
    prevAqiRef.current = aqi;

    // Debounce rapid updates
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      transitionToNewColor(aqi);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [aqi, transitionToNewColor]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        zIndex: 2,
        top: '50%',
        left: '50%',
        width: '130%',
        height: '130%',
        transform: 'translate(-50%, -50%)',
        opacity: isMobile ? 0.72 : 1,
        background: `radial-gradient(ellipse at center, ${displayColor} 0%, transparent 70%)`,
        transition: `background ${transitionDuration} ${EASE}`,
      }}
      aria-hidden="true"
    />
  );
}
