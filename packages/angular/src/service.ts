import { type ElementRef, Injectable, inject, NgZone, type OnDestroy } from "@angular/core";
import type { A11yHudElement, A11yHudInstance, AxeResults, Theme } from "a11y-hud";
import { mount } from "a11y-hud";
import type { ScopeInput, UseA11yHudOptions } from "./types.js";

function resolveScope(scope: ScopeInput): Element | undefined {
  if (scope == null) return undefined;
  return scope instanceof Element ? scope : (scope as ElementRef<Element>).nativeElement;
}

@Injectable()
export class A11yHudService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private instance: A11yHudInstance | null = null;
  private el: A11yHudElement | null = null;

  init(options: UseA11yHudOptions = {}): void {
    const { theme, autoScan, debounce, runOnly } = options;
    this.instance = mount({
      ...(theme !== undefined && { theme }),
      ...(autoScan !== undefined && { autoScan }),
      ...(debounce !== undefined && { debounce }),
      ...(runOnly !== undefined && { runOnly }),
    });
    this.el = document.querySelector<A11yHudElement>("a11y-hud");
    if (this.el) {
      this.el.scopeElement = resolveScope(options.scope);
    }
  }

  syncScope(scope: ScopeInput): void {
    const el = this.el;
    if (!el) return;
    el.scopeElement = resolveScope(scope);
  }

  syncTheme(theme: Theme | undefined): void {
    if (theme !== undefined) this.instance?.setTheme(theme);
  }

  syncAutoScan(autoScan: boolean | undefined): void {
    const el = this.el;
    if (!el || autoScan === undefined) return;
    if (autoScan === false) {
      el.removeAttribute("auto-scan");
    } else {
      el.setAttribute("auto-scan", "");
    }
  }

  syncDebounce(debounce: number | undefined): void {
    const el = this.el;
    if (!el || debounce === undefined) return;
    el.setAttribute("debounce", String(debounce));
  }

  runScan(): Promise<AxeResults> {
    return this.ngZone.runOutsideAngular(
      () => this.instance?.runScan() ?? Promise.resolve(null as unknown as AxeResults)
    );
  }

  setTheme(theme: Theme): void {
    this.instance?.setTheme(theme);
  }

  setRunOnly(tags: string[]): void {
    this.instance?.setRunOnly(tags);
  }

  exportResults(): string | null {
    return this.instance?.exportResults() ?? null;
  }

  get initialized(): boolean {
    return this.instance !== null;
  }

  ngOnDestroy(): void {
    this.instance?.unmount();
    this.instance = null;
    this.el = null;
  }
}
