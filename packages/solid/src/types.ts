import type { AxeResults, IgnoreEntry, Theme } from "a11y-hud";

export interface CreateA11yHudOptions {
  theme?: Theme;
  scope?: Element | null;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}

export type A11yHudProps = CreateA11yHudOptions;

export interface CreateA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
  setRunOnly(tags: string[]): void;
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
