import type { AxeResults, Theme } from "a11y-hud";
import type { Ref } from "vue";

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: Ref<Element | null>;
  autoScan?: boolean;
  debounce?: number;
}

export type A11yHudProps = UseA11yHudOptions;

export interface UseA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
}
