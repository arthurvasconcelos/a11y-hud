# Angular

`@a11y-hud/angular` provides a standalone Angular component and injectable service for the a11y-hud Custom Element.

## Requirements

- Angular 20–22 (peer range `>=20.0.0 <23.0.0`)
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

```typescript [app.component.ts]
import { Component, isDevMode } from "@angular/core";
import { A11yHudComponent } from "@a11y-hud/angular";

@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `
    @if (isDev) {
      <a11y-hud-angular [theme]="'auto'" />
    }
    <!-- rest of app -->
  `,
})
export class AppComponent {
  readonly isDev = isDevMode();
}
```

## Quick start — service

`A11yHudService` gives you imperative control without the component. It is declared with `@Injectable()` and no `providedIn`, so you must list it in the component's `providers` array — injecting it without a provider throws `NullInjectorError`. Call `init()` once to mount the HUD; the service unmounts it in `ngOnDestroy`.

```typescript
import { Component, OnInit, inject } from "@angular/core";
import { A11yHudService } from "@a11y-hud/angular";

@Component({
  standalone: true,
  providers: [A11yHudService],
  template: "",
})
export class DevComponent implements OnInit {
  private hud = inject(A11yHudService);

  ngOnInit() {
    this.hud.init({ theme: "auto" });
  }
}
```

## Server-side rendering

Importing `@a11y-hud/angular` is safe on the server (Angular SSR, Analog): the Custom Element is only registered when `customElements` exists. The HUD mounts in `ngAfterViewInit` (component) or when you call `init()`, which run only in the browser, so nothing is rendered server-side.

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

The component rescans after every render commit via `afterEveryRender`, which covers router navigations and re-renders that do not change any `@Input()` values. Input changes (`scope`, `theme`, `autoScan`, `debounce`, `runOnly`) are synced in `ngOnChanges`. For explicit router-driven rescans, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API

Both `A11yHudComponent` (via `@ViewChild`) and `A11yHudService` expose the same methods as [`UseA11yHudReturn`](/reference/api#useahudreturn):

```typescript
@ViewChild(A11yHudComponent) hud!: A11yHudComponent;

await this.hud.runScan();   // Promise<AxeResults | null> — null if not mounted yet
this.hud.setTheme("tokyo-night");
this.hud.setRunOnly(["wcag2aa"]);
this.hud.exportResults();   // string | null
this.hud.ignores.add("color-contrast");
```

The service additionally exposes `init(options?)`, an `initialized` getter, and `syncScope` / `syncTheme` / `syncAutoScan` / `syncDebounce` for pushing option changes to the mounted element. See the [API reference](/reference/api#a11yhudservice) for details.
