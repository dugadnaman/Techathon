'use client';

/**
 * Prithvi — Premium Navigation Bar
 * Glassmorphic top nav with smooth animations and theme toggle.
 */

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Map, MessageCircle, BarChart3 } from 'lucide-react';
import type { Language } from '@/types';
import { getLanguageName } from '@/lib/utils';
import { t } from '@/lib/translations';
import ThemeToggle from '@/components/ThemeToggle';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ language, onLanguageChange }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: '/', icon: <Home size={16} />, label: t('navHome', language) },
    { href: '/explore', icon: <Map size={16} />, label: t('navMapExplorer', language) },
    { href: '/chat', icon: <MessageCircle size={16} />, label: t('navAIChat', language) },
    { href: '/dashboard', icon: <BarChart3 size={16} />, label: t('navDashboard', language) },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-glow-green transition-transform group-hover:scale-110">
              <span className="text-white text-base">🌍</span>
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight">
              Prithvi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm text-content-secondary
                  hover:text-accent hover:bg-accent/5 rounded-xl transition-all duration-200"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side: Language + Theme + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-0.5 bg-surface-secondary rounded-xl p-1">
              {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                    language === lang
                      ? 'bg-surface-card text-accent shadow-sm font-semibold'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {getLanguageName(lang)}
                </button>
              ))}
            </div>

            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-surface-secondary text-content-secondary"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden glass-card border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-content-primary
                    hover:bg-accent/5 rounded-xl transition-colors"
                >
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              {/* Mobile Language Switcher */}
              <div className="flex items-center gap-1 pt-2 px-4">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      language === lang
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-content-secondary'
                    }`}
                  >
                    {getLanguageName(lang)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

