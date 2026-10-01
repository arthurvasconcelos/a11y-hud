# @a11y-hud/solid

Solid adapter for [a11y-hud](https://github.com/arthurvasconcelos/a11y-hud) — run axe-core accessibility audits in your Solid app with no DevTools required.

## Install

```bash
pnpm add @a11y-hud/solid
# or
npm install @a11y-hud/solid
```

## Quick start

### Hook: `createA11yHud`

```tsx
import { createA11yHud } from "@a11y-hud/solid";

function App() {
  createA11yHud({ theme: "auto" });
  return <main>...</main>;
}
```

### Component: `<A11yHud>`

```tsx
import { A11yHud } from "@a11y-hud/solid";

function App() {
  return (
    <>
      <A11yHud theme="auto" />
      <main>...</main>
    </>
  );
}
```

### Reactive scope with signals

The `scope` option accepts `Element | null`. To make it reactive, pass it as a getter so Solid tracks the signal:

```tsx
import { A11yHud } from "@a11y-hud/solid";
import { createSignal } from "solid-js";

function App() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null);

  return (
    <>
      <A11yHud scope={container()} />
      <div ref={setContainer}>
        {/* only this subtree is audited when scope is set */}
      </div>
    </>
  );
}
```

When using `createA11yHud` directly and you want scope to be reactive, use getter syntax:

```tsx
import { createA11yHud } from "@a11y-hud/solid";
import { createSignal } from "solid-js";

function App() {
  const [scope, setScope] = createSignal<Element | null>(null);
  createA11yHud({ get scope() { return scope(); } });
  return <main>...</main>;
}
```

## Options

| Option | Type | Description |
|---|---|---|
| `theme` | `Theme` | `"auto"` (default), `"default"`, `"light"`, `"high-contrast"`, `"github-dark"`, `"github-light"`, `"tokyo-night"`, `"solarized-dark"` |
| `scope` | `Element \| null` | Restrict scan to this element's subtree |
| `autoScan` | `boolean` | Enable/disable automatic scanning (default: `true`) |
| `debounce` | `number` | Debounce delay in ms for MutationObserver rescans |
| `runOnly` | `string[]` | Restrict axe to specific rule-set tags |

`createA11yHud` returns `{ runScan, setTheme, setRunOnly, exportResults, ignores }`. `runScan()` resolves `Promise<AxeResults | null>` — `null` if called before the HUD has mounted.

## Server-side rendering

Importing `@a11y-hud/solid` is safe on the server (SolidStart); the HUD mounts in `onMount`, so nothing renders server-side.

## License

MIT
