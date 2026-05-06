import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0908",
        cream: "#F5F1EA",
        "cream-dark": "#EDE8DF",
        "warm-white": "#FDFCFA",
        coral: "#FF4D2E",
        sun: "#FFBE00",
        mint: "#00BF80",
        sky: "#2B7FFF",
        grape: "#7C3AED",
        rose: "#F0134D",
        muted: "#7A756E",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        child: ["var(--font-fredoka)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        "2xl": "40px",
      },
      boxShadow: {
        sm: "0 1px 3px 0 rgba(10,9,8,0.08), 0 1px 2px -1px rgba(10,9,8,0.06)",
        md: "0 4px 12px -2px rgba(10,9,8,0.12), 0 2px 6px -2px rgba(10,9,8,0.08)",
        lg: "0 12px 32px -4px rgba(10,9,8,0.16), 0 4px 12px -4px rgba(10,9,8,0.10)",
        xl: "0 24px 56px -8px rgba(10,9,8,0.20), 0 8px 20px -6px rgba(10,9,8,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
