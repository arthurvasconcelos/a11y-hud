---
"@a11y-hud/vue": patch
---

Fix scope prop type and add README.

- `scope` prop is now correctly typed as `Element | null` instead of `Ref<Element | null>`. Vue 3 auto-unwraps template refs before passing them as component props, so the previous `Ref`-based type meant `scopeElement` was never set and subtree scoping never worked.
- Add `README.md` to the published package.
