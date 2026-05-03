# Build the core package then start the vanilla example dev server.
# Run with: just dev
dev:
    pnpm --filter=a11y-hud build
    pnpm --filter=@a11y-hud/example-vanilla dev
