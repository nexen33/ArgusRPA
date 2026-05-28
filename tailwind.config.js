/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Microsoft YaHei"',
          'sans-serif'
        ],
        mono: [
          '"Fira Code"',
          '"JetBrains Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      colors: {
        primary: "var(--accent)",
        darkBg: "var(--bg-main)",
        darkPanel: "var(--bg-panel)",
        gray: {
          50: "var(--bg-main)",
          100: "var(--bg-main)",
          200: "var(--text-primary)",
          300: "var(--text-secondary)",
          400: "var(--text-muted)",
          500: "var(--text-faint)",
          600: "var(--border-strong)",
          700: "var(--border)",
          800: "var(--bg-elevated)",
          900: "var(--bg-surface)"
        },
        blue: {
          400: "var(--accent)",
          500: "var(--accent)",
          600: "var(--accent)"
        }
      }
    },
  },
  plugins: [],
}
