import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  target: "es2022",
  platform: "browser",
  treeshake: true,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
