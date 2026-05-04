# API Reference

## Core (`a11y-hud`)

### `mount(options?)`

Mounts the `<a11y-hud>` Custom Element and returns an instance for runtime control. If a `<a11y-hud>` element already exists in the document, it is reused.

```ts
function mount(options?: MountOptions): A11yHudInstance
```

**`MountOptions`**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `Theme` | `"auto"` | Visual theme. `"auto"` respects `prefers-color-scheme` and promotes to `"high-contrast"` when `prefers-contrast: more` is set. |
| `scope` | `string \| Element` | `document.body` | CSS selector or `Element` to restrict axe scans to a subtree. |
| `autoScan` | `boolean` | `true` | Attach a `MutationObserver` that rescans when the DOM changes. |
| `debounce` | `number` | `500` | Milliseconds to debounce auto-scan triggers. |
| `runOnly` | `string[]` | `[]` | Restrict axe to specific rule-set tags (e.g. `["wcag2a", "wcag2aa"]`). Empty array runs all rules. |

---

### `A11yHudInstance` {#a11yhudinstance}

Returned by `mount()` and by all framework adapter hooks/composables.

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

| Method | Description |
|--------|-------------|
| `unmount()` | Removes the `<a11y-hud>` element from the DOM. |
| `setTheme(theme)` | Switches the active theme at runtime. |
| `setRunOnly(tags)` | Changes which axe rule-set tags are active. |
| `runScan()` | Triggers a manual scan. Returns the raw axe results. |
| `exportResults()` | Returns the most recent scan as a JSON string (or `null` if no scan has run yet). |
| `ignores.add(ruleId, selector?)` | Adds a rule (or rule + selector) to the ignore list and triggers a rescan. Persisted to `localStorage`. |
| `ignores.remove(ruleId, selector?)` | Removes a specific ignore entry and triggers a rescan. |
| `ignores.clear()` | Clears all ignores and triggers a rescan. |
| `ignores.list()` | Returns the current `IgnoreEntry[]`. |
| `ignores.exportJson()` | Returns the ignore list as a JSON string. |
| `ignores.importJson(json)` | Replaces the ignore list with the parsed JSON and triggers a rescan. |

---

### `runScan(target?, runOnly?)`

Runs an axe-core scan without rendering any UI. Concurrent calls are serialized — a second call waits for the first to finish.

```ts
function runScan(
  target?: Element,       // default: document.body
  runOnly?: string[]      // axe rule tags
): Promise<AxeResults>
```

---

### `generateBookmarklet(version?)`

Returns a `javascript:` URL that loads the UMD bundle from jsDelivr and calls `window.A11yHud.mount()`.

```ts
function generateBookmarklet(version?: string): string
// version defaults to "latest"
```

---

### Ignore-rules headless API

These functions read/write the same `localStorage` key (`a11y-hud:ignores`) as the HUD panel, so headless scripts and the UI share a single ignore list.

```ts
import {
  addIgnore,
  removeIgnore,
  clearIgnores,
  listIgnores,
  exportIgnores,
  importIgnores,
} from "a11y-hud";

addIgnore(ruleId: string, selector?: string): void
removeIgnore(ruleId: string, selector?: string): void
clearIgnores(): void
listIgnores(): IgnoreEntry[]
exportIgnores(): string      // JSON string
importIgnores(json: string): void
```

---

### Keyboard mode helpers

```ts
import {
  getFocusableElements,
  injectFocusOrderOverlay,
  detectKeyboardViolations,
} from "a11y-hud";
```

**`getFocusableElements(scope)`**

Returns all focusable elements in `scope`, sorted by tab order (positive `tabindex` values first, then natural document order).

```ts
function getFocusableElements(scope: Element): FocusableElementInfo[]

interface FocusableElementInfo {
  element: Element;
  index: number;       // 1-based tab position
  selector: string;    // generated CSS selector
  tabIndex: number;    // resolved tabIndex value
}
```

**`injectFocusOrderOverlay(elements)`**

Injects numbered badge overlays onto the page showing each element's tab position. Badges use page-relative absolute positioning so they remain stable during scroll.

```ts
function injectFocusOrderOverlay(elements: FocusableElementInfo[]): void
```

**`detectKeyboardViolations(elements, scope?)`**

Checks a focusable element list for common keyboard navigation issues. `elements` is the output of `getFocusableElements`. `scope` defaults to `document.body` and is used to find interactive elements excluded from the tab order via `tabindex="-1"`.

