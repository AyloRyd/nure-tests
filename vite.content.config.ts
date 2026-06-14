import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "development" ? "development" : "production",
    ),
    __DEV__: mode === "development",
  },
  build: {
    outDir: "dist",
    emptyOutDir: false, // Keep popup assets
    lib: {
      entry: resolve(__dirname, "src/content.tsx"),
      name: "NURETestsContentScript",
      formats: ["iife"],
      fileName: () => "assets/content.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "assets/content.[ext]",
      },
    },
  },
}));
