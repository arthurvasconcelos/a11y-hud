---
"@a11y-hud/angular": minor
---

Initial release of the Angular adapter.

Exports `A11yHudComponent` (standalone, selector `a11y-hud-angular`) and `A11yHudService` for imperative use. Supports Angular 20 and 21. The `scope` input accepts `ElementRef<Element>`, a raw `Element`, or `null`. Uses `afterNextRender` for the initial mount and signal `effect()` per input for prop-change sync, keeping Angular's change detection cycle clean. Peer dep range: `@angular/core >= 20.0.0 < 23.0.0`.
