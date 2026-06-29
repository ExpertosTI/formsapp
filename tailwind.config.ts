import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        tl: {
          bg: "#070b14",
          surface: "#0f1628",
          accent: "#5eead4",
          violet: "#818cf8",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(94, 234, 212, 0.35)",
        "glow-violet": "0 0 40px -10px rgba(129, 140, 248, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
