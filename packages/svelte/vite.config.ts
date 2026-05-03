import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    svelte({ compilerOptions: { runes: true } }),
    dts({
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.svelte.ts", "src/**/*.test.ts", "src/test-setup.ts"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["svelte", /^svelte\//, "a11y-hud"],
    },
  },
});
