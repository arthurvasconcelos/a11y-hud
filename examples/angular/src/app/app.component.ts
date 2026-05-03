import { A11yHudComponent } from "@a11y-hud/angular";
import { Component, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  standalone: true,
  selector: "app-root",
  imports: [A11yHudComponent, RouterLink, RouterOutlet],
  template: `
    <a11y-hud-angular [scope]="scopeEnabled() ? scopeSectionRef : null" />

    <nav>
      <a routerLink="/">Page A</a>
      <a routerLink="/page-b">Page B</a>
    </nav>

    <div class="controls">
      <button id="btn-toggle-scope" type="button" (click)="scopeEnabled.set(!scopeEnabled())">
        {{ scopeEnabled() ? 'Disable scope' : 'Enable scope' }}
      </button>
      <button id="btn-add-violation" type="button" (click)="extraTabindex.set(true)">
        Add violation
      </button>
    </div>

    @if (extraTabindex()) {
      <button
        type="button"
        [tabIndex]="5"
        style="opacity: 0; position: absolute; pointer-events: none"
      >
        Positive tabindex
      </button>
    }

    <!-- This unlabelled input is outside the scope section. -->
    <input type="text" placeholder="Search (no label)" />

    <div #scopeSectionRef>
      <router-outlet />
    </div>
  `,
})
export class AppComponent {
  readonly scopeEnabled = signal(false);
  readonly extraTabindex = signal(false);
}
