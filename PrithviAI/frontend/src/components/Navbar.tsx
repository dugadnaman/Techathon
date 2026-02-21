'use client';

/**
 * Prithvi — Premium Navigation Bar
 * Glassmorphic top nav with smooth animations and theme toggle.
 */

import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart3 } from 'lucide-react';
import type { Language } from '@/types';
import { t } from '@/lib/translations';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ language, onLanguageChange }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: '/' as const, icon: <Home size={16} />, label: t('navHome', language) },
    { href: '/dashboard' as const, icon: <BarChart3 size={16} />, label: t('navDashboard', language) },
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
                  rounded-xl transition-all duration-200"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side: Language + Theme + Mobile Menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] rounded-xl text-content-secondary inline-flex items-center justify-center"
              aria-label={isMenuOpen ? t('common.closeMenu', language) : t('common.openMenu', language)}
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
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-0 glass-card border-t border-white/5 overflow-hidden"
            style={{ zIndex: 60 }}
          >
            <div className="px-5 py-4 h-full overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-content-primary font-medium">{t('language.switcher', language)}</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-content-secondary inline-flex items-center justify-center"
                  aria-label={t('common.closeMenu', language)}
                >
                  <X size={20} />
                </button>
              </div>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 min-h-[44px] text-content-primary rounded-xl transition-colors"
                >
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <div className="pt-4 mt-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

