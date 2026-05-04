# Solid

`@a11y-hud/solid` is a Solid adapter that mounts the a11y-hud Custom Element and re-runs axe via `createEffect` after reactive updates.

## Requirements

- solid-js 1.8 or later
- `a11y-hud` (installed automatically as a dependency)

## Install

::: code-group

```bash [npm]
npm install --save-dev @a11y-hud/solid
```

```bash [pnpm]
pnpm add -D @a11y-hud/solid
```

```bash [yarn]
yarn add -D @a11y-hud/solid
```

:::

## Quick start — component

```tsx
// App.tsx
import { A11yHud } from "@a11y-hud/solid";

export default function App() {
  return (
    <>
      {import.meta.env.DEV && <A11yHud theme="auto" />}
      {/* rest of app */}
    </>
  );
}
```

## Quick start — primitive

`createA11yHud` follows Solid's `create*` naming convention for reactive primitives:

```tsx
import { createA11yHud } from "@a11y-hud/solid";

function DevTools() {
  const hud = createA11yHud({ theme: "auto" });
  return null;
}
```

For reactive options (e.g., a theme signal), pass getter properties:

```tsx
import { createSignal } from "solid-js";
import { createA11yHud } from "@a11y-hud/solid";

const [theme, setTheme] = createSignal("auto");

const hud = createA11yHud({
  get theme() { return theme(); },
});
```

## Props / options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `Element \| null` | — | Element for scan scope |
| `autoScan` | `boolean` | `true` | Re-scan on DOM mutations |
| `debounce` | `number` | `500` | Auto-scan debounce in ms |
| `runOnly` | `string[]` | — | axe rule tags to run |

## Scoping to a subtree

```tsx
import { createSignal } from "solid-js";
import { A11yHud } from "@a11y-hud/solid";

export default function App() {
  let appRoot: HTMLDivElement | undefined;

  return (
    <>
      <A11yHud theme="auto" scope={appRoot} />
      <div ref={appRoot}>
        {/* only this subtree is scanned */}
      </div>
    </>
  );
}
```

## Route-change rescans

`createEffect` tracks Solid's reactive graph, so rescans happen automatically after reactive updates including router navigations. For explicit control, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API

```ts
const hud = createA11yHud({ theme: "auto" });

hud.runScan()
hud.setTheme("github-dark")
hud.setRunOnly(["wcag2aa"])
hud.exportResults()
hud.ignores.add("label")
hud.ignores.list()
```

See [`CreateA11yHudReturn`](/reference/api#createa11yhudreturn) for full type details.
