'use client';

/**
 * PrithviAI — Cinematic Navbar V2
 * Clean white typography on dark hero, with teal accent button.
 */

import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { t } from '@/lib/translations';
import type { Language } from '@/types';

export default function NavbarV2() {
  const locale = useLocale() as Language;
  const [mobileOpen, setMobileOpen] = useState(false);
  const NAV_LINKS = [
    { href: '/' as const, label: t('navbar.home', locale) },
    { href: '/explore' as const, label: t('navbar.map', locale) },
    { href: '/chat' as const, label: t('navbar.voice', locale) },
    { href: '/dashboard' as const, label: t('navbar.dashboard', locale) },
  ];

  return (
    <nav
      className="relative w-full"
      style={{ zIndex: 8, height: 86 }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-4 sm:px-8 lg:px-20"
        style={{ maxWidth: 1440, paddingTop: 12, paddingBottom: 12 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🌍</span>
          <span
            className="text-white font-semibold tracking-tight"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 22 }}
          >
            Prithvi
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center" style={{ gap: 24 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/80 transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 500 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/explore"
            className="px-5 min-h-[44px] py-2.5 text-white text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              background: '#14B8A6',
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)',
            }}
          >
            {t('navbar.exploreMap', locale)}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('common.closeMenu', locale) : t('common.openMenu', locale)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.24 }}
            className="md:hidden fixed inset-0 backdrop-blur-xl"
            style={{ background: 'rgba(3,8,18,0.96)', zIndex: 60 }}
          >
            <div className="px-5 py-5 h-full overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/90 text-sm font-semibold">{t('common.appName', locale)}</span>
                <button
                  className="text-white p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('common.closeMenu', locale)}
                >
                  <X size={22} />
                </button>
              </div>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-white/90 py-3 px-1 text-base min-h-[44px]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-5 mt-auto space-y-3">
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                </div>
                <Link
                  href="/explore"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 min-h-[44px] py-2 text-white text-sm font-medium rounded-lg inline-flex items-center justify-center"
                  style={{ background: '#14B8A6' }}
                >
                  {t('navbar.exploreMap', locale)}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
