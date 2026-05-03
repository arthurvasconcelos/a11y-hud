# Release process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

## Day-to-day: adding a changeset

When your PR changes public behaviour, run:

```bash
pnpm changeset
```

Follow the prompts to select the packages affected and write a summary. Commit the generated `.changeset/*.md` file with your PR.

## Cutting a release

1. Ensure CI is green on `main`.
2. Run `pnpm version-packages` — this consumes all pending changesets, bumps `package.json` versions, and updates `CHANGELOG.md`.
3. Commit the version bump: `git commit -m "chore: release"`.
4. Run `pnpm release` — this builds all packages and publishes to npm.
5. Push tags: `git push --follow-tags`.
6. Create a GitHub Release from the new tag, using the CHANGELOG entry as the body.
7. Verify the CDN path resolves: `https://cdn.jsdelivr.net/npm/a11y-hud@<version>/dist/index.umd.js`.

## Pre-release (RC)

Use Changesets pre-release mode:

```bash
pnpm changeset pre enter rc
pnpm changeset
pnpm version-packages
pnpm release -- --tag next
pnpm changeset pre exit
```

## Notes

- `packages/core/` publishes as `a11y-hud` (unscoped) — not `@a11y-hud/core`. Do not rename.
- UMD global is `window.A11yHud`. Do not rename.
- When core changes, bump adapter peer-dep ranges in the same release train.
