import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Obedio brend plava boja
          50: '#ebf8ff',
          100: '#d1edfb',
          200: '#a7ddf7',
          300: '#7dcbf2',
          400: '#54b9ee',
          500: '#2b97e9',  // Osnovna Obedio plava (WCAG AA za male tekstove na beloj pozadini)
          600: '#1a7bc6',  // Dublja plava (WCAG AAA za male tekstove na beloj pozadini)
          700: '#1564a3',
          800: '#114f81',
          900: '#0e4269'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          // Obedio brend zelena boja
          50: '#edf9ee',
          100: '#d1f0d4',
          200: '#a4e1aa',
          300: '#76d280',
          400: '#49c356',  // Svetlija Obedio zelena
          500: '#2aa836',  // Osnovna Obedio zelena (WCAG AA za male tekstove na beloj pozadini)
          600: '#1e8c29',  // Dublja zelena (WCAG AAA na beloj pozadini)
          700: '#18702a',
          800: '#145723',
          900: '#0f461c'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          // Obedio crvena za greške i upozorenja
          50: '#fdecec',
          100: '#fbd5d5',
          200: '#f5abab',
          300: '#ef8080',
          400: '#e95656',  // Svetlija Obedio crvena
          500: '#e42c2c',  // Osnovna Obedio crvena (WCAG AA za male tekstove na beloj pozadini)
          600: '#c01e1e',  // Dublja crvena (WCAG AAA na beloj pozadini)
          700: '#9c1717',
          800: '#781313',
          900: '#621010'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // Neutralne boje za Obedio interfejs
        obedio: {
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',  // WCAG AA za male tekstove na beloj pozadini
            600: '#475569',  // WCAG AAA za male tekstove na beloj pozadini
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
          },
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom brand colors
        'luxury-gold': '#d4af37',
        'deep-navy': '#0a192f',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
