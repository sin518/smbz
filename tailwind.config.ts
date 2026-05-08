import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2f2d2a",
        mutedInk: "#898783",
        gold: "#b79a5b",
        paper: "#F8F7EE"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(16, 14, 10, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
