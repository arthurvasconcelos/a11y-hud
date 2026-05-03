# ─── development ──────────────────────────────────────────────────────────────

# Build core, then start the vanilla example dev server
dev:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/example-vanilla dev

# Build core + React adapter, then start the React example dev server
dev-react:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/react build
    pnpm --filter=@a11y-hud/example-react dev

# Build core + Vue adapter, then start the Vue example dev server
dev-vue:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/vue build
    pnpm --filter=@a11y-hud/example-vue dev

# Build core + Angular adapter, then start the Angular example dev server
dev-angular:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/angular build
    pnpm --filter=@a11y-hud/example-angular dev

# Start all example dev servers concurrently (builds first)
dev-all:
    #!/usr/bin/env bash
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/react build
    pnpm --filter=@a11y-hud/vue build
    pnpm --filter=@a11y-hud/angular build
    trap 'kill $(jobs -p) 2>/dev/null' EXIT
    pnpm --filter=@a11y-hud/example-vanilla dev &
    pnpm --filter=@a11y-hud/example-react dev &
    pnpm --filter=@a11y-hud/example-vue dev &
    pnpm --filter=@a11y-hud/example-angular dev &
    wait

# ─── building ─────────────────────────────────────────────────────────────────

# Build all published packages
build:
    pnpm build

# Build only the core package
build-core:
    pnpm --filter=a11y-hud build

# Build only the React adapter
build-react:
    pnpm --filter=@a11y-hud/react build

# Build only the Vue adapter
build-vue:
    pnpm --filter=@a11y-hud/vue build

# Build only the Angular adapter
build-angular:
    pnpm --filter=@a11y-hud/angular build

# ─── testing ──────────────────────────────────────────────────────────────────

# Run all unit tests
test:
    pnpm test

# Run unit tests with coverage for all packages
coverage:
    pnpm -r --filter='./packages/*' test:coverage

# Run coverage for a specific package (e.g. just coverage-pkg core)
coverage-pkg pkg:
    pnpm --filter=@a11y-hud/{{pkg}} test:coverage

# Build everything, then run all E2E suites
e2e: build
    pnpm test:e2e

# Build core, then run only the vanilla E2E suite
e2e-vanilla:
    pnpm --filter=a11y-hud build
    pnpm --filter=a11y-hud test:e2e

# Build core + React adapter, then run only the React E2E suite
e2e-react:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/react build
    pnpm --filter=@a11y-hud/react test:e2e

# Build core + Vue adapter, then run only the Vue E2E suite
e2e-vue:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/vue build
    pnpm --filter=@a11y-hud/vue test:e2e

# Build core + Angular adapter, then run only the Angular E2E suite
e2e-angular:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/angular build
    pnpm --filter=@a11y-hud/angular test:e2e

# ─── quality ──────────────────────────────────────────────────────────────────

# Type-check all packages
typecheck:
    pnpm typecheck

# Lint + format check, read-only (same as CI)
lint:
    pnpm check:ci

# Lint + format with auto-fix
format:
    pnpm check

# Run the full CI pipeline locally: lint → typecheck → test → build
ci:
    pnpm check:ci
    pnpm typecheck
    pnpm test
    pnpm build

# ─── release ──────────────────────────────────────────────────────────────────

# Create a new changeset entry
changeset:
    pnpm changeset

# Apply pending changesets to bump package versions
version:
    pnpm version-packages

# ─── setup ────────────────────────────────────────────────────────────────────

# Install all workspace dependencies
install:
    pnpm install
