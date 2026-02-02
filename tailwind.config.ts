import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-variant": "var(--surface-variant)",
        "surface-container": "var(--surface-container)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
        "on-primary": "var(--on-primary)",
        "on-primary-container": "var(--on-primary-container)",
        secondary: "var(--secondary)",
        "secondary-container": "var(--secondary-container)",
        success: "var(--success)",
        "success-container": "var(--success-container)",
        warning: "var(--warning)",
        error: "var(--error)",
        "error-container": "var(--error-container)",
        "selected-bg": "var(--selected-bg)",
        "selected-border": "var(--selected-border)",
        "hover-bg": "var(--hover-bg)",
        "card-hover": "var(--card-hover)",
        "button-hover": "var(--button-hover)",
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
