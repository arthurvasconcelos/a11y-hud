import type { ElementRef } from "@angular/core";
import type { AxeResults, Theme } from "a11y-hud";

export type ScopeInput = ElementRef<Element> | Element | null | undefined;

export interface UseA11yHudOptions {
  theme?: Theme;
  scope?: ScopeInput;
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
