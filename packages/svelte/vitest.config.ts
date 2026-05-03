import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } }), svelteTesting()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      include: ["src/**/*.ts", "src/**/*.svelte"],
      exclude: ["src/**/*.test.ts", "src/test-setup.ts", "src/index.ts", "src/types.ts"],
      thresholds: { branches: 80 },
    },
  },
});
