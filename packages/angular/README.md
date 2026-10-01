# @a11y-hud/angular

Angular adapter for [a11y-hud](https://www.npmjs.com/package/a11y-hud) — run axe-core accessibility audits inside your Angular app with no browser extension required.

## Install

```bash
npm install a11y-hud @a11y-hud/angular
```

Peer dependencies: `@angular/core >=20.0.0 <23.0.0` (Angular 20–22).

## Usage

### Component

Drop `<a11y-hud-angular>` into your root component's template. It renders nothing into the Angular tree — the HUD panel is appended to `document.body` as a Custom Element.

```typescript
import { Component } from '@angular/core';
import { A11yHudComponent } from '@a11y-hud/angular';

@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `
    <a11y-hud-angular [theme]="'auto'" />
    <router-outlet />
  `,
})
export class AppComponent {}
```

### Service

Use `A11yHudService` when you need programmatic access to `runScan` or `setTheme`.

```typescript
import { Component, OnInit } from '@angular/core';
import { A11yHudService } from '@a11y-hud/angular';

@Component({
  standalone: true,
  providers: [A11yHudService],
  template: `<button (click)="scan()">Scan now</button>`,
})
export class DevToolsComponent implements OnInit {
  constructor(private readonly hud: A11yHudService) {}

  ngOnInit() {
    this.hud.init({ theme: 'auto' });
  }

  scan() {
    void this.hud.runScan();
  }
}
```

### Subtree scoping

Restrict the scan to a specific subtree by passing a template reference variable or an `ElementRef`.

```typescript
import { Component } from '@angular/core';
import { A11yHudComponent } from '@a11y-hud/angular';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [A11yHudComponent, RouterOutlet],
  template: `
    <a11y-hud-angular [scope]="mainRef" />
    <main #mainRef>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
```

The `scope` input accepts a template reference variable (typed as `Element` by Angular's template checker), an `ElementRef<Element>` from `@ViewChild`, or `null` to restore full-page scanning.

### Route change rescans

The component rescans after every render commit via `afterEveryRender`, which covers Angular Router navigations and any re-render that does not change an `@Input()` value. No extra wiring needed.

If you need a manual rescan on a specific navigation event (for example, inside a `CanActivate` guard or a resolver), call `runScan()` on the component or through `A11yHudService`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { A11yHudComponent } from '@a11y-hud/angular';
import { filter } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `<a11y-hud-angular #hud />`,
})
export class AppComponent {
  @ViewChild('hud') hud!: A11yHudComponent;

  constructor(router: Router) {
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.hud.runScan());
  }
}
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `theme` | `Theme` | `'auto'` | Panel theme — `'auto'`, `'default'`, `'light'`, `'high-contrast'`, `'github-dark'`, `'github-light'`, `'tokyo-night'`, `'solarized-dark'` |
| `scope` | `ElementRef<Element> \| Element \| null` | `null` | Restrict scan to this element |
| `autoScan` | `boolean` | `true` | Rescan on DOM mutations |
| `debounce` | `number` | `500` | MutationObserver debounce in ms |
| `runOnly` | `string[]` | — | Restrict axe to specific rule-set tags |

`A11yHudComponent` also exposes `runScan()`, `setTheme()`, `setRunOnly()`, `exportResults()` and `ignores` for use via `@ViewChild`.

## `A11yHudService` methods

| Method | Description |
|---|---|
| `init(options?)` | Mount the HUD; call once in `ngOnInit` or `ngAfterViewInit` |
| `initialized` | Getter — `true` once `init()` has run |
| `runScan()` | Trigger a manual scan, returns `Promise<AxeResults \| null>` (`null` before `init()`) |
| `setTheme(theme)` | Switch the theme at runtime |
| `setRunOnly(tags)` | Change the active axe rule-set tags |
| `exportResults()` | Last scan as a JSON string, or `null` |
| `ignores` | Ignore-list API (`add`, `remove`, `clear`, `list`, `exportJson`, `importJson`) |
| `syncScope(scope)` | Update the scan scope |
| `syncTheme(theme)` / `syncAutoScan(autoScan)` / `syncDebounce(debounce)` | Push option changes to the mounted element |

The service is `@Injectable()` without `providedIn` — list it in a component's `providers` (the component does this for you). It unmounts the HUD in `ngOnDestroy`.

## Server-side rendering

Importing `@a11y-hud/angular` is safe on the server (Angular SSR, Analog); the HUD mounts in `ngAfterViewInit` / `init()`, so nothing renders server-side.

## License

MIT © Arthur Vasconcelos
