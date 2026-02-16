'use client';

/**
 * Prithvi — Alert Banner
 * Animated severity-colored alert cards.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { HealthAlert } from '@/types';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface AlertBannerProps {
  alerts: HealthAlert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map((alert, idx) => {
          const severityClass = alert.severity === 'HIGH'
            ? 'bg-risk-high/8 border-risk-high/20'
            : alert.severity === 'MODERATE'
            ? 'bg-risk-moderate/8 border-risk-moderate/20'
            : 'bg-risk-low/8 border-risk-low/20';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${severityClass}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {alert.severity === 'HIGH' ? (
                  <XCircle className="w-5 h-5 text-risk-high" />
                ) : alert.severity === 'MODERATE' ? (
                  <AlertTriangle className="w-5 h-5 text-risk-moderate" />
                ) : (
                  <Info className="w-5 h-5 text-risk-low" />
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-content-primary text-sm">{alert.title}</h4>
                <p className="text-sm text-content-secondary mt-1">{alert.message}</p>
                <p className="text-sm font-medium text-accent mt-2">→ {alert.action}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
