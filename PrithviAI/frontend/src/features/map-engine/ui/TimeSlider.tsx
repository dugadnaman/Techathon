'use client';

import { useEffect, useState } from 'react';
import { useMapContext } from '@/features/map-engine/context/MapContext';

function hourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const twelveHour = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${twelveHour}:00 ${suffix}`;
}

export function TimeSlider() {
  const { selectedTimeIndex, setSelectedTimeIndex } = useMapContext();
  const [localIndex, setLocalIndex] = useState(selectedTimeIndex);

  useEffect(() => {
    setLocalIndex(selectedTimeIndex);
  }, [selectedTimeIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedTimeIndex(localIndex);
    }, 120);
    return () => clearTimeout(timer);
  }, [localIndex, setSelectedTimeIndex]);

  return (
    <div className="glass-card-solid rounded-2xl border border-surface-secondary p-3">
      <div className="flex items-center justify-between text-xs text-content-secondary mb-2">
        <span>24h Playback</span>
        <span className="font-semibold text-content-primary">{hourLabel(localIndex)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={24}
        value={localIndex}
        onChange={(e) => setLocalIndex(Number(e.target.value))}
        className="w-full accent-accent"
        aria-label="24 hour playback slider"
      />
      <div className="mt-1 flex items-center justify-between text-[10px] text-content-secondary">
        <span>0h</span>
        <span>12h</span>
        <span>24h</span>
      </div>
    </div>
  );
}
