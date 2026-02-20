'use client';

/**
 * PrithviAI — Cinematic Navbar V2
 * Clean white typography on dark hero, with teal accent button.
 */

import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const NAV_LINKS = [
  { href: '/' as const, label: 'Home' },
  { href: '/explore' as const, label: 'Map' },
  { href: '/chat' as const, label: 'Voice' },
  { href: '/dashboard' as const, label: 'Dashboard' },
];

export default function NavbarV2() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="relative w-full"
      style={{ zIndex: 4, height: 102 }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full"
        style={{ maxWidth: 1440, paddingLeft: 120, paddingRight: 120, paddingTop: 16, paddingBottom: 16 }}
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
              className="text-white/80 hover:text-white transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 500 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/explore"
            className="px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90"
            style={{
              background: '#14B8A6',
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)',
            }}
          >
            Explore Map
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-b border-white/10"
            style={{ background: 'rgba(0,0,0,0.9)', zIndex: 50 }}
          >
            <div className="px-6 py-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-white/80 hover:text-white py-2 text-sm"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <Link
                  href="/explore"
                  className="px-4 py-2 text-white text-sm font-medium rounded-lg"
                  style={{ background: '#14B8A6' }}
                >
                  Explore Map
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
