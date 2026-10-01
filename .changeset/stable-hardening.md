---
"a11y-hud": patch
"@a11y-hud/react": patch
"@a11y-hud/vue": patch
"@a11y-hud/angular": patch
"@a11y-hud/svelte": patch
"@a11y-hud/solid": patch
---

Pre-1.0 hardening:

- Importing `a11y-hud` (and every adapter) no longer throws outside a browser. The Custom Element is only registered when a `CustomElementRegistry` exists, so SSR frameworks (Next.js, Nuxt, SvelteKit, Analog) can import the adapters in server-rendered components; `customElements.define` is also guarded against double registration.
- A failing `axe.run` now renders a "Scan failed" state in the panel instead of leaving the spinner forever, and the public `runScan()` promise rejects with the original error.
- `runScan()` on the element returns the in-flight promise when a scan is already running instead of a fake empty result. Adapter `runScan()` is typed `Promise<AxeResults | null>`; `null` means the HUD has not mounted yet.
- Changing `scope` at runtime re-targets the MutationObserver, and a runtime `debounce` change is honoured by the live observer.
- The Vue and Svelte `<A11yHud>` components now accept the `runOnly` prop like the other adapters.
- Dropped the CommonJS build from `a11y-hud`, `@a11y-hud/react`, `@a11y-hud/vue` and `@a11y-hud/solid`. All packages ship ESM only; the UMD bundle for CDN use is unchanged. `a11y-hud` declares `sideEffects: true` explicitly.
- `@a11y-hud/svelte` is built with `@sveltejs/package`: the published type declarations now resolve, and the `svelte` export condition points at uncompiled source.
- `@a11y-hud/angular` publishes the ng-packagr output directory directly, removing the conflicting export-condition warnings.
