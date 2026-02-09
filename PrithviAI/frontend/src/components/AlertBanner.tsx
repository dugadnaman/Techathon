'use client';

/**
 * PrithviAI — Alert Banner
 * Displays proactive health alerts with color-coded severity.
 */

import type { HealthAlert } from '@/types';
import { getRiskBgColor } from '@/lib/utils';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface AlertBannerProps {
  alerts: HealthAlert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`rounded-xl border p-4 flex items-start gap-3 ${getRiskBgColor(alert.severity)}`}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {alert.severity === 'HIGH' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : alert.severity === 'MODERATE' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Info className="w-5 h-5 text-green-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{alert.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
            <p className="text-sm font-medium text-gray-800 mt-2">
              → {alert.action}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
