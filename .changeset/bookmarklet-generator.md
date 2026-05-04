---
"a11y-hud": minor
---

Add `generateBookmarklet(version?)` — returns a `javascript:` bookmarklet URL that loads the UMD bundle from jsDelivr and calls `window.A11yHud.mount()`. Defaults to `"latest"`; pass a version string to pin to a specific release. Build now generates `dist/bookmarklet.html`, a self-contained drag-to-bookmark page.
