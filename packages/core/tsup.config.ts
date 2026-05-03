import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    loader: { ".css": "text", ".svg": "text" },
    target: "es2022",
    platform: "browser",
    treeshake: true,
  },
  {
    entry: { "index.umd": "src/index.ts" },
    format: ["iife"],
    globalName: "A11yHud",
    dts: false,
    clean: false,
    sourcemap: true,
    loader: { ".css": "text", ".svg": "text" },
    target: "es2022",
    platform: "browser",
    minify: true,
    treeshake: true,
    outExtension: () => ({ js: ".js" }),
  },
]);
