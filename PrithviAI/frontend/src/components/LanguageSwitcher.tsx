'use client';

/**
 * PrithviAI — Language Switcher
 * Dropdown-based locale selector with script-grouped languages.
 * Updates next-intl route and persists choice in localStorage.
 */

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { getLanguageName } from '@/lib/utils';

const LANGUAGE_GROUPS = [
  {
    label: 'Popular',
    codes: ['en', 'hi', 'mr', 'bn', 'ta', 'te'],
  },
  {
    label: 'South Indian',
    codes: ['kn', 'ml'],
  },
  {
    label: 'West & North',
    codes: ['gu', 'pa', 'ur', 'doi'],
  },
  {
    label: 'East & North-East',
    codes: ['or', 'as', 'mni', 'brx', 'sat', 'mai'],
  },
  {
    label: 'Classical',
    codes: ['sa', 'gom', 'ne'],
  },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchLocale(code: string) {
    localStorage.setItem('NEXT_LOCALE', code);
    router.replace(pathname, { locale: code as any });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl
          bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10
          text-content-primary transition-all duration-200"
        aria-label="Select language"
      >
        <Globe size={14} />
        <span className="hidden sm:inline">{getLanguageName(locale)}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto
            bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200
            dark:border-gray-700 z-50 py-2"
        >
          {LANGUAGE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                {group.label}
              </p>
              {group.codes.map((code) => (
                <button
                  key={code}
                  onClick={() => switchLocale(code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                    ${
                      code === locale
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <span>{getLanguageName(code)}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{code}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
