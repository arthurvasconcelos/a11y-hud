# @a11y-hud/react

React adapter for [a11y-hud](https://www.npmjs.com/package/a11y-hud) — run axe-core accessibility audits in your React app with no browser extension required.

## Install

```sh
npm install a11y-hud @a11y-hud/react
```

Peer dependencies: `react@>=18`, `react-dom@>=18`.

## Usage

### Component

Drop `<A11yHud />` anywhere in your React tree. It renders nothing into the React DOM — the HUD panel is appended to `document.body` as a Custom Element.

```tsx
import { A11yHud } from "@a11y-hud/react";

export function App() {
  return (
    <>
      <A11yHud theme="auto" />
      {/* rest of your app */}
    </>
  );
}
```

### Hook

Use `useA11yHud` when you need programmatic access to `runScan` or `setTheme`.

```tsx
import { useA11yHud } from "@a11y-hud/react";

function DevTools() {
  const { runScan, setTheme } = useA11yHud({ theme: "auto" });

  return <button onClick={() => runScan()}>Scan now</button>;
}
```

### Subtree scoping

Restrict the scan to a specific subtree by passing a ref.

```tsx
import { useRef } from "react";
import { A11yHud } from "@a11y-hud/react";

function App() {
  const scopeRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <A11yHud scope={scopeRef} />
      <div ref={scopeRef}>
        {/* only this subtree is scanned */}
      </div>
    </>
  );
}
```

### Route change rescans

For React Router (or any router), ensure the component containing `<A11yHud>` re-renders on navigation so the render-settled rescan fires. The standard approach is `useLocation()`:

```tsx
import { useLocation } from "react-router-dom";
import { A11yHud } from "@a11y-hud/react";

function AppContent() {
  useLocation(); // subscribes to route changes
  return <A11yHud />;
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Panel theme — `"auto"`, `"default"`, `"light"`, `"high-contrast"`, `"github-dark"`, `"github-light"`, `"tokyo-night"`, `"solarized-dark"` |
| `scope` | `RefObject<Element \| null>` | — | Restrict scan to a subtree |
| `autoScan` | `boolean` | `true` | Auto-rescan on DOM mutations |
| `debounce` | `number` | `500` | Debounce delay in ms |
| `runOnly` | `string[]` | — | Restrict axe to specific rule-set tags |

### Hook return value

`useA11yHud` returns `{ runScan, setTheme, setRunOnly, exportResults, ignores }`. `runScan()` resolves `Promise<AxeResults | null>` — `null` if called before the HUD has mounted.

### Server-side rendering

Importing `@a11y-hud/react` is safe on the server (e.g. Next.js); the HUD mounts inside `useEffect`, so nothing renders server-side. In the App Router, use it from a `"use client"` component.

## License

MIT © Arthur Vasconcelos
