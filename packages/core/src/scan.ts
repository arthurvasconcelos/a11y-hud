import type { AxeResults, RunOptions } from "axe-core";
import axe from "axe-core";
import { listIgnores } from "./ignores.js";

// axe-core does not support concurrent runs. Serialize all calls so that a
// second scan triggered while one is in-flight (e.g. from React StrictMode's
// double-invocation) waits for the active run to finish before starting.
let activeRun: Promise<AxeResults> | null = null;

export async function runScan(
  target: Element = document.body,
  runOnly?: string[]
): Promise<AxeResults> {
  if (activeRun) {
    await activeRun.catch(() => {});
  }

  const options: RunOptions =
    runOnly && runOnly.length > 0 ? { runOnly: { type: "tag", values: runOnly } } : {};

  const run = axe
    .run(target, options)
    .then((results) => {
      const ignores = listIgnores();
      results.violations = results.violations
        .map((v) => ({
          ...v,
          nodes: v.nodes.filter((node) => {
            const first = node.target[0];
            const selector = (Array.isArray(first) ? first[0] : first) ?? "";
            return !String(selector).toLowerCase().startsWith("a11y-hud");
          }),
        }))
        .filter((v) => v.nodes.length > 0)
        .map((v) => {
          if (ignores.some((e) => e.ruleId === v.id && e.selector === undefined)) {
            return null;
          }
          const hasNodeIgnores = ignores.some((e) => e.ruleId === v.id && e.selector !== undefined);
          if (!hasNodeIgnores) return v;
          const nodes = v.nodes.filter((node) => {
            const last = node.target[node.target.length - 1];
            const sel = (Array.isArray(last) ? last[last.length - 1] : last) ?? "";
            return !ignores.some((e) => e.ruleId === v.id && e.selector === sel);
          });
          return nodes.length > 0 ? { ...v, nodes } : null;
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);
      return results;
    })
    .finally(() => {
      activeRun = null;
    });

  activeRun = run;
  return run;
}
