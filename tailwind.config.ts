import type { Config } from "tailwindcss";

// Design tokens from prd.md §5.2 — mapped as CSS variables on :root
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        // Text
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        // Accent
        accent: "var(--accent)",
        "on-accent": "var(--on-accent)",
        // Status badges
        "status-verified": "var(--status-verified)",
        "status-unverified": "var(--status-unverified)",
        "status-na": "var(--status-na)",
        // Warning / extrapolation / banner
        warning: "var(--warning)",
        "warning-surface": "var(--warning-surface)",
        "warning-text": "var(--warning-text)",
        // Semantic
        differs: "var(--differs)",
        danger: "var(--danger)",
        focus: "var(--focus)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        body: ["1rem", { lineHeight: "1.5" }],
        table: ["0.875rem", { lineHeight: "1.4" }],
        "page-title": ["1.75rem", { lineHeight: "1.2" }],
        "section-title": ["1.25rem", { lineHeight: "1.3" }],
        badge: ["0.75rem", { lineHeight: "1", letterSpacing: "0.04em" }],
      },
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        control: "6px",
        chip: "999px",
      },
      transitionDuration: {
        expand: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
