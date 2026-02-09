/**
 * PrithviAI — Utility Functions
 */

import type { RiskLevel } from '@/types';

/** Get color class for risk level */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return 'text-green-600';
    case 'MODERATE': return 'text-amber-500';
    case 'HIGH': return 'text-red-600';
    default: return 'text-gray-500';
  }
}

/** Get background color class for risk level */
export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return 'bg-green-50 border-green-200';
    case 'MODERATE': return 'bg-amber-50 border-amber-200';
    case 'HIGH': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

/** Get solid background for badges */
export function getRiskBadgeBg(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return 'bg-green-500';
    case 'MODERATE': return 'bg-amber-500';
    case 'HIGH': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

/** Get hex color for charts */
export function getRiskHexColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return '#22c55e';
    case 'MODERATE': return '#f59e0b';
    case 'HIGH': return '#ef4444';
    default: return '#6b7280';
  }
}

/** Get emoji icon for risk level */
export function getRiskEmoji(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return '✅';
    case 'MODERATE': return '⚠️';
    case 'HIGH': return '🔴';
    default: return 'ℹ️';
  }
}

/** Format score with color indicator */
export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/** Format timestamp to human-readable */
export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format date to human-readable */
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Language display names */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी',
    mr: 'मराठी',
  };
  return names[code] || code;
}

/** Score to ring color for circular gauge */
export function getScoreRingColor(score: number): string {
  if (score < 30) return '#22c55e';
  if (score < 60) return '#f59e0b';
  return '#ef4444';
}
