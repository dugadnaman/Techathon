'use client';

/**
 * PrithviAI — Navigation Bar
 */

import Link from 'next/link';
import { useState } from 'react';
import { Globe, Menu, X, Shield, MessageCircle, BarChart3, Home, Map } from 'lucide-react';
import type { Language } from '@/types';
import { getLanguageName } from '@/lib/utils';
import { t } from '@/lib/translations';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ language, onLanguageChange }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🌍</span>
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">Prithvi</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" icon={<Home size={18} />} label={t('navHome', language)} />
            <NavLink href="/explore" icon={<Map size={18} />} label={t('navMapExplorer', language)} />
            <NavLink href="/chat" icon={<MessageCircle size={18} />} label={t('navAIChat', language)} />
            <NavLink href="/dashboard" icon={<BarChart3 size={18} />} label={t('navDashboard', language)} />
          </div>

          {/* Right side: Language selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    language === lang
                      ? 'bg-white text-green-700 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getLanguageName(lang)}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <MobileNavLink href="/" icon={<Home size={18} />} label={t('navHome', language)} onClick={() => setIsMenuOpen(false)} />
          <MobileNavLink href="/explore" icon={<Map size={18} />} label={t('navMapExplorer', language)} onClick={() => setIsMenuOpen(false)} />
          <MobileNavLink href="/chat" icon={<MessageCircle size={18} />} label={t('navAIChat', language)} onClick={() => setIsMenuOpen(false)} />
          <MobileNavLink href="/dashboard" icon={<BarChart3 size={18} />} label={t('navDashboard', language)} onClick={() => setIsMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
