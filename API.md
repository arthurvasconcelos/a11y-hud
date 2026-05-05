# a11y-hud Public API Surface — 1.0 Freeze Review

This document lists every exported symbol, Custom Element attribute, theme name, CSS custom property, event name, localStorage key, and UMD global across all six published packages.

**Owner action required:** read end-to-end and approve before tagging `1.0.0-rc1`. Any questionable names should be renamed _now_ — renaming after 1.0 is a semver-breaking change.

Issues found during inventory are marked **⚠ Review** and grouped at the bottom.

---

## Package index

| Package | npm name | Current version |
|---------|----------|----------------|
| Core | `a11y-hud` | 0.4.1 |
| React adapter | `@a11y-hud/react` | 0.5.1 |
| Vue adapter | `@a11y-hud/vue` | 0.5.1 |
| Angular adapter | `@a11y-hud/angular` | 0.4.1 |
| Svelte adapter | `@a11y-hud/svelte` | 0.4.1 |
| Solid adapter | `@a11y-hud/solid` | 0.4.1 |

---

## `a11y-hud` (core)

### Exported functions

| Symbol | Signature | Notes |
|--------|-----------|-------|
| `mount` | `(options?: MountOptions) => A11yHudInstance` | Mounts or reuses `<a11y-hud>`; returns instance |
| `runScan` | `(target?: Element, runOnly?: string[]) => Promise<AxeResults>` | Headless scan; serializes concurrent calls |
| `generateBookmarklet` | `(version?: string) => string` | Returns `javascript:` URL; version defaults to `"latest"` |
| `addIgnore` | `(ruleId: string, selector?: string) => void` | Appends to localStorage ignore list |
| `removeIgnore` | `(ruleId: string, selector?: string) => void` | Removes matching entry |
| `clearIgnores` | `() => void` | Wipes entire ignore list |
| `listIgnores` | `() => IgnoreEntry[]` | Returns current list |
| `exportIgnores` | `() => string` | Returns JSON string of ignore list |
| `importIgnores` | `(json: string) => void` | Replaces list from JSON string |
| `getFocusableElements` | `(scope: Element) => FocusableElementInfo[]` | Tab-order-sorted focusable element list |
| `injectFocusOrderOverlay` | `(elements: FocusableElementInfo[]) => () => void` | Injects numbered badges; returns cleanup function |
| `detectKeyboardViolations` | `(elements: FocusableElementInfo[], scope?: Element) => KeyboardViolation[]` | Detects 3 keyboard-navigation violation types |

### Exported classes

| Symbol | Notes |
|--------|-------|
| `A11yHudElement` | The Custom Element class; exported for type narrowing via `querySelector` |

**`A11yHudElement` public surface:**

| Member | Signature | Notes |
|--------|-----------|-------|
| `static observedAttributes` | `string[]` | `["theme", "scope", "auto-scan", "debounce", "run-only"]` |
| `scopeElement` getter | `() => Element \| undefined` | Programmatically set scope element |
| `scopeElement` setter | `(el: Element \| undefined) => void` | Sets scope element directly; clears `scope` attribute |
| `setTheme(theme)` | `(Theme) => void` | Switches theme and updates attribute |
| `setRunOnly(tags)` | `(string[]) => void` | Updates active rule-set tags |
| `runScan()` | `() => Promise<AxeResults>` | Triggers a scan; serialized vs. concurrent |
| `exportResults()` | `() => string \| null` | Returns last scan as JSON string |

### Custom Element: `<a11y-hud>`

Registered at: `customElements.define("a11y-hud", A11yHudElement)`.

**Observed attributes (public API, frozen at 1.0):**

| Attribute | Values | Default | Notes |
|-----------|--------|---------|-------|
| `theme` | `Theme` string | `"auto"` | Visual theme |
| `scope` | CSS selector string | — | Restricts scan subtree; clears the programmatic scopeElement |
| `auto-scan` | Presence attribute | present (enabled) | Present = enabled, absent = disabled |
| `debounce` | Integer (ms) | `500` | Auto-scan debounce interval |
| `run-only` | JSON-serialized `string[]` | `[]` | Active axe rule-set tags; empty array = run all |

**Internal state attributes (set by the element itself, not consumed by consumers):**

| Attribute | Purpose |
|-----------|---------|
| `data-minimized` | Panel is in FAB/minimized state |
| `data-theme` | Resolved theme value written to `dataset.theme` by element internals |

### Exported types

