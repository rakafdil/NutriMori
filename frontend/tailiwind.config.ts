import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "spin-slower": "spin 12s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
