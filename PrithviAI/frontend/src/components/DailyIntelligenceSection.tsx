'use client';

/**
 * Prithvi — Daily Intelligence Section
 * Predictive intelligence panel:
 * 1. Best Time to Go Outside
 * 2. Primary Concern of the Day
 */

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Sun, Shield, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { RevealSection, StaggerContainer, StaggerItem } from '@/components/motion';
import type { ForecastPoint, SafetyIndex, RiskLevel, Language } from '@/types';
import { t, tFormat, tRisk } from '@/lib/translations';
import { formatLocalizedNumber, formatTime } from '@/lib/utils';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface DailyIntelligenceSectionProps {
  forecastPoints: ForecastPoint[];
  safetyIndex: SafetyIndex | null;
  previousScore?: number | null;
}

// ─── Helpers ────────────────────────────────────────────

function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return 'bg-risk-low';
    case 'MODERATE': return 'bg-risk-moderate';
    case 'HIGH': return 'bg-risk-high';
    default: return 'bg-surface-secondary';
  }
}

function riskText(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return 'text-risk-low';
    case 'MODERATE': return 'text-risk-moderate';
    case 'HIGH': return 'text-risk-high';
    default: return 'text-content-secondary';
  }
}

interface BestWindow {
  found: boolean;
  timeRange: string;
  level: RiskLevel;
  advisory: string;
}

