'use client';

/**
 * PrithviAI — AI Chat Page
 * Full-page chat interface for natural language environmental queries.
 */

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import type { Language, AgeGroup } from '@/types';
import { MapPin, UserCircle } from 'lucide-react';
import { t } from '@/lib/translations';

export default function ChatPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elderly');
  const [city, setCity] = useState('Pune');

  return (
    <>
      <Navbar language={language} onLanguageChange={setLanguage} />

      <main className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-gray-200 shadow-sm">
            <MapPin size={14} className="text-green-600" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-gray-200 shadow-sm">
            <UserCircle size={14} className="text-green-600" />
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="elderly">{t('seniorCitizen', language)}</option>
              <option value="adult">{t('adult', language)}</option>
            </select>
          </div>
        </div>

        {/* Chat Interface */}
        <ChatInterface language={language} ageGroup={ageGroup} city={city} />
      </main>
    </>
  );
}
