# React

`@a11y-hud/react` is a thin React adapter that mounts the a11y-hud Custom Element and re-runs axe after every React render commit.

## Requirements

- React 18 or later
- `a11y-hud` (installed automatically as a dependency)

## Install

::: code-group

```bash [npm]
npm install --save-dev @a11y-hud/react
```

```bash [pnpm]
pnpm add -D @a11y-hud/react
```

```bash [yarn]
yarn add -D @a11y-hud/react
```

:::

## Quick start — component

Add `<A11yHud>` to your root component so it mounts once for the entire app:

```tsx
// App.tsx
import { A11yHud } from "@a11y-hud/react";

export default function App() {
  return (
    <>
      {import.meta.env.DEV && <A11yHud theme="auto" />}
      {/* rest of app */}
    </>
  );
}
```

The component mounts the `<a11y-hud>` Custom Element to `document.body` and triggers a rescan after every React commit via `useEffect`.

## Quick start — hook

Use `useA11yHud` when you need imperative access to the instance:

```tsx
import { useEffect } from "react";
import { useA11yHud } from "@a11y-hud/react";

function DevTools() {
  const hud = useA11yHud({ theme: "auto" });

  useEffect(() => {
    // Export results on demand
    document.addEventListener("keydown", (e) => {
      if (e.key === "e" && e.ctrlKey) {
        console.log(hud.exportResults());
      }
    });
  }, [hud]);

  return null;
}
```

## Props / options

Both `<A11yHud>` props and `useA11yHud` options accept the same fields:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme |
| `scope` | `RefObject<Element \| null>` | — | Ref to restrict scan scope |
| `autoScan` | `boolean` | `true` | Re-scan on DOM mutations |
| `debounce` | `number` | `500` | Auto-scan debounce in ms |
| `runOnly` | `string[]` | — | axe rule tags to run |

## Scoping to a subtree

```tsx
import { useRef } from "react";
import { A11yHud } from "@a11y-hud/react";

export default function App() {
  const scopeRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <A11yHud theme="auto" scope={scopeRef} />
      <div ref={scopeRef}>
        {/* only this subtree is scanned */}
      </div>
    </>
  );
}
```

## Route-change rescans

The adapter rescans after every React commit, which covers most route-change cases automatically when using React Router or TanStack Router. If you need explicit control, see the [Route-change rescans cookbook](/cookbook/route-change-rescans).

## Instance API

`useA11yHud` returns the same [`UseA11yHudReturn`](/reference/api#useahudreturn) object across all adapters:

```ts
const hud = useA11yHud({ theme: "auto" });

hud.runScan()              // Promise<AxeResults>
hud.setTheme("github-dark")
hud.setRunOnly(["wcag2a"])
hud.exportResults()        // JSON string | null
hud.ignores.add("color-contrast")
hud.ignores.list()         // IgnoreEntry[]
hud.ignores.exportJson()
hud.ignores.importJson(json)
hud.ignores.clear()
```