function computeBestWindow(points: ForecastPoint[], language: Language): BestWindow {
  // Find longest consecutive LOW window during 5am-9pm
  const daytime = [...points]
    .map((point) => ({ point, date: new Date(point.time) }))
    .filter(({ date }) => {
      const hour = date.getHours();
      return hour >= 5 && hour <= 21;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (daytime.length === 0) {
    return { found: false, timeRange: '', level: 'HIGH', advisory: t('daily.noForecastData', language) };
  }

  function findBestRun(
    predicate: (level: RiskLevel) => boolean,
  ): { start: number; len: number } {
    let bestStart = -1;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;

    for (let i = 0; i < daytime.length; i++) {
      const qualifies = predicate(daytime[i].point.predicted_level);

      const prev = i > 0 ? daytime[i - 1].date.getTime() : null;
      const now = daytime[i].date.getTime();
      const gapMs = prev == null ? 0 : now - prev;
      const isConsecutiveHour = prev == null ? false : gapMs > 0 && gapMs <= 90 * 60 * 1000;

      if (qualifies) {
        if (curStart === -1 || !isConsecutiveHour) {
          curStart = i;
          curLen = 1;
        } else {
          curLen += 1;
        }
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
        }
      } else {
        curStart = -1;
        curLen = 0;
      }
    }

    return { start: bestStart, len: bestLen };
  }

  const lowRun = findBestRun((level) => level === 'LOW');
  const fallbackRun = lowRun.len > 0 ? lowRun : findBestRun((level) => level !== 'HIGH');
  const bestStart = fallbackRun.start;
  const bestLen = fallbackRun.len;

  if (bestLen === 0 || bestStart === -1) {
    return {
      found: false,
      timeRange: '',
      level: 'HIGH',
      advisory: t('daily.limitOutdoorExposure', language),
    };
  }

  const startTime = new Date(daytime[bestStart].date);
  const endTime = new Date(daytime[Math.min(bestStart + bestLen - 1, daytime.length - 1)].date);
  endTime.setHours(endTime.getHours() + 1);

  const fmt = (d: Date) => formatTime(d.toISOString(), language);
  const windowLevel = daytime[bestStart].point.predicted_level;

  return {
    found: true,
    timeRange: `${fmt(startTime)} – ${fmt(endTime)}`,
    level: windowLevel,
    advisory:
      windowLevel === 'LOW'
        ? t('daily.lowRiskExpected', language)
        : t('daily.moderatePrecautions', language),
  };
}

interface PrimaryConcern {
  factor: string;
  icon: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  explanation: string;
}

function computePrimaryConcern(
  safetyIndex: SafetyIndex | null,
  previousScore?: number | null,
): PrimaryConcern | null {
  if (!safetyIndex || safetyIndex.all_risks.length === 0) return null;

  const sorted = [...safetyIndex.all_risks].sort((a, b) => b.score - a.score);
  const top = sorted[0];

  // Simulate trend from previous score if available
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercent = 0;
  if (previousScore != null && previousScore > 0) {
    const diff = ((safetyIndex.overall_score - previousScore) / previousScore) * 100;
    trendPercent = Math.abs(Math.round(diff));
    trend = diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable';
  } else {
    // Derive from score severity
    if (top.score > 70) {
      trend = 'up';
      trendPercent = Math.round((top.score - 50) / 50 * 20);
    } else if (top.score < 30) {
      trend = 'down';
      trendPercent = Math.round((50 - top.score) / 50 * 15);
    }
  }

  return {
    factor: top.name,
    icon: top.icon || '📊',
    score: Math.round(top.score),
    trend,
    trendPercent,
    explanation: top.reason,
  };
}

// ─── Sub-components ──────────────────────────────────────

function BestTimeAdvisory({ window, language }: { window: BestWindow; language: Language }) {
  return (
    <div className="glass-card-solid rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sun size={16} className="text-accent" />
          <h3 className="text-sm font-bold text-content-primary tracking-tight">{t('daily.bestTimeOutside', language)}</h3>
        </div>

        {window.found ? (
          <>
            <p className="text-xs text-content-secondary mb-2">{t('daily.recommendedForSeniors', language)}</p>
            <div className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] mb-3">
              <span className="text-xl font-extrabold tracking-tight text-content-primary">
                {window.timeRange}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full ${riskColor(window.level)}`} />
              <span className={`text-xs font-bold ${riskText(window.level)}`}>
                {tFormat('daily.riskWithLevel', { level: tRisk(window.level, language) }, language)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} className="text-risk-high mt-0.5 flex-shrink-0" />
            <p className="text-sm font-semibold text-risk-high">
              {t('daily.noLowRiskWindow', language)}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-content-secondary leading-relaxed">{window.advisory}</p>
    </div>
  );
}

function PrimaryConcernCard({ concern, language }: { concern: PrimaryConcern; language: Language }) {
  const TrendIcon = concern.trend === 'up' ? TrendingUp : concern.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    concern.trend === 'up' ? 'text-risk-high' : concern.trend === 'down' ? 'text-risk-low' : 'text-content-secondary';
  const trendLabel =
    concern.trend === 'up' ? t('daily.increased', language) : concern.trend === 'down' ? t('daily.decreased', language) : t('daily.stable', language);

  return (
    <div className="glass-card-solid rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-accent" />
          <h3 className="text-sm font-bold text-content-primary tracking-tight">{t('daily.primaryConcernToday', language)}</h3>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{concern.icon}</span>
          <div>
            <div className="text-base font-extrabold text-content-primary tracking-tight">{concern.factor}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <TrendIcon size={13} className={trendColor} />
              <span className={`text-xs font-bold ${trendColor}`}>
                {trendLabel}
                {concern.trendPercent > 0 ? ` ${formatLocalizedNumber(concern.trendPercent, language, { maximumFractionDigits: 0 })}${t('units.percent', language)}` : ''}
              </span>
              <span className="text-xs text-content-secondary">{t('daily.vsYesterday', language)}</span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] mb-3">
          <span className="text-2xl font-extrabold tracking-tighter text-content-primary">{concern.score}</span>
          <span className="text-xs font-semibold text-content-secondary">/100</span>
        </div>
      </div>

      <p className="text-xs text-content-secondary leading-relaxed line-clamp-3">{concern.explanation}</p>
    </div>
  );
}

// ─── Main Section ────────────────────────────────────────

export default function DailyIntelligenceSection({
  forecastPoints,
  safetyIndex,
  previousScore,
}: DailyIntelligenceSectionProps) {
  const locale = useLocale() as Language;
  const bestWindow = useMemo(() => computeBestWindow(forecastPoints, locale), [forecastPoints, locale]);
  const primaryConcern = useMemo(() => computePrimaryConcern(safetyIndex, previousScore), [safetyIndex, previousScore]);

  if (forecastPoints.length === 0 && !safetyIndex) return null;

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <RevealSection>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded-full bg-accent" />
          <h2 className="text-lg font-bold text-content-primary tracking-tight">{t('daily.intelligenceTitle', locale)}</h2>
        </div>
      </RevealSection>

      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StaggerItem>
          <BestTimeAdvisory window={bestWindow} language={locale} />
        </StaggerItem>

        <StaggerItem>
          {primaryConcern ? (
            <PrimaryConcernCard concern={primaryConcern} language={locale} />
          ) : (
            <div className="glass-card-solid rounded-2xl p-5 flex items-center justify-center h-full">
              <p className="text-sm text-content-secondary">{t('daily.analysisLoading', locale)}</p>
            </div>
          )}
        </StaggerItem>

        {/* Quick advisory card */}
        <StaggerItem>
          <div className="glass-card-solid rounded-2xl p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-accent" />
                <h3 className="text-sm font-bold text-content-primary tracking-tight">{t('daily.quickAdvisory', locale)}</h3>
              </div>
              {safetyIndex ? (
                <ul className="space-y-2">
                  {safetyIndex.recommendations.slice(0, 3).map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08, ease: EASE_OUT }}
                      className="flex items-start gap-2 text-xs text-content-secondary leading-relaxed"
                    >
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>{rec}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-content-secondary">{t('daily.loadingRecommendations', locale)}</p>
              )}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
