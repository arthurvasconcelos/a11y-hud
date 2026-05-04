# Angular

`@a11y-hud/angular` provides a standalone Angular component and injectable service for the a11y-hud Custom Element.

## Requirements

- Angular 20 or 21 (two most recent minors supported)
- `a11y-hud` (installed automatically as a dependency)

## Install

::: code-group

```bash [npm]
npm install --save-dev @a11y-hud/angular
```

```bash [pnpm]
pnpm add -D @a11y-hud/angular
```

```bash [yarn]
yarn add -D @a11y-hud/angular
```

:::

## Quick start — component

`A11yHudComponent` is a standalone component with selector `a11y-hud-angular`.

```typescript
// app.component.ts
import { Component, isDevMode } from "@angular/core";
import { A11yHudComponent } from "@a11y-hud/angular";

@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `
    <a11y-hud-angular *ngIf="isDev" [theme]="'auto'" />
    <!-- rest of app -->
  `,
})
export class AppComponent {
  readonly isDev = isDevMode();
}
```

## Quick start — service

`A11yHudService` is injectable for imperative control:

```typescript
import { Component, OnInit, inject } from "@angular/core";
import { A11yHudService } from "@a11y-hud/angular";

@Component({ standalone: true, template: "" })
export class DevComponent implements OnInit {
  private hud = inject(A11yHudService);

  ngOnInit() {
    this.hud.mount({ theme: "auto" });
  }
}
```

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `ElementRef<Element> \| Element \| null` | — | Element or ref for scan scope |
| `autoScan` | `boolean` | `true` | Re-scan on DOM mutations |
| `debounce` | `number` | `500` | Auto-scan debounce in ms |
| `runOnly` | `string[]` | — | axe rule tags to run |

`scope` accepts Angular's `@ViewChild` result directly:

```typescript
@ViewChild("mainContent") mainContent!: ElementRef<HTMLElement>;

// Pass to component via binding
template: `<a11y-hud-angular [scope]="mainContent" />`
```

## Route-change rescans

Angular's change detection triggers a rescan via `ngOnChanges` whenever inputs update. For router-driven rescans, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API (via service)

```typescript
const hud = this.hud; // A11yHudService instance
// Same API as UseA11yHudReturn:
await hud.runScan();
hud.setTheme("tokyo-night");
hud.exportResults();
hud.ignores.add("color-contrast");
```

See [`UseA11yHudReturn`](/reference/api#useahudreturn) for full type details.
