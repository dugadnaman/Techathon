'use client';

import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/routing';
import type { Language } from '@/types';

export default function ChatPage() {
  const language = useLocale() as Language;

  return (
    <div className="min-h-screen bg-surface-primary">
      <Navbar language={language} onLanguageChange={() => {}} />

      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="glass-card-solid rounded-2xl border border-surface-secondary p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">AI Advisory</h1>
          <p className="mt-3 text-content-secondary">
            AI chat is not included in this Round 1 MVP (frontend-only scope).
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