| Symbol | Definition |
|--------|-----------|
| `Theme` | `"auto" \| "default" \| "light" \| "high-contrast" \| "github-dark" \| "github-light" \| "tokyo-night" \| "solarized-dark"` |
| `ResolvedTheme` | `Exclude<Theme, "auto">` — the 7 concrete theme values |
| `Severity` | `"minor" \| "moderate" \| "serious" \| "critical"` |
| `MountOptions` | `{ theme?, scope?, autoScan?, debounce?, runOnly? }` (see full definition below) |
| `A11yHudInstance` | Return type of `mount()` and all adapter hooks/composables |
| `A11yHudExport` | Shape of the JSON export blob |
| `IgnoreEntry` | `{ ruleId: string; selector?: string }` |
| `FocusableElementInfo` | `{ element: Element; index: number; selector: string; tabIndex: number }` |
| `KeyboardViolation` | `{ type: "positive-tabindex" \| "interactive-excluded" \| "no-focusable-elements"; element?: Element; selector?: string; message: string }` |
| `AxeResults` | Re-export from `axe-core` |

**`MountOptions` full definition:**

```ts
interface MountOptions {
  theme?: Theme;
  scope?: string | Element;    // CSS selector string OR Element reference
  autoScan?: boolean;          // default true
  debounce?: number;           // default 500
  runOnly?: string[];          // default [] (run all)
}
```

**`A11yHudInstance` full definition:**

```ts
interface A11yHudInstance {
  unmount(): void;
  setTheme(theme: Theme): void;
  setRunOnly(tags: string[]): void;
  runScan(): Promise<AxeResults>;
  exportResults(): string | null;
  ignores: {
    add(ruleId: string, selector?: string): void;
    remove(ruleId: string, selector?: string): void;
    clear(): void;
    list(): IgnoreEntry[];
    exportJson(): string;
    importJson(json: string): void;
  };
}
```

**`A11yHudExport` full definition:**

```ts
interface A11yHudExport {
  version: "1";          // string literal — frozen at "1" for 1.0
  timestamp: string;     // ISO 8601
  url: string;           // window.location.href at scan time
  scope: string;         // selector string or "document.body"
  results: AxeResults;   // raw axe-core results object
}
```

---

## `@a11y-hud/react`

### Exported components

| Symbol | Notes |
|--------|-------|
| `A11yHud` | React component; props shape is `UseA11yHudOptions` |

### Exported hooks

| Symbol | Signature |
|--------|-----------|
| `useA11yHud` | `(options?: UseA11yHudOptions) => UseA11yHudReturn` |

### Exported types

| Symbol | Definition |
|--------|-----------|
| `UseA11yHudOptions` | `{ theme?, scope?: RefObject<Element \| null>, autoScan?, debounce?, runOnly? }` |
| `A11yHudProps` | Type alias for `UseA11yHudOptions` |
| `UseA11yHudReturn` | `{ runScan, setTheme, setRunOnly, exportResults, ignores }` (see shared shape below) |

---

## `@a11y-hud/vue`

### Exported components

| Symbol | Notes |
|--------|-------|
| `A11yHud` | Vue 3 component; props shape is `UseA11yHudOptions` |

### Exported composables

| Symbol | Signature |
|--------|-----------|
| `useA11yHud` | `(options?: UseA11yHudOptions) => UseA11yHudReturn` |

### Exported types

| Symbol | Definition |
|--------|-----------|
| `UseA11yHudOptions` | `{ theme?, scope?: Element \| null, autoScan?, debounce?, runOnly? }` |
| `A11yHudProps` | Type alias for `UseA11yHudOptions` |
| `UseA11yHudReturn` | `{ runScan, setTheme, setRunOnly, exportResults, ignores }` (see shared shape below) |

> **Note:** The `scope` prop accepts `Element | null`. When using the component, pass a Vue template ref directly (`:scope="myRef"`) — Vue templates auto-unwrap refs in attribute bindings. When using the composable directly, pass `myRef.value` or use a getter: `useA11yHud({ get scope() { return myRef.value } })`.

---

## `@a11y-hud/angular`

### Exported components

| Symbol | Notes |
|--------|-------|
| `A11yHudComponent` | Angular standalone component; selector `a11y-hud-angular` |

**`A11yHudComponent` inputs:**

| Input | Type |
|-------|------|
| `@Input() theme` | `Theme \| undefined` |
| `@Input() scope` | `ScopeInput` (`ElementRef<Element> \| Element \| null \| undefined`) |
| `@Input() autoScan` | `boolean \| undefined` |
| `@Input() debounce` | `number \| undefined` |
| `@Input() runOnly` | `string[] \| undefined` |

### Exported services

| Symbol | Notes |
|--------|-------|
| `A11yHudService` | Injectable; `mount(options)` returns `UseA11yHudReturn` |

