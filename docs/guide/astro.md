# Astro

Astro doesn't have a dedicated `@a11y-hud/astro` package because Astro delegates its UI to component islands (React, Vue, Svelte, Solid). a11y-hud works in Astro via two complementary paths.

## Path 1 — Vanilla core on the global page

For Astro sites without islands (or to audit the full page including static content), use the vanilla core directly in a layout component:

```astro
---
// layouts/BaseLayout.astro
const isDev = import.meta.env.DEV;
---

<html lang="en">
  <head><!-- ... --></head>
  <body>
    <slot />
    {isDev && <a11y-hud theme="auto"></a11y-hud>}
    {isDev && (
      <script>
        import { mount } from "a11y-hud";
        mount({ theme: "auto" });
      </script>
    )}
  </body>
</html>
```

Or with the CDN script tag:

```astro
---
const isDev = import.meta.env.DEV;
---

{isDev && (
  <>
    <script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js" />
    <script>window.A11yHud?.mount({ theme: "auto" });</script>
  </>
)}
```

The vanilla core mounts once and auto-rescans on DOM mutations — it picks up island hydration automatically.

## Path 2 — Adapter inside an island

If you want rescans tied to a specific island's render lifecycle, use the matching framework adapter inside that island:

```tsx
// src/components/DevTools.tsx  (React island)
import { A11yHud } from "@a11y-hud/react";

export default function DevTools() {
  if (!import.meta.env.DEV) return null;
  return <A11yHud theme="auto" />;
}
```

```astro
---
// layouts/BaseLayout.astro
import DevTools from "../components/DevTools.tsx";
---

<body>
  <slot />
  <DevTools client:only="react" />
</body>
```

Use `client:only` so the HUD never renders server-side.

## Which path to use?

| Situation | Recommendation |
|-----------|----------------|
| Mostly static Astro pages, few or no islands | Vanilla core in the layout |
| Heavy React/Vue/Svelte app inside Astro | Framework adapter inside the main island |
| Multiple islands of different frameworks | Vanilla core — one HUD for the whole page |

## Limitations

- **Pre-hydration DOM**: axe runs on the live DOM. Static HTML rendered server-side is still valid DOM — violations in static content are caught once the page loads.
- **Island isolation**: If island content is inside a Shadow DOM (unlikely with standard Astro islands), axe may not reach it. Standard Astro islands render into the regular DOM, so there is no issue.

## Rescanning after island hydration

The vanilla core's `MutationObserver` catches DOM changes from island hydration automatically. No manual rescan is needed. If you need to rescan explicitly (e.g., after a user interaction loads new content), call:

```js
import { mount } from "a11y-hud";

const hud = mount({ theme: "auto" });

// Later, after content loads:
await hud.runScan();
```
