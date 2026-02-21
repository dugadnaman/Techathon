'use client';

/**
 * PrithviAI — Rotating Earth Background
 * Canvas-rendered Earth globe with continental outlines,
 * atmospheric glow, and slow rotation.
 * No external assets required — pure procedural rendering.
 */

import { useEffect, useRef, useCallback } from 'react';

// Simplified continent outlines (lon, lat pairs normalized to -180..180, -90..90)
// These are rough polygonal outlines for visual effect
const CONTINENTS: number[][][] = [
  // Africa
  [[-17,15],[10,35],[32,32],[42,12],[50,-1],[40,-15],[35,-34],[18,-35],[12,-5],[-17,5],[-17,15]],
  // Europe
  [[-10,36],[0,43],[5,47],[10,45],[15,55],[30,60],[40,55],[30,45],[25,35],[15,38],[-10,36]],
  // Asia
  [[30,60],[40,55],[50,45],[55,25],[70,20],[80,10],[90,22],[100,20],[105,15],[110,22],[120,30],[130,40],[140,45],[150,55],[170,65],[180,65],[180,70],[140,70],[100,70],[60,70],[30,60]],
  // North America
  [[-170,65],[-140,60],[-130,55],[-125,50],[-120,35],[-105,30],[-100,25],[-80,25],[-75,30],[-65,45],[-55,50],[-60,55],[-70,60],[-90,65],[-130,72],[-170,65]],
  // South America
  [[-80,10],[-75,5],[-70,-5],[-75,-15],[-70,-25],[-65,-35],[-70,-55],[-75,-50],[-80,-40],[-80,-20],[-80,10]],
  // Australia
  [[115,-10],[130,-12],[140,-15],[150,-25],[150,-35],[140,-38],[130,-32],[115,-22],[115,-10]],
];

function lonLatToSphere(lon: number, lat: number, radius: number, rotation: number): { x: number; y: number; z: number } {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + rotation) * Math.PI) / 180;
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

export default function EarthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const rotationRef = useRef(0);

  const drawEarth = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, rotation: number) => {
    const cx = w / 2;
    const cy = h * 0.55; // slightly below center
    const radius = Math.min(w, h) * 0.42;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Outer atmospheric glow
    const atmosGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.35);
    atmosGrad.addColorStop(0, 'rgba(20, 184, 166, 0.15)');
    atmosGrad.addColorStop(0.4, 'rgba(20, 184, 166, 0.06)');
    atmosGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = atmosGrad;
    ctx.fillRect(0, 0, w, h);

    // Ocean sphere
    const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    oceanGrad.addColorStop(0, '#0c2d48');
    oceanGrad.addColorStop(0.5, '#0a1628');
    oceanGrad.addColorStop(1, '#050d18');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Grid lines (longitude/latitude) — very subtle
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
    ctx.lineWidth = 0.5;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 3) {
        const p = lonLatToSphere(lon, lat, radius, rotation);
        if (p.z > 0) continue; // back face
        const sx = cx + p.x;
        const sy = cy - p.y;
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = lonLatToSphere(lon, lat, radius, rotation);
        if (p.z > 0) continue;
        const sx = cx + p.x;
        const sy = cy - p.y;
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Continents
    for (const continent of CONTINENTS) {
      // Fill
      ctx.beginPath();
      let hasVisible = false;
      let started = false;

      for (let i = 0; i < continent.length; i++) {
        const [lon, lat] = continent[i];
        const p = lonLatToSphere(lon, lat, radius, rotation);
        if (p.z > 0) { started = false; continue; }
        hasVisible = true;
        const sx = cx + p.x;
        const sy = cy - p.y;
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }

      if (hasVisible) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Dotted mesh on continents for tech feel
      for (const [lon, lat] of continent) {
        // scatter dots near continent outline
        for (let d = 0; d < 3; d++) {
          const dLon = lon + (Math.random() - 0.5) * 15;
          const dLat = lat + (Math.random() - 0.5) * 10;
          const p = lonLatToSphere(dLon, dLat, radius, rotation);
          if (p.z > 0) continue;
          const sx = cx + p.x;
          const sy = cy - p.y;
          // distance from center for fade
          const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
          if (dist > radius) continue;
          const edgeFade = 1 - (dist / radius) ** 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20, 184, 166, ${0.15 * edgeFade})`;
          ctx.fill();
        }
      }
    }

    // City dots (key cities with glow)
    const cities = [
      { lon: 73.85, lat: 18.52, name: 'Pune' },
    ];

    for (const city of cities) {
      const p = lonLatToSphere(city.lon, city.lat, radius, rotation);
      if (p.z > 0) continue;
      const sx = cx + p.x;
      const sy = cy - p.y;
      const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
      if (dist > radius) continue;

      // Glow
      const cityGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
      cityGlow.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      cityGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cityGlow;
      ctx.fillRect(sx - 6, sy - 6, 12, 12);

      // Dot
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#14B8A6';
      ctx.fill();
    }

    // Edge rim light
    const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.02);
    rimGrad.addColorStop(0, 'transparent');
    rimGrad.addColorStop(0.7, 'rgba(20, 184, 166, 0.08)');
    rimGrad.addColorStop(1, 'rgba(20, 184, 166, 0.02)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Top specular highlight
    const specGrad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.35, 0, cx, cy, radius * 0.7);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    specGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ~75 seconds per rotation (360 / 75 = 4.8 degrees/sec)
    const ROTATION_SPEED = 360 / 75;

    let lastTime = performance.now();
    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isVisibleRef.current) {
        rotationRef.current = (rotationRef.current + ROTATION_SPEED * dt) % 360;
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        drawEarth(ctx, w, h, rotationRef.current);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [drawEarth]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
