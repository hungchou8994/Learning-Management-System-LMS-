import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./providers/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0b0f17",
          panel: "#111827",
          panel2: "#0f172a",
          border: "rgba(255,255,255,0.08)",
        },
        brand: {
          blue: "#1877F2",
          blue2: "#0E78F9",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;


