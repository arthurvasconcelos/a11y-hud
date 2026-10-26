import { HudHarness } from "../__harnesses__/hud.harness.js";
import type { A11yHudElement } from "../element.js";

export interface MountedHud {
  el: A11yHudElement;
  hud: HudHarness;
}

/** Creates an `<a11y-hud>` with the given attributes, appends it to the body and wraps it in a harness. */
export function mountHudElement(attributes: Record<string, string> = {}): MountedHud {
  const el = document.createElement("a11y-hud") as A11yHudElement;
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  document.body.appendChild(el);
  return { el, hud: new HudHarness(() => el) };
}

/** Removes every `<a11y-hud>` and the global styles the element injects into the host page. */
export function removeHudElements(): void {
  for (const el of document.querySelectorAll("a11y-hud")) el.remove();
  document.getElementById("a11y-hud-highlight-style")?.remove();
  document.getElementById("a11y-hud-kbd-overlay")?.remove();
  document.getElementById("a11y-hud-kbd-style")?.remove();
}
