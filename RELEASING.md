# Release process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

## Day-to-day: adding a changeset

When your PR changes public behaviour, run:

```bash
pnpm changeset
```

Follow the prompts to select the packages affected and write a summary. Commit the generated `.changeset/*.md` file with your PR.

## Automated releases (GitHub Actions)

The `Release` workflow (`.github/workflows/release.yml`) runs on every push to `main` and uses [`changesets/action`](https://github.com/changesets/action):

1. If there are pending changesets on `main`, the action opens (or updates) a **"chore: release packages"** pull request that runs `changeset version` for you — it bumps `package.json` versions and updates each `CHANGELOG.md`.
2. When that release PR is merged, the next run finds no pending changesets and instead runs `pnpm release` (`pnpm build && changeset publish`), publishing every package whose version is not yet on npm and pushing the git tags.

Publishing authenticates with npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): the job has the `id-token: write` permission and pnpm exchanges the GitHub OIDC token for a short-lived npm credential, so no npm token is stored in the repository. Each package on npmjs.com has a trusted publisher configured for this repository and the `release.yml` workflow, with direct publishing enabled. The GitHub token is provided automatically. After publishing, the action pushes one git tag per package (`a11y-hud@1.2.3`, `@a11y-hud/react@1.2.3`, …) and creates a GitHub Release for each tag from its CHANGELOG entry.

After the publish run completes:

1. Check that the GitHub Releases were created and read correctly.
2. Verify the CDN path resolves: `https://cdn.jsdelivr.net/npm/a11y-hud@<version>/dist/index.umd.js`.

## Manual release (fallback)

If the workflow is unavailable or you need to publish from a local machine:

1. Ensure CI is green on `main`.
2. Run `pnpm version-packages` — this consumes all pending changesets, bumps `package.json` versions, and updates `CHANGELOG.md`.
3. Commit the version bump: `git commit -m "chore: release packages"`.
4. Run `pnpm release` — this builds all packages and publishes to npm. You need to be logged in to npm (`npm whoami`).
5. Push tags: `git push --follow-tags`.
6. Create a GitHub Release from the new tag, using the CHANGELOG entry as the body.
7. Verify the CDN path resolves: `https://cdn.jsdelivr.net/npm/a11y-hud@<version>/dist/index.umd.js`.

## Pre-release (RC)

Use Changesets pre-release mode. Entering pre mode writes `.changeset/pre.json`; commit it so the Release workflow (and anyone else versioning) stays in RC mode.

```bash
pnpm changeset pre enter rc
pnpm changeset
pnpm version-packages          # produces x.y.z-rc.N versions
pnpm release -- --tag next     # publish under the `next` dist-tag, not `latest`
```

Repeat `pnpm changeset` + `pnpm version-packages` + `pnpm release -- --tag next` for each RC iteration.

### Promoting an RC to the stable release

Exit pre mode **before** versioning, otherwise `version-packages` produces another RC:

```bash
pnpm changeset pre exit        # removes .changeset/pre.json
pnpm version-packages          # produces the stable x.y.z versions
pnpm release                   # publishes under `latest`
```

Commit the version bump and the removal of `.changeset/pre.json` together. If you let the Release workflow do the publishing, pushing that commit to `main` is enough — the action publishes the stable versions on the next run.

## Notes

- `packages/core/` publishes as `a11y-hud` (unscoped) — not `@a11y-hud/core`. Do not rename.
- UMD global is `window.A11yHud`. Do not rename.
- All packages are ESM-only; `a11y-hud` also ships the UMD bundle at `dist/index.umd.js`.
- When core changes, bump adapter peer-dep ranges in the same release train.
