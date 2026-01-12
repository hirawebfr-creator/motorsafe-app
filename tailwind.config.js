/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",

        // Defaults match globals.css opacities; /xx still works when Tailwind sets --tw-*-opacity
        text: "rgb(var(--text) / var(--tw-text-opacity, var(--textA)))",
        muted: "rgb(var(--muted) / var(--tw-text-opacity, var(--textSecondaryA)))",
        muted2: "rgb(var(--muted2) / var(--tw-text-opacity, var(--textMutedA)))",
        border: "rgb(var(--border) / var(--tw-border-opacity, var(--borderA)))",

        primary: "rgb(var(--accent) / <alpha-value>)",
        primary2: "rgb(var(--accent2) / <alpha-value>)",
        primaryHover: "rgb(var(--accentHover) / <alpha-value>)",
        primaryWeak: "rgb(var(--accentWeak) / var(--tw-bg-opacity, var(--accentWeakA)))",

        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
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

