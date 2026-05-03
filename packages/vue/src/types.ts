import type { AxeResults, Theme } from "a11y-hud";

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: Element | null;
  autoScan?: boolean;
  debounce?: number;
}

export type A11yHudProps = UseA11yHudOptions;

export interface UseA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
}
