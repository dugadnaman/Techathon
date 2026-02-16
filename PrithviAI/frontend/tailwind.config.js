/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--card-bg)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          dark: 'var(--accent-dark)',
        },
        risk: {
          low: '#22c55e',
          moderate: '#f59e0b',
          high: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero-xl': ['4.5rem', { lineHeight: '1.05', fontWeight: '700' }],
        'hero-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'section': ['3rem', { lineHeight: '1.15', fontWeight: '600' }],
        'subheading': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'label': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        'micro': ['0.75rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 0 40px rgba(20, 184, 166, 0.15)',
        'glow-green-dark': '0 0 40px rgba(20, 184, 166, 0.3)',
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.2)',
        'glow-amber': '0 0 30px rgba(245, 158, 11, 0.2)',
        'elevated': '0 12px 40px -12px rgba(0, 0, 0, 0.12)',
        'elevated-dark': '0 12px 40px -12px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
