import { createA11yHud } from "./hook.js";
import type { A11yHudProps } from "./types.js";

export function A11yHud(props: A11yHudProps): null {
  createA11yHud(props);
  return null;
}
