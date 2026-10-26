# Testing strategy

Each test layer answers a different question. Knowing the boundaries keeps tests from duplicating each other and makes sure each layer catches what the others cannot.

- **Static checks** ask: _"Does our code still match the contracts it depends on?"_ TypeScript and Biome catch structural drift at compile time, before any test runs.
- **Unit tests** ask: _"Does this isolated piece of logic handle all its edge cases?"_ They are reserved for pure helpers with many input combinations.
- **Integration tests** ask: _"Does this feature behave correctly given this scan result?"_ They are the workhorse: thorough, fast, deterministic, and they cover edge cases, error states and state combinations.
- **E2E tests** ask: _"Does this actually work in a real browser, inside a real app?"_ They run happy-path flows through Chromium, Firefox and WebKit against the example apps.

Integration is the default layer. Unit tests are the exception for logic with enough edge cases to justify testing without the element around it. E2E is the confidence signal that what integration tested so thoroughly also works in real engines and real framework apps.

## The one boundary: axe-core

a11y-hud has no network. The only external dependency with real behaviour is axe-core, and `axe.run()` is the single seam the test suite is allowed to replace.

| Package | What runs for real | What is replaced |
| --- | --- | --- |
| `packages/core` | The `<a11y-hud>` custom element, its shadow DOM, Constructable Stylesheets fallback, MutationObserver, debounce, `localStorage`, keyboard handling, markdown and JSON export | `axe.run()`, through the module mock in `src/__fixtures__/axe-core.mock.ts`, fed by the fixture builders in `src/__fixtures__/axe-results.ts` |
| Adapters (`react`, `vue`, `solid`, `svelte`, `angular`) | The framework, the adapter, the real core element **and real axe-core** running in jsdom | Nothing |

Core mocks axe because its tests need deterministic violation data to assert rendering, filtering and highlighting. Adapters do not care which violations come back, only that props and lifecycle reach the element, so they run the whole stack. Each adapter suite still has one test that scans a page with an `<img>` and expects `image-alt` in the list, which proves the real chain from framework render to axe result.

Browser APIs that jsdom lacks (`matchMedia`, `scrollIntoView`, Constructable Stylesheets, the clipboard, `URL.createObjectURL`, canvas) are stubbed in each package's test setup file. Those are polyfills for the environment, not mocks of our code.

## What each layer owns

### Static

- Fixture builders are typed against axe-core's own `AxeResults`, `Result` and `NodeResult` types. If an axe-core upgrade renames or removes a field, the fixtures stop compiling instead of letting integration tests pass against fiction.
- Adapters compile against the core package's published types (`A11yHudInstance`, `MountOptions`, `Theme`). A change to the core API that an adapter does not follow fails `pnpm typecheck`.
- `pnpm check:ci` (Biome) and `pnpm typecheck` run on every PR before any test.

### Unit

Pure helpers in `packages/core/src/` with their own `*.test.ts` next to them: focus-order detection and tab-index sorting in `keyboard.ts`, ignore-list persistence in `ignores.ts`, theme resolution in `theme.ts`, debounce and observer wiring in `observer.ts`, result filtering in `scan.ts`, bookmarklet generation in `bookmarklet.ts`.

A unit test is warranted when the input space is large and the surrounding element adds nothing to the question. A helper with two branches does not need its own file; the element's integration tests reach it.

### Integration

**Core.** Every test mounts a real `<a11y-hud>` in jsdom, drives it through a [harness](./testing-harnesses.md) and asserts on what the panel renders or what the element does to the host page. Scan results come from `mockAxeResults()` / `mockViolation()`. This layer owns:

- Rendering, filtering and the empty, scanning and error states
- Expand, collapse, highlight, copy, export and ignore flows
- Keyboard navigation and keyboard mode
- Attribute and property reflection (`theme`, `scope`, `auto-scan`, `debounce`, `run-only`)
- Observer lifecycle, debounce changes and scan concurrency

**Adapters.** Every test renders the adapter with the framework's own test utilities, lets it mount the real element, and asserts on the element's public surface through the adapter's `HudHostHarness`: attributes, `scopeElement`, whether a scan ran (a spy on `A11yHudElement.prototype.runScan`, which keeps the real implementation) and the rule ids the real scan produced. This layer owns prop-to-attribute mapping, lifecycle (mount, unmount, re-render, prop changes) and the returned hook or service API.

### E2E

Playwright against the example apps, in all three engines. E2E owns what jsdom cannot prove:

- Real axe-core in real engines finds the fixture page's violations
- CSS-driven behaviour, such as the panel actually disappearing when minimized
- The element's own UI passing an axe-core audit
- Framework lifecycle inside a real app: route changes, prop-driven re-renders and subtree scoping trigger rescans

