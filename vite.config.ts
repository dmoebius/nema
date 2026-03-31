import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { serwist } from "@serwist/vite";
/// <reference types="vitest" />

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    serwist({
      swSrc: "src/sw.ts",
      swDest: "sw.js",
      globDirectory: "dist",
      injectionPoint: "self.__SW_MANIFEST",
      rollupFormat: "iife",
    }),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    alias: {
      // Ensure testing-library uses the same React instance
      "react-dom/test-utils": "react-dom/test-utils",
    },
  },
});
