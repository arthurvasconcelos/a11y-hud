import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type UserConfig } from "tsdown";

const TEXT_SUFFIX = "?text";

const textLoader: NonNullable<UserConfig["plugins"]>[number] = {
  name: "text-loader",
  resolveId(source, importer) {
    if (!/\.(css|svg)$/.test(source) || !importer) return null;
    return resolve(dirname(importer), source) + TEXT_SUFFIX;
  },
  load(id) {
    if (!id.endsWith(TEXT_SUFFIX)) return null;
    const file = id.slice(0, -TEXT_SUFFIX.length);
    this.addWatchFile(file);
    return {
      code: `export default ${JSON.stringify(readFileSync(file, "utf-8"))};`,
      moduleType: "js",
    };
  },
};

const shared: UserConfig = {
  entry: "src/index.ts",
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  plugins: [textLoader],
};

export default defineConfig([
  {
    ...shared,
    format: "esm",
    dts: true,
    clean: true,
  },
  {
    ...shared,
    format: "iife",
    globalName: "A11yHud",
    dts: false,
    clean: false,
    minify: true,
    deps: { alwaysBundle: ["axe-core"], onlyBundle: false },
    outputOptions: { entryFileNames: "index.umd.js" },
  },
]);
