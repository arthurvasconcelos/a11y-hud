# @a11y-hud/angular

Angular adapter for [a11y-hud](https://github.com/arthurvasconcelos/a11y-hud) — run axe-core accessibility audits inside your Angular app with no browser extension required.

## Installation

```bash
npm install a11y-hud @a11y-hud/angular
```

Requires Angular 20 or 21.

## Usage

### Declarative (recommended)

Add `A11yHudComponent` to your root component's imports and drop `<a11y-hud-angular>` into the template:

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

### Scoping to a subtree

Pass a template reference or a plain `Element` to restrict scans to a part of the page:

```typescript
@Component({
  standalone: true,
  imports: [A11yHudComponent],
  template: `
    <a11y-hud-angular [scope]="mainRef" />
    <main #mainRef>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  @ViewChild('mainRef') mainRef!: ElementRef;
}
```

The `scope` input accepts an `ElementRef`, a raw `Element`, or `null`.

### Imperative (service)

Inject `A11yHudService` directly when you need programmatic control:

```typescript
import { Component, OnInit } from '@angular/core';
import { A11yHudService } from '@a11y-hud/angular';

@Component({
  standalone: true,
  providers: [A11yHudService],
  template: `<button (click)="scan()">Scan now</button>`,
})
export class MyComponent implements OnInit {
  constructor(private readonly hud: A11yHudService) {}

  ngOnInit() {
    this.hud.init({ theme: 'auto' });
  }

  scan() {
    void this.hud.runScan();
  }
}
```

## API

### `A11yHudComponent` inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `theme` | `'auto' \| 'default' \| 'light' \| 'high-contrast'` | `'auto'` | Panel color theme |
| `scope` | `ElementRef<Element> \| Element \| null` | `null` | Restrict scan to this element |
| `autoScan` | `boolean` | `true` | Rescan on DOM mutations |
| `debounce` | `number` | `500` | MutationObserver debounce in ms |

### `A11yHudService` methods

| Method | Description |
|---|---|
| `init(options?)` | Mount the HUD and run an initial scan |
| `runScan()` | Trigger a manual scan, returns `Promise<AxeResults>` |
| `setTheme(theme)` | Switch the theme at runtime |
| `syncScope(scope)` | Update the scan scope |

## License

MIT
