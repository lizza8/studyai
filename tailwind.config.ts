import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#22d3ee",
          700: "#0891b2"
        },
        neon: {
          pink: "#ff4fd8",
          blue: "#4f9bff",
          green: "#3dff7d",
          yellow: "#f7ff5a",
          purple: "#a855f7"
        }
      }
    }
  },
  plugins: []
};

export default config;
