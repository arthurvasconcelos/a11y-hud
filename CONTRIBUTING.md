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
examples/
  vanilla/   # example app for manual testing and E2E
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

- Unit tests live alongside source files in `packages/core/src/`.
- E2E tests live in `packages/core/tests/e2e/`.
- Coverage targets: 90%+ branch for `packages/core/`.
- Run `pnpm test:coverage` inside `packages/core/` to check coverage.

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
