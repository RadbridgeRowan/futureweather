/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Active Color Scheme: Deep Ocean Blue (Scientific & Trustworthy)
        'nav-bg': '#0B1F3F',
        'hero-bg': '#F8FAFB',
        'hero-heading': '#0B1F3F',
        'hero-text': '#4A5568',
        'btn-primary-bg': '#1E5A8E',
        'btn-primary-hover': '#164670',
        'btn-primary-text': '#FFFFFF',
        'btn-secondary-bg': '#FFFFFF',
        'btn-secondary-text': '#1E5A8E',
        'btn-secondary-border': '#1E5A8E',
        'btn-secondary-hover-bg': '#1E5A8E',
        'btn-secondary-hover-text': '#FFFFFF',
        'promo-icon': '#6B7280',
        'promo-text': '#6B7280',

        // Original colors from your config
        'sticky-nav-bg': '#F2F2EF',
        // Modern SaaS Scheme
        'saas-primary': '#1A202C',      // Sophisticated dark
        'saas-secondary': '#4299E1',     // Vibrant blue
        'saas-accent': '#EDF2F7',        // Light gray
        'saas-success': '#48BB78',        // Green
        
        // Legacy colors (keeping for compatibility)
        'radbridge-blue': '#1A202C',      // Updated to saas primary
        'radbridge-gold': '#D19B46',      // Secondary
        'light-gold': '#EAD6A8',
        'light-grey': '#F4F4F4',
        'dark-blue': '#062941',
        'black': '#0A0B0B',
      },
      fontFamily: {
        'open-sans': ['"Open Sans"', 'sans-serif'],
        ibm: ['IBM Plex Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['"Public Sans"', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        'source-sans': ['"Source Sans Pro"', 'Arial', 'sans-serif'],
        lato: ['Lato', 'Helvetica', 'sans-serif'],
        'work-sans': ['"Work Sans"', 'sans-serif'],
        futura: ['FuturaLT', 'sans-serif'],
        'futura-book': ['FuturaLT-Book', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        }
      }
    },
  },
  plugins: [],
}