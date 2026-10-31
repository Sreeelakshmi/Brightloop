import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified Brightloop Design Palette
        brand: {
          bg: "#E4ECE1", // Pale sage page background
          card: "#FFFFFF", // Crisp card surface
          border: "#D5DDD2", // 1px card/divider border
          ink: "#1F2622", // Primary dark charcoal (headings, primary buttons)
          sage: "#8C9B8E", // Muted sage (table headers, secondary fills)
          orange: "#F27B4B", // Attention coral orange (overdue, paused, destructive)
        },
        // Compatibility aliases for Member 1 & Member 4 components
        brightloop: {
          bg: "#E4ECE1",
          card: "#FFFFFF",
          text: "#1F2622",
          sage: "#8C9B8E",
          "sage-dark": "#75847A",
          coral: "#F27B4B",
          "coral-hover": "#E87146",
          "coral-light": "#FDECE6",
          "coral-tint": "#FFF1EC",
          border: "#D5DDD2",
          muted: "#8C9B8E",
          dark: "#1F2622",
        },
        telemetry: {
          bg: "#E4ECE1",
          card: "#FFFFFF",
          border: "#D5DDD2",
          panel: "#DDE5DB",
          charcoal: "#1F2622",
          secondary: "#8C9B8E",
          orange: "#F27B4B",
        },
        // Semantic shadcn tokens mapped to CSS variables
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(31, 38, 34, 0.04)",
        card: "0 1px 3px 0 rgba(31, 38, 34, 0.05), 0 1px 2px -1px rgba(31, 38, 34, 0.03)",
        hover: "0 4px 6px -1px rgba(31, 38, 34, 0.07), 0 2px 4px -2px rgba(31, 38, 34, 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
