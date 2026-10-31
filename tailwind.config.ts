import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brightloop official design system tokens from reference image
        brightloop: {
          bg: "#DCE9DF", // Primary page background (soft sage)
          card: "#FFFFFF", // Surface / card white
          text: "#202923", // Primary dark text
          sage: "#8F9F94", // Secondary sage text & KPI header
          "sage-dark": "#75847A",
          coral: "#FA8257", // Accent coral for active states, CTA & highlights
          "coral-hover": "#E87146",
          "coral-light": "#FDECE6",
          "coral-tint": "#FFF1EC",
          border: "#D4DED6", // Thin sage border
          muted: "#8F9F94",
          dark: "#202923", // Dark card header & dark button
        },
        // Semantic shadcn tokens mapped to HSL CSS variables
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)", // 8px
        md: "calc(var(--radius) - 2px)", // 6px
        sm: "calc(var(--radius) - 4px)", // 4px
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(32, 41, 35, 0.04)",
        card: "0 1px 3px 0 rgba(32, 41, 35, 0.05), 0 1px 2px -1px rgba(32, 41, 35, 0.03)",
        hover: "0 4px 6px -1px rgba(32, 41, 35, 0.07), 0 2px 4px -2px rgba(32, 41, 35, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
