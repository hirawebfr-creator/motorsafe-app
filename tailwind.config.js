/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        DEFAULT: '1rem',
        sm: '0.75rem',
        lg: '1.25rem',
        xl: '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px rgba(0,0,0,0.45)',
        soft: '0 6px 24px rgba(0,0,0,0.25)',
        focus: '0 0 0 2px #8B5CF6, 0 0 8px #8B5CF6',
      },
    },
  },
  plugins: [],
}

