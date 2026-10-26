---
"a11y-hud": patch
---

Fix the panel title button's accessible name so it includes its visible text ("a11y" and the violation count), satisfying WCAG 2.5.3 Label in Name. The self-audit E2E test now runs the bundled axe-core instead of a pinned CDN build, which is what surfaced the mismatch.
