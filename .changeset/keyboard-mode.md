---
"a11y-hud": minor
---

Add keyboard-only mode (tab-order visualization). A keyboard icon button in the panel toolbar activates the mode. When active, the panel body switches to a keyboard view listing all naturally-focusable elements in tab order with numbered badges overlaid on the live page. The view also surfaces keyboard violations: `no-focusable-elements`, `positive-tabindex`, and `interactive-excluded`. Deactivating the mode removes the overlay and restores the normal violation view. New exports from `a11y-hud`: `getFocusableElements`, `injectFocusOrderOverlay`, `detectKeyboardViolations`, and types `FocusableElementInfo`, `KeyboardViolation`. No adapter changes — keyboard mode is HUD-UI-only.
