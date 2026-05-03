import type { AxeResults } from "axe-core";

export type Theme = "auto" | "default" | "light" | "high-contrast";
export type ResolvedTheme = "default" | "light" | "high-contrast";
export type Severity = "minor" | "moderate" | "serious" | "critical";

export interface MountOptions {
  theme?: Theme;
  scope?: string | Element;
  autoScan?: boolean;
  debounce?: number;
}

export interface A11yHudInstance {
  unmount(): void;
  setTheme(theme: Theme): void;
  runScan(): Promise<AxeResults>;
}

export type { AxeResults };
