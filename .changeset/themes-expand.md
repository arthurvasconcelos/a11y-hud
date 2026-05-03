---
"a11y-hud": minor
---

Add four new built-in themes: `github-dark`, `github-light`, `tokyo-night`, and `solarized-dark`. All new themes maintain WCAG AA contrast ratios for text and interactive elements. The `ResolvedTheme` type is now derived as `Exclude<Theme, "auto">` and will automatically include any future theme additions.
