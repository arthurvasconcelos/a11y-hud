import type { AxeResults, IgnoreEntry, Theme } from "a11y-hud";
import type { RefObject } from "react";

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: RefObject<Element | null>;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}

export type A11yHudProps = UseA11yHudOptions;

export interface UseA11yHudReturn {
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
