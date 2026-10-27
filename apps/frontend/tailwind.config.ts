/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // HSL variable bridges (globals.css :root) kept for existing call-sites.
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Brand. 600 is the anchor; primary-container is the hover fill from the
        // design contract (docs/plans/ui-redesign-design-contract.md §2.1).
        primary: {
          DEFAULT: '#006194',
          container: '#007BB9',
          50: '#EAF4FB',
          100: '#CFE7F7',
          200: '#A6D3EF',
          300: '#6FB9E4',
          400: '#349CD6',
          500: '#0D7FBE',
          600: '#006194',
          700: '#004E77',
          800: '#003D5E',
          900: '#002D46',
          950: '#001D2E',
        },
        secondary: {
          DEFAULT: '#565E74',
          50: '#F3F5FA',
          100: '#E6EAF3',
          200: '#CBD3E3',
          300: '#A7B2CA',
          400: '#7C8AA8',
          500: '#5F6C87',
          600: '#565E74',
          700: '#454C5E',
          800: '#363C4A',
          900: '#282D38',
          950: '#1A1E26',
        },
        success: {
          DEFAULT: '#16A34A',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        danger: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },

        // Semantic surfaces (docs/DESIGN_SYSTEM.md §1).
        surface: {
          DEFAULT: '#F7F9FF',
          low: '#F1F4FA',
          container: '#EBEEF4',
          high: '#E5E8EE',
          highest: '#DFE3E8',
        },
        card: '#FFFFFF',
        'on-surface': {
          DEFAULT: '#181C20',
          variant: '#3F4850',
        },
        outline: {
          DEFAULT: '#707881',
          variant: '#BFC7D2',
        },
        emergency: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        tertiary: {
          DEFAULT: '#894D00',
          fixed: '#FFDCC0',
          'on-fixed': '#2D1600',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        h2: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        h3: ['1.375rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        // Deprecated alias: the design contract caps radius at 0.75rem.
        '2xl': '0.75rem',
        full: '9999px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
