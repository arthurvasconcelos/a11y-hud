import { createRequire } from "node:module";
import { expect, type Page, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const AXE_SCRIPT_PATH = require.resolve("axe-core/axe.min.js");

// Playwright locators pierce open shadow roots, so the panel can be addressed
// by the same roles and accessible names the integration harnesses use.
const hud = (page: Page) => page.locator("a11y-hud");
const panel = (page: Page) => page.getByRole("complementary", { name: "Accessibility panel" });
const violationList = (page: Page) => page.getByRole("list", { name: /^\d+ violations?$/ });
const ruleIds = (page: Page) => hud(page).locator(".violation-rule");

test.describe("a11y-hud in a real browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(violationList(page)).toBeVisible();
  });

  test("lists the fixture page's violations found by axe-core", async ({ page }) => {
    await expect(ruleIds(page).filter({ hasText: /^image-alt$/ })).toHaveCount(1);
    expect(await ruleIds(page).count()).toBeGreaterThan(0);
  });

  test("highlights the offending node on the page", async ({ page }) => {
    await hud(page)
      .getByRole("button", { name: /^image-alt / })
      .click();
    await hud(page)
      .getByRole("region", { name: "image-alt details" })
      .getByRole("button", { name: /^Highlight:/ })
      .first()
      .click();

    await expect(page.locator("[data-a11y-hud-highlighted]")).toHaveCount(1);
  });

  test("Escape collapses the panel to the FAB and the FAB brings it back", async ({ page }) => {
    const fab = hud(page).getByRole("button", { name: "Open accessibility panel" });
    await hud(page).getByRole("button", { name: "Re-scan page" }).focus();

    await page.keyboard.press("Escape");

    await expect(panel(page)).toBeHidden();
    await expect(fab).toBeVisible();

    await fab.click();

    await expect(panel(page)).toBeVisible();
    await expect(fab).toBeHidden();
  });

  test("passes its own axe-core audit", async ({ page }) => {
    await page.addScriptTag({ path: AXE_SCRIPT_PATH });

    const violations = await page.evaluate(async () => {
      const el = document.querySelector("a11y-hud");
      if (!el) return [];
      const axe = (
        window as Window & { axe: { run: (el: Element) => Promise<{ violations: unknown[] }> } }
      ).axe;
      return (await axe.run(el)).violations;
    });

    expect(violations).toHaveLength(0);
  });
});