```ts
function detectKeyboardViolations(
  elements: FocusableElementInfo[],
  scope?: Element
): KeyboardViolation[]

interface KeyboardViolation {
  type: "positive-tabindex" | "interactive-excluded" | "no-focusable-elements";
  element?: Element;
  selector?: string;
  message: string;
}
```

Violation types:
- `positive-tabindex` — element has `tabindex` > 0, which breaks natural tab order.
- `interactive-excluded` — an interactive element has `tabindex="-1"`, removing it from keyboard navigation.
- `no-focusable-elements` — the scope contains no focusable elements at all.

---

### `A11yHudElement`

The underlying Custom Element class. Exported for advanced use (e.g., type narrowing after `querySelector`).

```ts
import { A11yHudElement } from "a11y-hud";

const el = document.querySelector("a11y-hud") as A11yHudElement;
el.setTheme("github-dark");
el.runScan();
```

---

### Types

```ts
type Theme =
  | "auto"
  | "default"
  | "light"
  | "high-contrast"
  | "github-dark"
  | "github-light"
  | "tokyo-night"
  | "solarized-dark";

type ResolvedTheme = Exclude<Theme, "auto">;

type Severity = "minor" | "moderate" | "serious" | "critical";

interface IgnoreEntry {
  ruleId: string;
  selector?: string;
}

interface A11yHudExport {
  version: "1";
  timestamp: string;     // ISO 8601
  url: string;           // window.location.href at scan time
  scope: string;         // selector or "document.body"
  results: AxeResults;   // raw axe-core results object
}
```

---

## `@a11y-hud/react`

### `<A11yHud>`

Mounts the HUD inside a React tree. Props are identical to `UseA11yHudOptions`.

```tsx
import { A11yHud } from "@a11y-hud/react";

<A11yHud theme="auto" scope={ref} autoScan debounce={300} />
```

### `useA11yHud(options)`

```ts
function useA11yHud(options?: UseA11yHudOptions): UseA11yHudReturn
```

**`UseA11yHudOptions`**

```ts
interface UseA11yHudOptions {
  theme?: Theme;
  scope?: RefObject<Element | null>;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}
```

---

## `@a11y-hud/vue`

### `<A11yHud>`

```vue
<A11yHud theme="auto" :scope="templateRef" />
```

### `useA11yHud(options)`

```ts
function useA11yHud(options?: UseA11yHudOptions): UseA11yHudReturn
```

**`UseA11yHudOptions`**

```ts
interface UseA11yHudOptions {
  theme?: Theme;
  scope?: Ref<Element | null>;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}
```

---

## `@a11y-hud/angular`

### `A11yHudComponent`

Selector: `a11y-hud-angular`. Standalone component.

```html
<a11y-hud-angular [theme]="'auto'" [scope]="viewChildRef" />
```

### `A11yHudService`

Injectable service. Call `mount(options)` in `ngOnInit` / `ngAfterViewInit`.

```ts
interface ScopeInput = ElementRef<Element> | Element | null | undefined;

interface UseA11yHudOptions {
  theme?: Theme;
  scope?: ScopeInput;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}
```

---

## `@a11y-hud/svelte`

### `<A11yHud>`

```svelte
<A11yHud theme="auto" scope={element} />
```

### `useA11yHud(getOptions)`

Accepts a getter function — required for Svelte 5 `$effect` reactivity.

```ts
function useA11yHud(getOptions: () => UseA11yHudOptions): UseA11yHudReturn
```

**`UseA11yHudOptions`**

```ts
interface UseA11yHudOptions {
  theme?: Theme;
  scope?: Element | null;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}
```

---

## `@a11y-hud/solid`

### `<A11yHud>`

```tsx
<A11yHud theme="auto" scope={element} />
```

### `createA11yHud(options)` {#createa11yhudreturn}

```ts
function createA11yHud(options?: CreateA11yHudOptions): CreateA11yHudReturn
```

For reactive options, use getter properties so Solid's `createEffect` tracks them:

```ts
const hud = createA11yHud({
  get theme() { return themeSignal(); },
});
```

**`CreateA11yHudOptions`**

```ts
interface CreateA11yHudOptions {
  theme?: Theme;
  scope?: Element | null;
  autoScan?: boolean;
  debounce?: number;
  runOnly?: string[];
}
```

---

## `UseA11yHudReturn` {#useahudreturn}

All framework adapters (React, Vue, Angular, Svelte, Solid) return this shape from their hook / composable / service:

```ts
interface UseA11yHudReturn {
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

Note: `unmount()` is intentionally omitted from adapters — the adapter lifecycle handles cleanup when the component unmounts.
