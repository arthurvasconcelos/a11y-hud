import axe from "axe-core";
import type { AxeResults } from "axe-core";

export async function runScan(target: Element = document.body): Promise<AxeResults> {
  const results = await axe.run(target);
  // Strip any violations whose nodes all come from inside the a11y-hud element
  // itself. The HUD is a dev-tool overlay and should not audit its own UI.
  results.violations = results.violations
    .map((v) => ({
      ...v,
      nodes: v.nodes.filter((node) => {
        const first = node.target[0];
        const selector = (Array.isArray(first) ? first[0] : first) ?? "";
        return !String(selector).toLowerCase().startsWith("a11y-hud");
      }),
    }))
    .filter((v) => v.nodes.length > 0);
  return results;
}
