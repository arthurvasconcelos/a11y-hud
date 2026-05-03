import type { AxeResults, Theme } from "a11y-hud";
import type { RefObject } from "react";

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: RefObject<Element | null>;
  autoScan?: boolean;
  debounce?: number;
}

export type A11yHudProps = UseA11yHudOptions;

export interface UseA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
}
