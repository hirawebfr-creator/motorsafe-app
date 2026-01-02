/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: ({ opacityValue }) => `rgb(var(--bg) / ${opacityValue ?? 1})`,
        surface: ({ opacityValue }) => `rgb(var(--surface) / ${opacityValue ?? 1})`,
        surface2: ({ opacityValue }) => `rgb(var(--surface2) / ${opacityValue ?? 1})`,

        text: ({ opacityValue }) => `rgb(var(--text) / ${opacityValue ?? 'var(--textA)'})`,
        muted: ({ opacityValue }) => `rgb(var(--muted) / ${opacityValue ?? 'var(--textSecondaryA)'})`,
        muted2: ({ opacityValue }) => `rgb(var(--muted2) / ${opacityValue ?? 'var(--textMutedA)'})`,
        border: ({ opacityValue }) => `rgb(var(--border) / ${opacityValue ?? 'var(--borderA)'})`,

        primary: ({ opacityValue }) => `rgb(var(--accent) / ${opacityValue ?? 1})`,
        primary2: ({ opacityValue }) => `rgb(var(--accent2) / ${opacityValue ?? 1})`,
        primaryHover: ({ opacityValue }) => `rgb(var(--accentHover) / ${opacityValue ?? 1})`,
        primaryWeak: ({ opacityValue }) => `rgb(var(--accentWeak) / ${opacityValue ?? 'var(--accentWeakA)'})`,

        danger: ({ opacityValue }) => `rgb(var(--danger) / ${opacityValue ?? 1})`,
        success: ({ opacityValue }) => `rgb(var(--success) / ${opacityValue ?? 1})`,
        warning: ({ opacityValue }) => `rgb(var(--warning) / ${opacityValue ?? 1})`,
      },
      borderRadius: {
        xl: '18px',
        '2xl': '22px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        soft: 'var(--shCard)',
        dropdown: 'var(--shDropdown)',
      },
    },
  },
  plugins: [],
};

