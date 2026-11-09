import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Electric Cyan/Blue primary
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        slate: {
          850: "#151e2e",
          900: "#0f172a",
          950: "#0a0f1d",
        },
      },
      boxShadow: {
        // Neomorphism light shadows
        "neo-light": "-6px -6px 12px rgba(255, 255, 255, 0.85), 6px 6px 12px rgba(0, 0, 0, 0.08)",
        "neo-light-inset": "inset -4px -4px 8px rgba(255, 255, 255, 0.8), inset 4px 4px 8px rgba(0, 0, 0, 0.12)",
        "neo-light-sm": "-3px -3px 6px rgba(255, 255, 255, 0.8), 3px 3px 6px rgba(0, 0, 0, 0.06)",
        
        // Neomorphism dark shadows
        "neo-dark": "-5px -5px 12px rgba(255, 255, 255, 0.03), 5px 5px 14px rgba(0, 0, 0, 0.5)",
        "neo-dark-inset": "inset -3px -3px 6px rgba(255, 255, 255, 0.04), inset 3px 3px 8px rgba(0, 0, 0, 0.6)",
        "neo-dark-sm": "-2px -2px 6px rgba(255, 255, 255, 0.02), 3px 3px 8px rgba(0, 0, 0, 0.4)",
        
        // Glass glow
        "glass-glow": "0 0 25px -5px rgba(14, 165, 233, 0.25)",
        "glass-glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        "glass-glow-amber": "0 0 25px -5px rgba(245, 158, 11, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
