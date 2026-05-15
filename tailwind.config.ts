import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-raleway)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-roboto-mono)", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        silver: {
          50: "#fafaf8",
          100: "#f1efe9",
          200: "#e3dfd4",
          300: "#cdc7b8",
          400: "#b4ad9b",
          500: "#9b937f",
          600: "#7d7666",
          700: "#5e584c",
          800: "#3f3a31",
          900: "#211f1a",
        },
        gold: {
          100: "#f5ecd2",
          200: "#e8d6a1",
          300: "#d4ba74",
          400: "#b89a55",
          500: "#967b3f",
          600: "#735c2e",
        },
        sepia: {
          100: "#f0e7d8",
          200: "#dccdb1",
          300: "#c1ac82",
          400: "#9d8458",
          500: "#7a623a",
          600: "#553f23",
        },
        paper: "#f6f1e6",
        ink: "#1c1814",
        highlight: {
          yellow: "rgba(254, 240, 138, 0.65)",
          green: "rgba(187, 247, 208, 0.65)",
          purple: "rgba(221, 214, 254, 0.7)",
          pink: "rgba(251, 207, 232, 0.65)",
          blue: "rgba(191, 219, 254, 0.65)",
        },
      },
      boxShadow: {
        page: "0 22px 50px -18px rgba(20, 14, 4, 0.55), 0 8px 18px -8px rgba(20, 14, 4, 0.35)",
        "page-lift": "0 40px 80px -20px rgba(20, 14, 4, 0.6), 0 12px 28px -10px rgba(20, 14, 4, 0.4)",
        frosted: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 32px rgba(40, 30, 10, 0.18)",
      },
      animation: {
        "float-soft": "float 7s ease-in-out infinite",
        grain: "grain 8s steps(10) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(0.3deg)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "20%": { transform: "translate(-15%, 5%)" },
          "30%": { transform: "translate(7%, -25%)" },
          "40%": { transform: "translate(-5%, 25%)" },
          "50%": { transform: "translate(-15%, 10%)" },
          "60%": { transform: "translate(15%, 0%)" },
          "70%": { transform: "translate(0%, 15%)" },
          "80%": { transform: "translate(3%, 35%)" },
          "90%": { transform: "translate(-10%, 10%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
