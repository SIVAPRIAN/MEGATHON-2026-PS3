/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        console: {
          bg: '#0a0e17',          // Deep command-center navy
          surface: '#0f172a',     // Primary panel surface
          card: '#151f32',        // Elevated card background
          cardHover: '#1c2842',   // Interactive hover state
          border: '#1e293b',      // Restrained boundary border
          borderLight: '#334155', // Active/hover boundary border
          muted: '#64748b',       // Supporting metadata label
          secondary: '#94a3b8',   // Secondary readable text
          text: '#f1f5f9',        // Primary high-legibility text
          cyan: '#06b6d4',        // Subtle telemetry accent
          cyanMuted: '#0e7490',   // Muted cyan border/badge
          red: '#dc2626',         // Critical alert / dark vessel
          redMuted: '#7f1d1d',    // Red container border
          redBg: '#450a0a',       // Red container background
          amber: '#f59e0b',       // Warning / Cautionary
          amberMuted: '#78350f',  // Amber container border
          amberBg: '#451a03',     // Amber container background
          emerald: '#10b981',     // Normal / Online / Authorized
          emeraldMuted: '#064e3b',// Green container border
          emeraldBg: '#022c22',   // Green container background
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#041826',
        },
        slate: {
          850: '#131b2b',
          925: '#0b111e',
          950: '#070b14',
        },
        maritime: {
          darkRed: '#e11d48',
          darkRedBg: '#1c0a0e',
          blackTarget: '#0f172a',
          bathymetryShallow: '#bbf2f6',
          bathymetryDeep: '#1e3a8a',
          shelf: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'console': '0 4px 16px -2px rgba(0, 0, 0, 0.45), 0 2px 6px -1px rgba(0, 0, 0, 0.35)',
        'console-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.35)',
        'console-lg': '0 12px 28px -4px rgba(0, 0, 0, 0.65), 0 4px 12px -2px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
