# Testing harnesses

## Definition

A **test harness** is a class that encapsulates DOM queries, user interactions and state assertions for a UI region under integration test. It sits between the test and the DOM: the test speaks in the language of the feature ("expand the `image-alt` violation", "toggle the `critical` severity chip"), the harness translates to selectors and events.

A harness maps to a **UI region** (the toolbar, the filter chips, one violation item) and composes into a tree that mirrors what the user sees. It is not a page object for the whole app and not a bare locator.

## When to use

**Every integration test file drives the element through a harness.** Even a test that only reads one attribute goes through `HudHarness` or `HudHostHarness`, so that the next test on the same feature is cheap to write and so that selectors live in one place.

Unit tests of pure helpers (`keyboard.test.ts`, `ignores.test.ts`, …) do not use harnesses; they have no UI.

## Harness inventory

### Core: `packages/core/src/__harnesses__/`

```
HudHarness                      (root; host-level state, panel, FAB, error alert)
├── toolbar       → HudToolbarHarness       copy all / export / re-scan / keyboard mode / minimize
├── filters       → HudFiltersHarness       filter panel toggle; severity, WCAG level and rule-set chips
├── violations    → HudViolationsHarness    the list; getRuleIds(), getCount()
│   └── violation(ruleId) → HudViolationHarness   toggle, detail region, highlight, copy, ignore
├── ignored       → HudIgnoredHarness       the collapsible "Ignored rules" section
└── keyboardView  → HudKeyboardViewHarness  the view shown while keyboard mode is on
```

Create it from the fixture helper, which also appends the element:

```ts
const { el, hud } = mountHudElement({ scope: "#main" });
await hud.awaitReady();
await hud.violations.violation("image-alt").highlightNode();
expect(document.querySelector("[data-a11y-hud-highlighted]")).not.toBeNull();
```

### Adapters: `packages/<adapter>/src/__harnesses__/hud-host.harness.ts`

`HudHostHarness` is document-scoped and deliberately shallow. It exposes the element's public surface (`getThemeAttribute()`, `hasAutoScan()`, `getDebounceAttribute()`, `getRunOnly()`, `getScopeElement()`, `isMounted()`) and the rule ids of the rendered list. It does not reach into the panel: the adapter's job is wiring, and the panel is the core suite's responsibility.

Because axe-core is a singleton that throws if a scan starts while another is in flight, the adapter harness also tracks every `<a11y-hud>` added to the page and waits for their scans to settle before removing them:

```ts
beforeEach(() => hud.track());
afterEach(async () => {
  await hud.cleanup();
});
```

Page fixtures a scan might still be reading (an `<img>`, a scope container) stay attached until after `cleanup()`.

Each adapter has its own copy of this harness. That is deliberate: the pattern is shared, the code is not, so an adapter can diverge without touching the others.

## Naming

| Artifact | Pattern | Example |
| --- | --- | --- |
| Directory | `__harnesses__/` | `packages/core/src/__harnesses__/` |
| File | `{feature}.{area}.harness.ts` | `hud.filters.harness.ts` |
| Class | `{Feature}{Area}Harness` | `HudFiltersHarness` |
| Error class | `{Feature}HarnessError` | `HudHarnessError` |
| Error file | `{feature}.harness.errors.ts` | `hud.harness.errors.ts` |

## Scope model

### Shadow-root scoped (core)

Child harnesses receive a lazy getter for the element's shadow root and bind testing-library queries to it with `withinShadow()`:

```ts
export class HudToolbarHarness {
  constructor(private readonly getRoot: () => ShadowRoot | null) {}

  queryToolbar(): HTMLElement | null {
    const root = this.getRoot();
    if (!root) return null;
    return withinShadow(root).queryByRole("toolbar", { name: "Panel actions" });
  }
}
```

The getter is a function, never a captured element. The panel body is re-rendered on every scan, so any element reference older than the last render is stale.

### Document scoped (adapters)

`HudHostHarness` takes no container and finds the element with `document.querySelector("a11y-hud")`. It is marked `@scope document` in its doc comment.

## Method taxonomy

Every public method falls into exactly one category.

### Query: element discovery

| Prefix | Returns | Throws |
| --- | --- | --- |
| `query*` | `HTMLElement \| null` or `HTMLElement[]` | Never |

- Single-element queries return `null` when absent; collection queries return `[]`. A test can assert presence and absence through the same method.
- Accessibility-first: `queryByRole` with an accessible `name`, then `queryByLabelText`, then `queryByText`. The panel labels every button, group, list and region, so almost everything is reachable by role and name.
- Structural fallbacks (`.violation-rule`, `.kbd-mode-view`, `root.getElementById(bodyId)`) are allowed only for containers without a role or for scoping a subsequent query. They are the exception and the reason is stated in a comment.

```ts
queryRescanButton(): HTMLElement | null {
  return this.queryButton("Re-scan page");
}

queryDetail(): HTMLElement | null {
  const item = this.getItem();
  if (!item) return null;
  return within(item).queryByRole("region", { name: `${this.ruleId} details` });
}
```

### Get: computed state reads

| Prefix | Returns | Throws |
| --- | --- | --- |
| `get*`, `is*`, `has*` | `boolean`, `string`, `number`, structured value | If a precondition element is missing |

```ts
isScanning(): boolean {
  return this.queryRescanButton()?.hasAttribute("data-scanning") ?? false;
}

getRuleIds(): string[] {
  return this.queryItems().map((item) => this.ruleIdOf(item));
}
```

