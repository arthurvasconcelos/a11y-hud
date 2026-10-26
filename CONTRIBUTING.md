# Contributing to a11y-hud

Thank you for your interest in contributing!

## Development setup

**Prerequisites:** Node.js >=22, pnpm >=9.

```bash
# Clone and install
git clone https://github.com/arthurvasconcelos/a11y-hud.git
cd a11y-hud
pnpm install

# Run all tests
pnpm test

# Run tests in watch mode (inside a package)
cd packages/core
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Lint and format
pnpm check

# Type-check
pnpm typecheck

# Build all packages
pnpm build

# Start the vanilla example dev server
cd examples/vanilla
pnpm dev
```

## Repository layout

```
packages/
  core/      # a11y-hud (the main package — vanilla, framework-agnostic)
  react/     # @a11y-hud/react
  vue/       # @a11y-hud/vue
  solid/     # @a11y-hud/solid
  svelte/    # @a11y-hud/svelte
  angular/   # @a11y-hud/angular
examples/
  vanilla/   # example apps: manual testing and E2E, one per package
  react/
  vue/
  solid/
  svelte/
  angular/
  bookmarklet/
contributing/
  testing-strategy.md   # which test layer owns what
  testing-harnesses.md  # how to write and use test harnesses
docs/        # VitePress site (a11y-hud.dev)
```

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are linted on commit. Examples:

```
feat: add high-contrast theme
fix: correct debounce timer cleanup on disconnect
docs: update quick-start example
chore: bump axe-core to 4.11
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`, `build`.

Breaking changes: append `!` after the type (`feat!: rename mount option`) and describe the break in the commit body or footer.

## Pull requests

- One feature or fix per PR.
- Every PR that adds or changes behaviour must include tests. See the test section below.
- Run `pnpm check` (lint + format) before pushing — CI will fail otherwise.
- Fill out the PR template.

## Tests

Read [contributing/testing-strategy.md](contributing/testing-strategy.md) before writing tests. The short version:

- **Integration is the default.** Core tests mount the real `<a11y-hud>` element in jsdom and replace only `axe.run()` with fixture results. Adapter tests render the real framework component, the real core element and real axe-core, and assert on what reached the element.
- **Every integration test drives the element through a harness** (`__harnesses__/`). Tests never query the shadow DOM or call `vi.waitFor` directly. See [contributing/testing-harnesses.md](contributing/testing-harnesses.md).
- **Unit tests are the exception**, for pure helpers with many edge cases (`keyboard.ts`, `ignores.ts`, `theme.ts`, …). They live next to the file they cover.
- **E2E is thin.** Playwright runs happy paths and browser-only behaviour (real axe-core in three engines, CSS-driven visibility, framework lifecycle in a real app) against the example apps. Edge cases and error states belong in integration.

Where things live:

| What | Where |
| --- | --- |
| Core integration and unit tests | `packages/core/src/*.test.ts` |
| Core harnesses and fixtures | `packages/core/src/__harnesses__/`, `packages/core/src/__fixtures__/` |
| Adapter integration tests | `packages/<adapter>/src/*.test.ts` (`packages/svelte/tests/unit/`) |
| E2E | `packages/<package>/tests/e2e/` |

Commands:

```bash
pnpm test                      # all packages
pnpm --filter=a11y-hud test    # one package (any package name works)
pnpm test:e2e                  # all E2E suites (needs built packages: pnpm build)
cd packages/core && pnpm test:coverage   # enforces the branch threshold
```

Coverage thresholds are enforced per package: 86% branches for `packages/core/` (target 90%+), 80% for adapters.

## Adding or updating vendored icons

Icons come from [Lucide](https://lucide.dev/) (MIT). To add one:

1. Copy the SVG from the Lucide repo into `packages/core/src/icons/`.
2. Normalize: set `stroke="currentColor"`, remove hard-coded colors, keep `fill="none"` for stroke icons.
3. Register the name in `packages/core/src/icons/index.ts`.
4. Add a row to `LICENSE-ICONS.md`.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning and changelogs. If your PR changes public behaviour, run:

```bash
pnpm changeset
```

and commit the generated file. The maintainer will run `pnpm version-packages` and `pnpm release` when cutting a release.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
