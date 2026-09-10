/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Jersey / scoreboard lettering — the masthead wordmark, plate names,
        // section headers, and every control label. Body copy stays on the
        // system stack (below) for instant first paint on a phone.
        display: [
          '"Barlow Condensed"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // The board itself: warm near-black enamel.
        board: {
          DEFAULT: '#161513',
          edge: '#0d0c0b',
          rail: '#2b2926',
        },
        // Indiana Tech warrior orange — the program's driving hue. The masthead
        // rule, the add-a-name action, the active section.
        orange: {
          DEFAULT: '#E4571C',
          bright: '#F26B2E',
          deep: '#B23E12',
          // Small text on the near-black board ground needs to clear 4.5:1;
          // the base orange only reaches ~4:1 at caption size.
          onboard: '#FB8B57',
        },
        // Name-plate stock.
        bone: {
          DEFAULT: '#F3ECDD',
          bright: '#FBF7EE',
          aged: '#E7DCC4',
        },
        // Plate ink.
        ink: {
          DEFAULT: '#211E1A',
          soft: '#4A443B',
          faint: '#6B6253',
        },
        // Chalk on the board — section headers, the identity line, counts.
        chalk: {
          DEFAULT: '#E9E2D2',
          dim: '#A69C88',
        },
        // SigEp "conference" vocabulary. Crest, ritual chrome, the pledged
        // celebration only — never pipeline status.
        sigep: {
          red: '#6E1327',
          purple: '#3B1F4A',
          gold: '#C6A24A',
        },
        // One fixed hue per pipeline stage. The status tape and nothing else.
        stage: {
          identified: '#8A8079',
          contacted: '#2563A8',
          building: '#4B3E9E',
          bid: '#B0741A',
          pledged: '#2F7D4F',
          dropped: '#9A3324',
        },
        feedback: {
          error: '#C0392B',
          success: '#2F7D4F',
          warning: '#B0741A',
        },
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '3px',
        xl: '3px',
        full: '9999px',
      },
      boxShadow: {
        // A real name plate lifted off the board — offset and blur, not a halo.
        plate: '0 1px 2px rgba(0,0,0,0.28), 0 8px 18px -6px rgba(0,0,0,0.5)',
        'plate-flat': '0 1px 2px rgba(0,0,0,0.35)',
        tape: '0 1px 1px rgba(0,0,0,0.3)',
        stamp: 'none',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};
