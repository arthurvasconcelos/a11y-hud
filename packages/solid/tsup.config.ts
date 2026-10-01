import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["solid-js", /^solid-js\//],
  target: "es2022",
  platform: "browser",
  treeshake: true,
});
