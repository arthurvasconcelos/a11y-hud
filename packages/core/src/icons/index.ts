import alertCircle from "./alert-circle.svg";
import alertTriangle from "./alert-triangle.svg";
import checkCircle from "./check-circle.svg";
import chevronDown from "./chevron-down.svg";
import chevronUp from "./chevron-up.svg";
import copy from "./copy.svg";
import filter from "./filter.svg";
import info from "./info.svg";
import keyboard from "./keyboard.svg";
import minus from "./minus.svg";
import moon from "./moon.svg";
import refreshCw from "./refresh-cw.svg";
import sun from "./sun.svg";
import x from "./x.svg";

const registry: Record<string, string> = {
  "alert-circle": alertCircle,
  "alert-triangle": alertTriangle,
  "check-circle": checkCircle,
  "chevron-down": chevronDown,
  "chevron-up": chevronUp,
  copy,
  filter,
  info,
  keyboard,
  minus,
  moon,
  "refresh-cw": refreshCw,
  sun,
  x,
};

export function icon(name: string): string {
  return registry[name] ?? "";
}
