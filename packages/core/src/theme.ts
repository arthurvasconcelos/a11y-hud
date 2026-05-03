import type { ResolvedTheme, Theme } from "./types.js";

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (matchMedia("(prefers-contrast: more)").matches) return "high-contrast";
  if (theme === "auto")
    return matchMedia("(prefers-color-scheme: dark)").matches ? "default" : "light";
  return theme;
}

export function watchTheme(
  getTheme: () => Theme,
  callback: (resolved: ResolvedTheme) => void
): () => void {
  const colorScheme = matchMedia("(prefers-color-scheme: dark)");
  const contrast = matchMedia("(prefers-contrast: more)");

  const handler = () => callback(resolveTheme(getTheme()));

  colorScheme.addEventListener("change", handler);
  contrast.addEventListener("change", handler);

  return () => {
    colorScheme.removeEventListener("change", handler);
    contrast.removeEventListener("change", handler);
  };
}
