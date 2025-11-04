import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        background: "var(--background)",
      },
    },
  },
  plugins: [
    function ({ addVariant }: any) {
      addVariant("light", "html.light &");
      addVariant("dark", "html:not(.light) &");
    },
  ],
};

export default config;
