# Qwik

There is no dedicated `@a11y-hud/qwik` package. The vanilla core (`a11y-hud`) works directly with Qwik's resumable DOM — with one important trade-off to understand.

## How Qwik's resumable model affects axe

Qwik serializes event listeners to HTML and resumes them lazily. On initial load, interactive elements may not yet have their event handlers attached. axe-core rules that depend on interactive behaviour (e.g., keyboard event handlers for custom widgets) may not fire as expected until the relevant island has resumed.

Rules that inspect DOM structure, ARIA attributes, color contrast, and label associations work correctly at any point.

## Quick start

Use the vanilla core in your root layout:

```tsx
// src/routes/layout.tsx
import { component$ } from "@builder.io/qwik";
import { isDev } from "@builder.io/qwik/build";

export default component$(() => {
  return (
    <>
      <slot />
      {isDev && (
        <script
          dangerouslySetInnerHTML={`
            import('https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js')
              .then(() => window.A11yHud.mount({ theme: 'auto' }));
          `}
          type="module"
        />
      )}
    </>
  );
});
```

Or, if you have a bundler setup that supports npm imports in Qwik:

```ts
// src/entry.dev.ts  (or any dev-only entry point)
import { mount } from "a11y-hud";

if (typeof window !== "undefined") {
  mount({ theme: "auto" });
}
```

## Rescanning after interaction

Because Qwik resumes components lazily, you may want to trigger a manual rescan after the user interacts with a component that was previously un-resumed:

```ts
import { mount } from "a11y-hud";

const hud = mount({ theme: "auto" });

// After a user interaction that resumes a component:
someElement.addEventListener("click", async () => {
  await hud.runScan();
});
```

The HUD's built-in `MutationObserver` catches DOM changes from resumed components automatically. A manual rescan is only needed for violations that depend on interactive event handlers being attached.

## What works well

| Rule category | Works out of the box? |
|---------------|----------------------|
| Color contrast | ✅ Yes |
| ARIA labels, roles, attributes | ✅ Yes |
| Image alt text | ✅ Yes |
| Form label associations | ✅ Yes |
| Landmark regions | ✅ Yes |
| Custom widget keyboard patterns | ⚠️ Only after component resumption |
| Focus management after interaction | ⚠️ Only after component resumption |

## Headless scan for CI

```ts
import { runScan } from "a11y-hud";

// Run structural checks in a Playwright test after page load
const results = await runScan(document.body);
```

For CI integration details, see the [CI integration cookbook](/cookbook/ci-integration).

## Dedicated package

There is currently no `@a11y-hud/qwik` package. The vanilla core covers the primary use case. If community demand surfaces a clear need for deeper integration (e.g., tracking Qwik component resume lifecycle), a dedicated adapter may be added post-1.0.
