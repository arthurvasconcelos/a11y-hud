import { expect, test } from "@playwright/test";

async function waitForViolationList(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("a11y-hud");
    return el?.shadowRoot?.querySelector(".violation-list") !== null;
  });
}

async function getViolationRules(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const el = document.querySelector("a11y-hud");
    return Array.from(el?.shadowRoot?.querySelectorAll(".violation-rule") ?? []).map(
      (r) => r.textContent?.trim() ?? ""
    );
  });
}

async function getViolationItemCount(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector("a11y-hud");
    return el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
  });
}

test.describe("@a11y-hud/angular adapter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("a11y-hud");
    await waitForViolationList(page);
  });

  test("HUD mounts and shows violations on initial load", async ({ page }) => {
    const count = await getViolationItemCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test("violation list contains expected rules from Page A fixture", async ({ page }) => {
    const rules = await getViolationRules(page);
    expect(rules).toContain("image-alt");
  });

  test("scan triggers on route change — Page A image-alt disappears on Page B", async ({
    page,
  }) => {
    const rulesBefore = await getViolationRules(page);
    expect(rulesBefore).toContain("image-alt");

    await page.click('a[href="/page-b"]');

    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      const rules = Array.from(el?.shadowRoot?.querySelectorAll(".violation-rule") ?? []).map((r) =>
        r.textContent?.trim()
      );
      return !rules.includes("image-alt") && !rules.includes("button-name");
    });

    const rulesAfter = await getViolationRules(page);
    expect(rulesAfter).not.toContain("image-alt");
    expect(rulesAfter).not.toContain("button-name");
  });

  test("scan triggers on prop-driven re-render — new violation appears", async ({ page }) => {
    const countBefore = await getViolationItemCount(page);

    await page.click("#btn-add-violation");

    await page.waitForFunction((expected) => {
      const el = document.querySelector("a11y-hud");
      return (el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0) > expected;
    }, countBefore);

    const countAfter = await getViolationItemCount(page);
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("subtree scope restricts scan to the scoped element", async ({ page }) => {
    const totalCount = await getViolationItemCount(page);
    expect(totalCount).toBeGreaterThan(0);

    await page.click("#btn-toggle-scope");

    await page.waitForFunction((expected) => {
      const el = document.querySelector("a11y-hud");
      const items = el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
      return items !== expected;
    }, totalCount);

    const scopedCount = await getViolationItemCount(page);
    expect(scopedCount).toBeLessThan(totalCount);
  });

  test("disabling scope restores full-page scan", async ({ page }) => {
    const totalCount = await getViolationItemCount(page);

    await page.click("#btn-toggle-scope");
    await page.waitForFunction((expected) => {
      const el = document.querySelector("a11y-hud");
      return (el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0) !== expected;
    }, totalCount);
    const scopedCount = await getViolationItemCount(page);
    expect(scopedCount).toBeLessThan(totalCount);

    await page.click("#btn-toggle-scope");
    await page.waitForFunction((expected) => {
      const el = document.querySelector("a11y-hud");
      return (el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0) === expected;
    }, totalCount);
    const restoredCount = await getViolationItemCount(page);
    expect(restoredCount).toBe(totalCount);
  });
});
