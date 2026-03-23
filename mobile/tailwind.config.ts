import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // eStories brand colors (matching web app)
        primary: {
          DEFAULT: "hsl(262.1, 83.3%, 57.8%)",
          foreground: "hsl(210, 20%, 98%)",
        },
        secondary: {
          DEFAULT: "hsl(220, 14.3%, 95.9%)",
          foreground: "hsl(220.9, 39.3%, 11%)",
        },
        muted: {
          DEFAULT: "hsl(220, 14.3%, 95.9%)",
          foreground: "hsl(220, 8.9%, 46.1%)",
        },
        accent: {
          DEFAULT: "hsl(220, 14.3%, 95.9%)",
          foreground: "hsl(220.9, 39.3%, 11%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(210, 20%, 98%)",
        },
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(224, 71.4%, 4.1%)",
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(224, 71.4%, 4.1%)",
        },
        border: "hsl(220, 13%, 91%)",
        ring: "hsl(262.1, 83.3%, 57.8%)",
        glass: {
          DEFAULT: "rgba(255,255,255,0.05)",
          light: "rgba(255,255,255,0.08)",
          medium: "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.10)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
