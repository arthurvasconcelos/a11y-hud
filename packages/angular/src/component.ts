import {
  type AfterViewInit,
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

  private readonly service = inject(A11yHudService);

  ngAfterViewInit(): void {
    this.service.init({
      ...(this.theme !== undefined && { theme: this.theme }),
      scope: this.scope,
      ...(this.autoScan !== undefined && { autoScan: this.autoScan }),
      ...(this.debounce !== undefined && { debounce: this.debounce }),
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
  }

  runScan(): Promise<AxeResults> {
    return this.service.runScan();
  }

  setTheme(theme: Theme): void {
    this.service.setTheme(theme);
  }
}
