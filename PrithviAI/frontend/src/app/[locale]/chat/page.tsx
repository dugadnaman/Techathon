'use client';

/**
 * Prithvi — AI Chat Page
 * Premium full-page chat interface with glass styling.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import type { Language, AgeGroup } from '@/types';
import { MapPin, UserCircle } from 'lucide-react';
import { t } from '@/lib/translations';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ChatPage() {
  const locale = useLocale();
  const language = locale as Language;
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elderly');
  const [city, setCity] = useState('Pune');

  return (
    <>
      <Navbar language={language} onLanguageChange={() => {}} />

      <main className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <div className="flex items-center gap-2 glass-card-solid rounded-2xl px-3 py-2">
            <MapPin size={14} className="text-accent" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm text-content-primary bg-transparent outline-none cursor-pointer"
            >
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          <div className="flex items-center gap-2 glass-card-solid rounded-2xl px-3 py-2">
            <UserCircle size={14} className="text-accent" />
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="text-sm text-content-primary bg-transparent outline-none cursor-pointer"
            >
              <option value="elderly">{t('seniorCitizen', language)}</option>
              <option value="adult">{t('adult', language)}</option>
            </select>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
        >
          <ChatInterface language={language} ageGroup={ageGroup} city={city} />
        </motion.div>
      </main>
    </>
  );
}
