import path from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

/**
 * Bundle the Cloudflare Worker alongside the frontend build.
 *
 * `worker.ts` (+ `worker.api-entry.ts` for REST-API deploys) is what
 * `wrangler deploy` bundles on demand. This plugin emits the same worker as
 * a single pre-bundled ES module at worker-dist/worker.mjs so the worker can
 * also be deployed through the Cloudflare REST API (single-module upload),
 * where no bundler runs server-side. Output is a deploy artifact only —
 * worker-dist/ is git-ignored and never served to browsers.
 */
function bundleWorker(): Plugin {
  return {
    name: "savedd:bundle-worker",
    apply: "build",
    async closeBundle() {
      const { build } = await import("vite");
      await build({
        configFile: false,
        logLevel: "error",
        build: {
          lib: {
            entry: path.resolve(__dirname, "worker.api-entry.ts"),
            formats: ["es"],
            fileName: () => "worker.mjs",
          },
          outDir: "worker-dist",
          emptyOutDir: true,
          target: "es2022",
          minify: true,
        },
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    tailwindcss(),
    bundleWorker(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/{vite,eslint}.config.*',
      '.agents/**',
    ],
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
    env: {
      DEBUG_PRINT_LIMIT: '0', // Suppress DOM output that exceeds AI context windows
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));