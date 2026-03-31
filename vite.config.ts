import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { serwist } from "@serwist/vite";

// Allow overriding the base path via environment variable (e.g. for nema-dev deployment)
const base = process.env.VITE_BASE_PATH ?? "/nema/";

export default defineConfig({
  base,
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
});