E2E does **not** own edge cases, error states, fine-grained assertions on panel internals, or filter and keyboard behaviour. Those live in integration and run in milliseconds. When an E2E test starts asserting something a harness could assert, move it.

E2E here is cheaper than in a product with tenants, auth and remote services: it runs on every PR inside the official Playwright container in about three minutes. That is a reason to keep it green and fast, not a reason to grow it.

## Who decides the behaviour?

Before picking a layer, ask who decides the outcome you want to assert.

| Who decides | Where the test goes |
| --- | --- |
| The core element (`packages/core`) | Core integration, or a unit test for a pure helper |
| An adapter (`packages/<framework>`) | That adapter's integration tests |
| axe-core (which rules fire, their impact, their tags) | axe-core's own suite. We contribute one E2E smoke per example app proving the wiring reaches it (`image-alt` appears for a bare `<img>`) |
| The browser engine or CSS (visibility, layout, Shadow DOM, Constructable Stylesheets) | E2E |

Do not write core tests that assert axe-core's judgement, and do not write adapter tests that re-test the panel. The adapter harness deliberately exposes only the element's public surface.

## Practical boundaries

| Question | Answer |
| --- | --- |
| Is this a **pure helper** with many input combinations? | Unit |
| Am I testing **what the panel does** given a scan result? | Core integration |
| Am I testing that a **prop or lifecycle event reaches the element**? | Adapter integration |
| Does the test need an **error, empty or edge-case scan result**? | Core integration, through the axe mock |
| Would a failure mean a **browser engine, CSS or real-app wiring** problem? | E2E |
| Do I need **more than one assertion** on panel internals? | Core integration |
| Is the asserted value **axe-core's decision**? | Not ours to test; one E2E smoke at most |
| Does this change the **shape of axe results** we depend on? | Static (fixtures stop compiling) |

## Harnesses and E2E: no shared abstraction

Harnesses are built on testing-library queries and `vi.waitFor` and run in jsdom. E2E uses Playwright locators directly. We do not abstract over both environments: the scoping models (`within(container)` versus `Locator` chains), synchronisation (`waitFor` versus auto-retrying `expect`) and event semantics differ enough that a shared layer would tax the many integration tests to benefit the few E2E tests.

The two still line up. Playwright locators pierce open shadow roots, so E2E addresses the panel by the same roles and accessible names the harnesses use (`getByRole("complementary", { name: "Accessibility panel" })`, `getByRole("button", { name: "Re-scan page" })`). The harness files are the inventory of stable selectors. When a selector changes, the integration suite breaks first, in seconds, before the E2E suite runs.

## Coverage and CI

| Package | Branch coverage threshold |
| --- | --- |
| `packages/core` | 86% (target 90%+) |
| Adapters | 80% |

Thresholds are enforced by `vitest run --coverage` in each package. Harness and fixture directories are excluded from coverage because they are test infrastructure.

Every PR runs lint, typecheck, unit and integration tests on Node 22 and 24, then E2E once in the Playwright container. See `.github/workflows/ci.yml`.

## File layout

```
packages/core/
  src/
    __fixtures__/
      axe-core.mock.ts      # module mock for axe-core; exports the `axeRun` vi.fn()
      axe-results.ts        # mockNode(), mockViolation(), mockAxeResults()
      hud-element.ts        # mountHudElement(), removeHudElements()
    __harnesses__/
      hud.harness.ts        # root harness and the tree below it
      hud.*.harness.ts      # one harness per panel area
      hud.harness.errors.ts
    element.test.ts         # lifecycle, attributes, observer, scan robustness
    element.*.test.ts       # one file per panel area
    *.test.ts               # unit tests next to the helper they cover
  tests/e2e/hud.spec.ts

packages/<adapter>/
  src/__harnesses__/hud-host.harness.ts   # (svelte: tests/unit/__harnesses__/)
  src/*.test.ts                           # (svelte: tests/unit/*.test.ts)
  tests/e2e/<adapter>.spec.ts
```

## Why integration is the default

Unit and integration tests cost the same here: both run in jsdom, in the same process, with no server to start. The traditional pyramid's wide unit base was justified by a cost gradient that does not exist for this code.

What integration buys is the wiring. Most bugs in a11y-hud live between pieces: an attribute change that does not restart the observer, a filter that forgets to refresh the count, a scan that resolves after the element was removed, an adapter that forwards a prop to a method the core no longer reflects. Isolating each piece makes exactly those bugs invisible.

The adapter suites used to mock the core's `mount()` and assert that the adapter called it with the right arguments. Every test passed while nothing proved the arguments did anything. They now run the real element, and the assertions read what the element actually did.
