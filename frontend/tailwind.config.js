/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080c14",
          card: "rgba(13, 20, 32, 0.7)",
          cardHover: "rgba(20, 30, 48, 0.8)",
          border: "rgba(0, 242, 254, 0.15)",
          borderGlow: "rgba(0, 242, 254, 0.35)",
          accent: "#00f2fe",
          blue: "#0d9488",
          dark: "#0b0f19",
          panel: "#121b2d",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          textMuted: "#94a3b8"
        }
      },
      boxShadow: {
        'cyber-glow': '0 0 15px rgba(0, 242, 254, 0.15)',
        'cyber-glow-strong': '0 0 25px rgba(0, 242, 254, 0.35)',
        'cyber-success': '0 0 15px rgba(16, 217, 129, 0.15)',
      },
      backdropBlur: {
        'cyber': '12px',
      }
    },
  },
  plugins: [],
}
