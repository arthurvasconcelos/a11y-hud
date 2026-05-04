import {
  type AfterViewInit,
  afterEveryRender,
  Component,
  Input,
  inject,
  type OnChanges,
  type SimpleChanges,
} from "@angular/core";
import type { AxeResults, Theme } from "a11y-hud";
import { A11yHudService } from "./service.js";
import type { ScopeInput } from "./types.js";

@Component({
  standalone: true,
  selector: "a11y-hud-angular",
  template: "",
  providers: [A11yHudService],
})
export class A11yHudComponent implements AfterViewInit, OnChanges {
  @Input() theme?: Theme;
  @Input() scope: ScopeInput = null;
  @Input() autoScan?: boolean;
  @Input() debounce?: number;
  @Input() runOnly?: string[];

  private readonly service = inject(A11yHudService);

  constructor() {
    // Render-settled rescan: mirrors React's useEffect(fn) (no deps). Fires after
    // every Angular render commit — catches route changes and any re-render that
    // does not alter @Input() values, which ngOnChanges would otherwise miss.
    afterEveryRender(() => {
      if (!this.service.initialized) return;
      this.service.syncScope(this.scope);
      void this.service.runScan();
    });
  }

  ngAfterViewInit(): void {
    this.service.init({
      ...(this.theme !== undefined && { theme: this.theme }),
      scope: this.scope,
      ...(this.autoScan !== undefined && { autoScan: this.autoScan }),
      ...(this.debounce !== undefined && { debounce: this.debounce }),
      ...(this.runOnly !== undefined && { runOnly: this.runOnly }),
    });
    void this.service.runScan();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.service.initialized) return;

    if ("scope" in changes) {
      this.service.syncScope(this.scope);
      void this.service.runScan();
    }
    if ("theme" in changes) {
      this.service.syncTheme(this.theme);
    }
    if ("autoScan" in changes) {
      this.service.syncAutoScan(this.autoScan);
    }
    if ("debounce" in changes) {
      this.service.syncDebounce(this.debounce);
    }
    if ("runOnly" in changes) {
      this.service.setRunOnly(this.runOnly ?? []);
    }
  }

  runScan(): Promise<AxeResults> {
    return this.service.runScan();
  }

  setTheme(theme: Theme): void {
    this.service.setTheme(theme);
  }

  setRunOnly(tags: string[]): void {
    this.service.setRunOnly(tags);
  }

  exportResults(): string | null {
    return this.service.exportResults();
  }

  get ignores() {
    return this.service.ignores;
  }
}