### Exported types

| Symbol | Definition |
|--------|-----------|
| `UseA11yHudOptions` | `{ theme?, scope?: ScopeInput, autoScan?, debounce?, runOnly? }` |
| `A11yHudProps` | Type alias for `UseA11yHudOptions` |
| `ScopeInput` | `ElementRef<Element> \| Element \| null \| undefined` |
| `UseA11yHudReturn` | `{ runScan, setTheme, setRunOnly, exportResults, ignores }` (see shared shape below) |

---

## `@a11y-hud/svelte`

### Exported components

| Symbol | Notes |
|--------|-------|
| `A11yHud` | Svelte 5 component (`.svelte` file); props shape is `UseA11yHudOptions` |

### Exported hooks

| Symbol | Signature |
|--------|-----------|
| `useA11yHud` | `(getOptions?: () => UseA11yHudOptions) => UseA11yHudReturn` |

> **Note:** `useA11yHud` accepts a getter function, not a plain options object. This is required for Svelte 5 `$effect` reactivity — reactive `$props()` values are tracked only when read inside the closure during effect execution.

### Exported types

| Symbol | Definition |
|--------|-----------|
| `UseA11yHudOptions` | `{ theme?, scope?: Element \| null, autoScan?, debounce?, runOnly? }` |
| `A11yHudProps` | Type alias for `UseA11yHudOptions` |
| `UseA11yHudReturn` | `{ runScan, setTheme, setRunOnly, exportResults, ignores }` (see shared shape below) |

---

## `@a11y-hud/solid`

### Exported components

| Symbol | Notes |
|--------|-------|
| `A11yHud` | Solid component; props shape is `CreateA11yHudOptions` |

### Exported primitives

| Symbol | Signature |
|--------|-----------|
| `createA11yHud` | `(options?: CreateA11yHudOptions) => CreateA11yHudReturn` |

> **Note:** Named `createA11yHud` following Solid's `create*` reactive primitive convention. Component is still named `A11yHud` for consistency with other adapters.

### Exported types

| Symbol | Definition |
|--------|-----------|
| `CreateA11yHudOptions` | `{ theme?, scope?: Element \| null, autoScan?, debounce?, runOnly? }` |
| `A11yHudProps` | Type alias for `CreateA11yHudOptions` |
| `CreateA11yHudReturn` | `{ runScan, setTheme, setRunOnly, exportResults, ignores }` (see shared shape below) |

---

## Shared return shape

All five adapters return this shape from their hook / composable / service. `unmount()` is intentionally absent — adapters handle teardown via their framework lifecycle.

```ts
// React / Vue / Angular / Svelte: UseA11yHudReturn
// Solid: CreateA11yHudReturn
{
  runScan(): Promise<AxeResults>;
  setTheme(theme: Theme): void;
  setRunOnly(tags: string[]): void;
  exportResults(): string | null;
  ignores: {
    add(ruleId: string, selector?: string): void;
    remove(ruleId: string, selector?: string): void;
    clear(): void;
    list(): IgnoreEntry[];
    exportJson(): string;
    importJson(json: string): void;
  };
}
```

---

## Theme names (all 8 frozen at 1.0)

| Name | Style | Notes |
|------|-------|-------|
| `"auto"` | Follows `prefers-color-scheme` | Default when no theme specified; promotes to `"high-contrast"` when `prefers-contrast: more` |
| `"default"` | Dark (Catppuccin Mocha) | Dark fallback for `"auto"` |
| `"light"` | Light (Catppuccin Latte) | Light fallback for `"auto"` |
| `"high-contrast"` | Black/white, WCAG AAA | Triggered by OS high-contrast mode |
| `"github-dark"` | GitHub dark mode | |
| `"github-light"` | GitHub light mode | |
| `"tokyo-night"` | Tokyo Night editor theme | |
| `"solarized-dark"` | Solarized Dark | |

Renaming or removing any of these after 1.0 is a breaking change.

---

## CSS custom properties (all 17 frozen at 1.0)

All properties are declared on `:host` (the `<a11y-hud>` element). Custom properties pierce the Shadow DOM boundary — consumers can override any of these from the host page's CSS.

### Color tokens

