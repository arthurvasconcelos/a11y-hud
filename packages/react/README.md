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
| `theme` | `"auto" \| "default" \| "light" \| "high-contrast"` | `"auto"` | Panel theme |
| `scope` | `RefObject<Element \| null>` | — | Restrict scan to a subtree |
| `autoScan` | `boolean` | `true` | Auto-rescan on DOM mutations |
| `debounce` | `number` | `500` | Debounce delay in ms |

## License

MIT © Arthur Vasconcelos
