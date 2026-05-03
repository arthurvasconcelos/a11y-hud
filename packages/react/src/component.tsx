import { useA11yHud } from "./hook.js";
import type { A11yHudProps } from "./types.js";

export function A11yHud(props: A11yHudProps): null {
  useA11yHud(props);
  return null;
}
