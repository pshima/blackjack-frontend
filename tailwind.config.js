/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Casino/Card game specific colors
        casino: {
          felt: '#0f5132',      // Dark green felt table
          feltLight: '#198754', // Lighter felt accent
          gold: '#ffd700',      // Casino gold accents
          silver: '#c0c0c0',    // Silver chip highlights
          red: '#dc2626',       // Casino red
          black: '#1f2937',     // Deep black
          cream: '#fef7cd',     // Card background
        },
        card: {
          red: '#dc2626',       // Red suits (hearts, diamonds)
          black: '#1f2937',     // Black suits (spades, clubs)
          back: '#1e40af',      // Card back blue
          border: '#d1d5db',    // Card border
          shadow: '#6b7280',    // Card shadow
        },
        chip: {
          white: '#ffffff',     // $1 chips
          red: '#ef4444',       // $5 chips
          green: '#22c55e',     // $25 chips
          black: '#1f2937',     // $100 chips
          purple: '#8b5cf6',    // $500 chips
          orange: '#f97316',    // $1000 chips
        }
      },
      fontFamily: {
        'casino': ['Georgia', 'Times New Roman', 'serif'],
        'card': ['Monaco', 'Menlo', 'monospace'],
      },
      animation: {
        'card-deal': 'cardDeal 0.5s ease-out',
        'card-flip': 'cardFlip 0.3s ease-in-out',
        'chip-stack': 'chipStack 0.2s ease-out',
        'shuffle': 'shuffle 1s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        cardDeal: {
          '0%': { 
            transform: 'translateX(-100px) translateY(-50px) rotate(-45deg) scale(0.8)', 
            opacity: '0' 
          },
          '70%': { 
            transform: 'translateX(5px) translateY(2px) rotate(2deg) scale(1.05)', 
            opacity: '0.9' 
          },
          '100%': { 
            transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)', 
            opacity: '1' 
          },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        chipStack: {
          '0%': { transform: 'translateY(10px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        shuffle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px) rotate(-1deg)' },
          '75%': { transform: 'translateX(2px) rotate(1deg)' },
        },
        bounceGentle: {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '50%': { 
            transform: 'translateY(-5px)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
          },
        },
      },
      spacing: {
        'card': '3.5rem',      // Standard card width
        'card-lg': '5rem',     // Large card width
        'card-sm': '2.5rem',   // Small card width
        'chip': '2rem',        // Standard chip size
        'table-padding': '1.5rem', // Table edge padding
      },
      borderRadius: {
        'card': '0.5rem',      // Card corner radius
        'chip': '50%',         // Chip circular radius
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'chip': '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'table': 'inset 0 0 20px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      scale: {
        '102': '1.02',
      }
    },
  },
  plugins: [],
}