import type { AxeResults } from "axe-core";

export interface A11yHudExport {
  version: "1";
  timestamp: string;
  url: string;
  scope: string;
  results: AxeResults;
}

export interface IgnoreEntry {
  ruleId: string;
  selector?: string;
}

export type Theme =
  | "auto"
  | "default"
  | "light"
  | "high-contrast"
  | "github-dark"
  | "github-light"
  | "tokyo-night"
  | "solarized-dark";
export type ResolvedTheme = Exclude<Theme, "auto">;
export type Severity = "minor" | "moderate" | "serious" | "critical";

export interface MountOptions {
  theme?: Theme;
  scope?: string | Element;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}

export interface A11yHudInstance {
  unmount(): void;
  setTheme(theme: Theme): void;
  setRunOnly(tags: string[]): void;
  runScan(): Promise<AxeResults>;
  exportResults(): string | null;
  ignores: {
    add(ruleId: string, selector?: string): void;
    remove(ruleId: string, selector?: string): void;
    clear(): void;
    list(): IgnoreEntry[];
    exportJson(): string;
    importJson(json: string): void;
  };
}

export type { AxeResults };
