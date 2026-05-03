import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const textLoader: Plugin = {
  name: "text-loader",
  transform(_, id) {
    if (id.endsWith(".css") || id.endsWith(".svg")) {
      const content = readFileSync(id, "utf-8");
      return `export default ${JSON.stringify(content)};`;
    }
  },
};

export default defineConfig({
  plugins: [textLoader],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/test-setup.ts",
        "src/index.ts",
        "src/declarations.d.ts",
        "src/types.ts",
      ],
      thresholds: {
        branches: 90,
      },
    },
  },
});