Where the element exposes both an ARIA state and a CSS hook for the same thing, the harness exposes both and names them distinctly: `isToggleExpanded()` reads `aria-expanded`, `isOpen()` reads `data-open`.

### Assert: state validation

| Prefix | Returns | Throws |
| --- | --- | --- |
| `assert*` | `void` | Always on mismatch |

Most assertions in this repo are made in the test with `expect()` against a `get*` or `query*` result, because Vitest's matcher output is the best diagnostic available. Add an `assert*` method only for a domain comparison a matcher cannot describe. If you do, a missing precondition throws `HudHarnessError` *before* the comparison, never around a matcher.

### Action: user interaction

| Prefix | Returns | Throws |
| --- | --- | --- |
| Domain verbs: `toggle*`, `expand`, `collapse`, `highlightNode`, `copy`, `ignore`, `rescan`, `minimize`, `pressKey` | `Promise<void>` | If the target element is missing |

- Always `async`, even for a single click, so that stabilization can be added later without changing call sites.
- Interactions use the element's own event model: `button.click()`, `dispatchEvent(new KeyboardEvent("keydown", …))`. The element binds listeners inside its shadow root, so synthetic events delivered to the right node are faithful.
- Actions that trigger a scan stabilize before returning (see below).

```ts
async rescan(): Promise<void> {
  this.click(this.queryRescanButton(), "Re-scan");
  await this.awaitScanSettled();
}
```

## Error handling

One error class per feature: `HudHarnessError` for the core harness tree, `HudHostHarnessError` for each adapter harness. Never `new Error()` in a harness.

```ts
throw new HudHarnessError(this.harnessName, "Highlight button not found", {
  ruleId: this.ruleId,
  nodeIndex,
  available: this.queryHighlightButtons().length,
});
```

The `context` argument is required. Stack traces point at the throw site inside the harness, not at the test line, so the message has to carry what the test was doing. Pass `{}` when there is genuinely nothing to add.

## Composition

- **The tree follows the UI, not the source.** `hud.violations.violation("image-alt").queryIgnoreButton()` reads like a user navigating the panel.
- **Fixed children are created eagerly** in the root constructor (`toolbar`, `filters`, …).
- **Dynamic children are cached by key**: `violation(ruleId)` keeps a `Map` so repeated calls return the same harness, whose lazy getter re-finds the item after every re-render.
- **No inheritance between feature harnesses.** Composition only.

## Stabilization

The element renders synchronously on connection but scans asynchronously, and every scan re-renders the panel body. Tests never call `vi.waitFor` themselves; the harness owns the waiting.

| Method | Resolves when |
| --- | --- |
| `hud.awaitPanel()` | The panel has rendered (before any scan result) |
| `hud.awaitReady()` | The first scan has settled into a list, the "No violations found" state, or an error alert |
| `hud.toolbar.awaitScanSettled()` | The re-scan button is no longer flagged `data-scanning` |
| `violation.expand()` | The detail region has opened |
| `hud.ignored.open()` | The section body has opened |
| `hud.filters.toggleRuleSet()`, `hud.toolbar.rescan()` | The scan they trigger has settled |
| `hudHost.awaitReady()` (adapters) | A real axe-core scan has settled |
| `hudHost.awaitIdle()` (adapters) | No tracked element has a scan in flight |

Waits are strict: they throw a `HudHarnessError` on timeout and nothing swallows it. A test that wants to observe a "not yet settled" state (for example clicking a chip before the first scan resolves) awaits `awaitPanel()` instead of `awaitReady()`.

Tests that need to count scans spy on the boundary, not on the harness: `axeRun.mock.calls.length` in core, `vi.spyOn(A11yHudElement.prototype, "runScan")` in adapters.

## Fixtures: `packages/core/src/__fixtures__/`

| File | Purpose |
| --- | --- |
| `axe-results.ts` | `mockNode()`, `mockViolation()`, `mockAxeResults()`: pure builders, sensible defaults, overrides spread last, typed against axe-core |
| `axe-core.mock.ts` | The module mock. Register with `vi.mock("axe-core", () => import("./__fixtures__/axe-core.mock.js"))` and drive `axeRun` |
| `hud-element.ts` | `mountHudElement(attributes)` returns `{ el, hud }`; `removeHudElements()` also clears the styles the element injects into the host page |

Use `axeRun.mockResolvedValue(...)` rather than `mockResolvedValueOnce(...)` for a test's scenario. A previous test's element may still have a scan in flight when yours mounts, and a one-shot value can be consumed by it.

## Anti-patterns

| Don't | Do instead |
| --- | --- |
| `el.shadowRoot?.querySelector(".btn-x")?.click()` in a test | Add or use a harness action |
| `vi.waitFor(...)` in a test | Add or use a harness stabilization method |
| `new Error("...")` in a harness | `new HudHarnessError(name, message, context)` |
| `try { } catch { }` around a query or wait | Let it throw; the harness exists to report it |
| Capturing an element in a constructor | Lazy getter: `() => this.queryRoot()` |
| CSS class selectors for interactive elements | `queryByRole` with the accessible name |
| A harness in an adapter that reads panel internals | Keep `HudHostHarness` on the element's public surface |
| A shared harness package imported by every adapter | One small copy per adapter |
| `axeRun.mockResolvedValueOnce(...)` as the test's scenario | `axeRun.mockResolvedValue(...)` |
| Removing a scope container or page fixture before scans settle | Keep it attached until `await hud.cleanup()` |
