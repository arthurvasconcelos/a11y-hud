import axe from "axe-core";
import type { AxeResults } from "axe-core";

// axe-core does not support concurrent runs. Serialize all calls so that a
// second scan triggered while one is in-flight (e.g. from React StrictMode's
// double-invocation) waits for the active run to finish before starting.
let activeRun: Promise<AxeResults> | null = null;

export async function runScan(target: Element = document.body): Promise<AxeResults> {
  if (activeRun) {
    await activeRun.catch(() => {});
  }

  const run = axe
    .run(target)
    .then((results) => {
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
    })
    .finally(() => {
      if (activeRun === run) activeRun = null;
    });

  activeRun = run;
  return run;
}
