import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0e12",
        raised: "#151920",
        inset: "#101318",
        line: "#2c333c",
        ink: "#f3efe6",
        muted: "#c4bbb0",
        faint: "#948d82",
        brass: "#e4c27a",
        hit: "#8fd0ae",
        miss: "#f0a097",
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
