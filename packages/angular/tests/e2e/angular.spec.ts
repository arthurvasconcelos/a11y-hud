import { expect, type Page, test } from "@playwright/test";

// Playwright locators pierce open shadow roots, so the panel can be addressed
// by the same roles and accessible names the integration harnesses use.
const violationList = (page: Page) => page.getByRole("list", { name: /^\d+ violations?$/ });
const ruleIds = (page: Page) => page.locator("a11y-hud .violation-rule");
const rule = (page: Page, id: string) => ruleIds(page).filter({ hasText: new RegExp(`^${id}$`) });

test.describe("@a11y-hud/angular adapter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(violationList(page)).toBeVisible();
  });

  test("HUD mounts and shows violations on initial load", async ({ page }) => {
    expect(await ruleIds(page).count()).toBeGreaterThan(0);
  });

  test("violation list contains expected rules from Page A fixture", async ({ page }) => {
    await expect(rule(page, "image-alt")).toHaveCount(1);
  });

  test("scan triggers on route change — Page A violations disappear on Page B", async ({
    page,
  }) => {
    await expect(rule(page, "image-alt")).toHaveCount(1);

    await page.click('a[href="/page-b"]');
    // Wait for the Angular Router to finish navigating and Page B to render, so the
    // assertions below observe the post-navigation rescan and not a transient state.
    await page.getByRole("heading", { name: "Page B" }).waitFor();

    // Page B has no images or unlabelled buttons, so the rescan drops both rules.
    await expect(rule(page, "image-alt")).toHaveCount(0);
    await expect(rule(page, "button-name")).toHaveCount(0);
  });

  test("scan triggers on prop-driven re-render — new violation appears", async ({ page }) => {
    const countBefore = await ruleIds(page).count();

    await page.click("#btn-add-violation");
    // Angular's @if block attaches the element on the next render; waiting for it
    // gives the MutationObserver a stable DOM to scan.
    await page.locator('[tabindex="5"]').waitFor({ state: "attached" });

    await expect.poll(() => ruleIds(page).count()).toBeGreaterThan(countBefore);
  });

  test("subtree scope restricts scan to the scoped element", async ({ page }) => {
    const totalCount = await ruleIds(page).count();
    expect(totalCount).toBeGreaterThan(0);

    await page.click("#btn-toggle-scope");

    await expect.poll(() => ruleIds(page).count()).toBeLessThan(totalCount);
  });

  test("disabling scope restores full-page scan", async ({ page }) => {
    const totalCount = await ruleIds(page).count();

    await page.click("#btn-toggle-scope");
    await expect.poll(() => ruleIds(page).count()).toBeLessThan(totalCount);

    await page.click("#btn-toggle-scope");
    await expect.poll(() => ruleIds(page).count()).toBe(totalCount);
  });
});
