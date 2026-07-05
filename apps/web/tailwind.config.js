/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1B3F", 700: "#12295C", 800: "#0d1f47", 900: "#0a1430" },
        brand: { DEFAULT: "#1E50E6", 400: "#2E6BFF" },
        teal: { DEFAULT: "#17C3B2" },
        violet: { DEFAULT: "#7C5CFF" },
        amber: { DEFAULT: "#FFB020" },
        danger: { DEFAULT: "#FF5A5F" },
        ok: { DEFAULT: "#2ED47A" },
        ink: "#0B1B3F",
        mute: "#5B6B8C",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px rgba(11,27,63,.06)",
        pop: "0 20px 60px rgba(11,27,63,.18)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(23,195,178,.5)" }, "100%": { boxShadow: "0 0 0 12px rgba(23,195,178,0)" } },
      },
      animation: {
        "fade-up": "fade-up .4s ease both",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
