---
url: /a11y-hud/guide/qwik.md
---
# Qwik

There is no dedicated `@a11y-hud/qwik` package. The vanilla core (`a11y-hud`) works directly with Qwik's resumable DOM — with one important trade-off to understand.

## How Qwik's resumable model affects axe

Qwik serializes event listeners to HTML and resumes them lazily. On initial load, interactive elements may not yet have their event handlers attached. axe-core rules that depend on interactive behaviour (e.g., keyboard event handlers for custom widgets) may not fire as expected until the relevant island has resumed.

Rules that inspect DOM structure, ARIA attributes, color contrast, and label associations work correctly at any point.

## Quick start

Use the vanilla core in your root layout:

```tsx [src/routes/layout.tsx]
import { component$, Slot } from "@builder.io/qwik";
import { isDev } from "@builder.io/qwik/build";

export default component$(() => {
  return (
    <>
      <Slot />
      {isDev && (
        <>
          <script src="https://cdn.jsdelivr.net/npm/a11y-hud/dist/index.umd.js" />
          <script
            dangerouslySetInnerHTML={`window.A11yHud.mount({ theme: 'auto' });`}
          />
        </>
      )}
    </>
  );
});
```

The UMD bundle is a classic script that sets `window.A11yHud`; it is not an ES module, so load it with a `<script src>` tag rather than `import()`.

Or, if you have a bundler setup that supports npm imports in Qwik, add it to any dev-only entry point:

```ts [src/entry.dev.ts]
import { mount } from "a11y-hud";

if (typeof window !== "undefined") {
  mount({ theme: "auto" });
}
```

## Server-side rendering

Qwik City renders on the server first. Importing `a11y-hud` there is safe: the Custom Element is only registered when `customElements` exists, and `mount()` is the only thing that touches the DOM. Keep the `mount()` call behind a browser check (as above) or inside a `useVisibleTask$`, and nothing is rendered server-side.

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
// Inside page.evaluate() in a Playwright test, after page load
const { runScan } = await import("/node_modules/a11y-hud/dist/index.js");
const results = await runScan(document.body);
```

For CI integration details, see the [CI integration cookbook](/cookbook/ci-integration).

## Dedicated package

There is currently no `@a11y-hud/qwik` package. The vanilla core covers the primary use case. If community demand surfaces a clear need for deeper integration (e.g., tracking Qwik component resume lifecycle), a dedicated adapter may be added in a future release.
