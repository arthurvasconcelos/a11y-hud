# Adapter contribution guide

This document captures the adapter pattern established in `@a11y-hud/react` (0.2). All subsequent adapters — Vue, Angular, Svelte, Solid — must follow the same shape. Read this before starting a new adapter.

---

## The pattern in one sentence

A framework adapter is a thin shell that mounts the `<a11y-hud>` Custom Element imperatively (via `mount()` from core) inside a framework lifecycle hook, triggers a rescan after every render commit, and exposes a typed hook + component to consumers.

---

## Why imperative mount, not declarative JSX/template

Rendering `<a11y-hud>` as a declarative element inside a framework component creates friction:

- React 18: kebab-case attributes don't map to JSX props; DOM properties like `scopeElement` require imperative access anyway.
- Vue / Angular / Svelte: each framework has its own quirks around Custom Element attribute/property bindings.
- The CE registers itself via `customElements.define` when the core module is imported. Declarative usage still works, but the `mount()` helper already handles idempotent creation and initial configuration cleanly.

The imperative approach keeps all adapters consistent and sidesteps per-framework CE binding quirks.

---

## Required exports

Every adapter package must export:

| Export | Description |
|--------|-------------|
| `<A11yHud>` (component) | Wraps `useA11yHud` / equivalent composable, renders nothing into the framework tree |
| `useA11yHud(options)` (hook / composable / service) | Mounts the CE, wires lifecycle, returns `{ runScan, setTheme }` |
| `A11yHudProps` | Type for the component's props |
| `UseA11yHudOptions` | Type for the hook's options |
| `UseA11yHudReturn` | Type for the hook's return value |

---

## Options interface (must match across all adapters)

```typescript
interface UseA11yHudOptions {
  theme?: "auto" | "default" | "light" | "high-contrast";
  scope?: FrameworkScopeType; // React: RefObject<Element | null>; Vue: Element | null (template refs auto-unwrap); Angular/Svelte/Solid: TBD
  autoScan?: boolean;
  debounce?: number;
}

interface UseA11yHudReturn {
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
}
```

**`scope` naming is locked.** Do not use `target`, `root`, `container`, or anything else. Consistency across adapters is load-bearing for the docs site and for consumers who use multiple adapters.

---

## Mount effect

The CE must be created/found via `mount()` from core. Store a reference to the CE element in a framework-appropriate mutable container (a `ref` in React, a `shallowRef` in Vue, etc.):

```typescript
// React example
useEffect(() => {
  const instance = mount({ theme, autoScan, debounce });
  instanceRef.current = instance;
  elementRef.current = document.querySelector<A11yHudElement>("a11y-hud");
  return () => {
    instance.unmount();
    instanceRef.current = null;
    elementRef.current = null;
  };
}, []);
```

`mount()` is idempotent — it reuses an existing `<a11y-hud>` if present. This makes the adapter safe in frameworks with double-invocation semantics (React Strict Mode, etc.).

---

## Render-settled signal

Every adapter must trigger a rescan after the framework's render pipeline has settled. Use the framework's post-render hook:

| Framework | Hook |
|-----------|------|
| React | `useEffect()` with no deps array |
| Vue | `watchEffect()` or `onUpdated()` + `nextTick()` |
| Angular | `ngAfterViewChecked` (run outside NgZone) |
| Svelte | `afterUpdate()` |
| Solid | `createEffect()` after the relevant signal |

The render-settled effect must also sync `scopeElement` before scanning:

```typescript
// Always clear scopeElement when scope becomes undefined — do not guard on `scope !== undefined`
el.scopeElement = scope?.current ?? undefined;
void instance.runScan();
```

---

## Prop sync effects

Keep separate effects for each prop (theme, autoScan, debounce) so they only fire when their specific dep changes. This avoids spurious rescans.

---

## Stable return values

Return `runScan` and `setTheme` as stable references (memoised with the framework's equivalent of `useCallback` with empty deps). Consumers may put these in dependency arrays — unstable references cause infinite effect loops.

---

## Coverage target

Adapter packages have an **80% branch coverage** floor (lower than core's 90% because adapters are thin wrappers). Unit tests should mock `mount()` from core via the test framework's module mock mechanism. E2E tests run against the adapter's example app and must cover:

1. HUD mounts and shows violations on initial load.
2. Scan triggers on route/view change.
3. Prop-driven re-render triggers rescan.
4. Subtree scope works (`scopeElement` is synced and scan is restricted).
5. Disabling scope restores full-page scan.

---

## Package naming

| Package | npm name |
|---------|----------|
| Core | `a11y-hud` (unscoped) |
| React | `@a11y-hud/react` |
| Vue | `@a11y-hud/vue` |
| Angular | `@a11y-hud/angular` |
| Svelte | `@a11y-hud/svelte` |
| Solid | `@a11y-hud/solid` |

The unscoped `a11y-hud` name is intentional — do not rename it `@a11y-hud/core` in any refactor.

---

## Versioning

Each adapter starts at `0.1.0` and is versioned independently by Changesets. When a core change affects the public API surface, all adapters need a changeset bumping their `a11y-hud` dep range.
