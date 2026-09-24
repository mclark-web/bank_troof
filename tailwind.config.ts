import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0c0e",
        raised: "#161820",
        inset: "#101318",
        line: "#2a2d36",
        ink: "#f2f1ee",
        muted: "#9a9aa3",
        faint: "#9a9aa3",
        brass: "#ee9a44",
        orange: "#eb6505",
        hit: "#7dcea0",
        miss: "#e08a7a",
        provisional: "#8aa0c8",
        warn: "#e8c070",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "72rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset",
      },
    },
  },
  plugins: [],
};

export default config;
