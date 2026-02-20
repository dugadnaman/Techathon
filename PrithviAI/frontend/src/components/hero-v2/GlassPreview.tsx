'use client';

/**
 * PrithviAI — Glass Dashboard Preview
 * Frosted glass container showing a dashboard preview screenshot.
 */

import { motion } from 'framer-motion';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function GlassPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
      className="w-full flex justify-center"
      style={{ marginTop: 80, paddingBottom: 40, zIndex: 5, position: 'relative' }}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 1163,
          width: '90vw',
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          padding: 24,
        }}
      >
        {/* Dashboard Content Preview */}
        <div
          className="w-full overflow-hidden"
          style={{ borderRadius: 8 }}
        >
          {/* Simulated Dashboard Header */}
          <div className="flex items-center justify-between p-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🌍</span>
              <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Prithvi Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-md text-xs text-white/60"
                style={{ background: 'rgba(255,255,255,0.06)', fontFamily: "'Manrope', sans-serif" }}
              >
                🔍 Search environment data...
              </div>
              <div className="w-7 h-7 rounded-full" style={{ background: 'rgba(20,184,166,0.3)' }} />
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="flex" style={{ minHeight: 280 }}>
            {/* Sidebar */}
            <div className="hidden sm:block p-4 space-y-3" style={{ width: 180, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {['Overview', 'Air Quality', 'Weather', 'Noise', 'Alerts'].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: i === 0 ? '#14B8A6' : 'rgba(255,255,255,0.5)',
                    background: i === 0 ? 'rgba(20,184,166,0.1)' : 'transparent',
                  }}
                >
                  <span>{['📊', '💨', '🌤️', '🔊', '⚠️'][i]}</span>
                  {item}
                </div>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'AQI', value: '142', color: '#F59E0B', icon: '💨' },
                  { label: 'Temperature', value: '31°C', color: '#EF4444', icon: '🌡️' },
                  { label: 'Humidity', value: '62%', color: '#3B82F6', icon: '💧' },
                  { label: 'Safety Score', value: '72', color: '#22C55E', icon: '🛡️' },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">{metric.icon}</span>
                      <span className="text-[10px] text-white/50" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        {metric.label}
                      </span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: metric.color, fontFamily: 'Inter, sans-serif' }}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/60" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    24-Hour Risk Timeline
                  </span>
                  <span className="text-[10px] text-white/40">Live</span>
                </div>
                {/* Simulated chart bars */}
                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
                    const isHighlight = i >= 6 && i <= 10;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: isHighlight
                            ? 'rgba(20, 184, 166, 0.5)'
                            : 'rgba(255, 255, 255, 0.08)',
                          minWidth: 2,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-white/30">12 AM</span>
                  <span className="text-[9px] text-white/30">6 AM</span>
                  <span className="text-[9px] text-white/30">12 PM</span>
                  <span className="text-[9px] text-white/30">6 PM</span>
                  <span className="text-[9px] text-white/30">Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
