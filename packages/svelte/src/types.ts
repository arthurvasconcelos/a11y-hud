import type { AxeResults, Theme } from "a11y-hud";

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: Element | null;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}

export type A11yHudProps = UseA11yHudOptions;

export interface UseA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
  setRunOnly(tags: string[]): void;
}

export declare function useA11yHud(getOptions?: () => UseA11yHudOptions): UseA11yHudReturn;