| Property | Default (dark) | Description |
|----------|----------------|-------------|
| `--a11y-hud-bg` | `#1e1e2e` | Panel background |
| `--a11y-hud-bg-elevated` | `#313244` | Elevated surfaces (header, filter area) |
| `--a11y-hud-bg-hover` | `#45475a` | Hover state background |
| `--a11y-hud-border` | `#45475a` | Border color |
| `--a11y-hud-text` | `#cdd6f4` | Primary text |
| `--a11y-hud-text-muted` | `#a6adc8` | Secondary / muted text |
| `--a11y-hud-critical` | `#f38ba8` | Critical severity (red family) |
| `--a11y-hud-serious` | `#fab387` | Serious severity (orange family) |
| `--a11y-hud-moderate` | `#f9e2af` | Moderate severity (yellow family) |
| `--a11y-hud-minor` | `#89b4fa` | Minor severity (blue family) |
| `--a11y-hud-highlight` | `#cba6f7` | WCAG-level filter chip accent (purple) |
| `--a11y-hud-tag` | `#94e2d5` | Rule-set filter chip accent (teal) |
| `--a11y-hud-focus-ring` | `#89b4fa` | Keyboard focus ring color |

### Layout tokens

| Property | Default | Description |
|----------|---------|-------------|
| `--a11y-hud-radius` | `8px` | Border radius for panel and chips |
| `--a11y-hud-font` | `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace` | Font family |
| `--a11y-hud-z-index` | `999999` | z-index for the floating panel |
| `--a11y-hud-panel-width` | `380px` | Panel width |

Renaming or removing any of these after 1.0 is a breaking change.

---

## Custom DOM events

**None.** The `<a11y-hud>` element dispatches no custom events. All programmatic state is surfaced through the `A11yHudInstance` / `UseA11yHudReturn` API.

---

## UMD globals

| Global | Package | Bundle path |
|--------|---------|-------------|
| `window.A11yHud` | `a11y-hud` | `dist/index.umd.js` |

Framework adapter packages do not ship UMD bundles. Their consumers use npm.

---

## localStorage keys

| Key | Purpose |
|-----|---------|
| `a11y-hud:ignores` | Serialized `IgnoreEntry[]` (the ignore-rules list) |

This key is part of the public API. Headless scripts can read/write it directly, or use the exported `addIgnore` / `exportIgnores` / `importIgnores` functions.

---

## Issues found during inventory

These items need owner decision before the 1.0 tag.

### ⚠ Doc bug: `injectFocusOrderOverlay` return type

**Location:** `docs/reference/api.md`

**Current docs say:**
```ts
function injectFocusOrderOverlay(elements: FocusableElementInfo[]): void
```

**Actual source return type:**
```ts
export function injectFocusOrderOverlay(elements: FocusableElementInfo[]): () => void
```

The function returns a cleanup function that removes the overlay and its injected style element. The docs are wrong. This will be fixed in the same PR as this document.

### ⚠ Doc bug: Vue `scope` type in API reference

**Location:** `docs/reference/api.md` (Vue section)

**Current docs say:**
```ts
interface UseA11yHudOptions {
  scope?: Ref<Element | null>;
}
```

**Actual types file says:**
```ts
interface UseA11yHudOptions {
  scope?: Element | null;
}
```

The prop accepts `Element | null`, not a `Ref`. The guide example (`:scope="appRoot"`) works because Vue templates auto-unwrap refs in attribute bindings. But the type definition in the API reference is misleading for users who call the composable directly.

**Recommendation:** fix the API reference to show `Element | null` and add a note that Vue templates auto-unwrap template refs. This will be fixed in the same PR.

### ✅ Fixed: `_getScopeTarget()` missing error boundary

**Location:** `packages/core/src/element.ts`, `_getScopeTarget()` method

`document.querySelector` throws a `DOMException` for syntactically invalid CSS selectors. The `findElement` helper (used in the highlight path) already had a try/catch, but `_getScopeTarget` did not. Fixed in the same commit as this document — malformed selectors now silently fall back to `document.body`.

### ✅ Fixed: Node selector HTML-escaped in violation template

**Location:** `packages/core/src/element.ts`, `_renderViolationItem()` method

Node selectors (derived from axe-core's `node.target` array) were previously inserted into the panel's Shadow DOM without escaping. While this posed no real attack risk (dev tool + Shadow DOM isolation), it was inconsistent with the keyboard view which already calls `escapeHtml`. Fixed in the same commit — `escapeHtml(selector)` is now applied in violation items, matching the keyboard view behavior.

---

## Summary for owner

All names, types, and defaults look consistent and sound. No renames are needed before 1.0.

All four items above were fixed in the same commit as this document:
- Doc bugs (items 1 and 2) corrected in `docs/reference/api.md` and `docs/guide/vue.md`.
- Robustness fixes (items 3 and 4) applied in `packages/core/src/element.ts`.

**Approval action:** read this document end-to-end and confirm the API surface as listed. Once confirmed, the next step is to tag `1.0.0-rc1` — see the RC tagging instructions in the commit message or the release playbook.
