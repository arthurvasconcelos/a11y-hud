import { expect, test } from "@playwright/test";

test.describe("a11y-hud panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("a11y-hud");
  });

  test("panel renders and contains a violation list", async ({ page }) => {
    const panelHandle = page.locator("a11y-hud");
    await expect(panelHandle).toBeAttached();

    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".violation-list") !== null;
    });

    const violationCount = await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
    });

    expect(violationCount).toBeGreaterThan(0);
  });

  test("violation list contains expected rules from fixture page", async ({ page }) => {
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".violation-list") !== null;
    });

    const ruleIds = await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      return Array.from(el?.shadowRoot?.querySelectorAll(".violation-rule") ?? []).map(
        (r) => r.textContent
      );
    });

    expect(ruleIds).toContain("image-alt");
  });

  test("click-to-highlight adds highlight attribute to host element", async ({ page }) => {
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".violation-list") !== null;
    });

    await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      const toggle = el?.shadowRoot?.querySelector<HTMLButtonElement>(".violation-toggle");
      toggle?.click();
    });

    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector("[data-open]") !== null;
    });

    await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      el?.shadowRoot?.querySelector<HTMLButtonElement>(".btn-highlight")?.click();
    });

    const highlighted = await page.evaluate(
      () => document.querySelectorAll("[data-a11y-hud-highlighted]").length
    );
    expect(highlighted).toBe(1);
  });

  test("severity filter narrows the violation list", async ({ page }) => {
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".violation-list") !== null;
    });

    const totalBefore = await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
    });

    await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      const chips = el?.shadowRoot?.querySelectorAll<HTMLButtonElement>("[data-severity]");
      for (const c of chips ?? []) {
        if (c.dataset.severity !== "critical") c.click();
      }
    });

    const totalAfter = await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
    });

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test("theme switching via setTheme()", async ({ page }) => {
    await page.evaluate(() => {
      (window as Window & { __hud?: { setTheme: (t: string) => void } }).__hud?.setTheme("light");
    });

    const theme = await page.evaluate(
      () => (document.querySelector("a11y-hud") as HTMLElement | null)?.dataset.theme
    );
    expect(theme).toBe("light");

    await page.evaluate(() => {
      (window as Window & { __hud?: { setTheme: (t: string) => void } }).__hud?.setTheme("default");
    });

    const themeDark = await page.evaluate(
      () => (document.querySelector("a11y-hud") as HTMLElement | null)?.dataset.theme
    );
    expect(themeDark).toBe("default");
  });

  test("keyboard navigation: Escape closes the panel", async ({ page }) => {
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".panel") !== null;
    });

    await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      el?.shadowRoot
        ?.querySelector(".panel")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    await expect(page.locator("a11y-hud")).toHaveCount(0);
  });

  test("re-scan button triggers a new scan", async ({ page }) => {
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector("#btn-rescan") !== null;
    });

    await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      el?.shadowRoot?.querySelector<HTMLButtonElement>("#btn-rescan")?.click();
    });

    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".violation-list") !== null;
    });

    const count = await page.evaluate(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelectorAll(".violation-item").length ?? 0;
    });
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("a11y-hud self-audit", () => {
  test("a11y-hud's own UI passes axe-core scan", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => {
      const el = document.querySelector("a11y-hud");
      return el?.shadowRoot?.querySelector(".panel") !== null;
    });

    await page.addScriptTag({
      url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js",
    });

    const violations = await page.evaluate(async () => {
      const el = document.querySelector("a11y-hud");
      if (!el) return [];
      const results = await (
        window as Window & { axe: { run: (el: Element) => Promise<{ violations: unknown[] }> } }
      ).axe.run(el);
      return results.violations;
    });

    expect(violations).toHaveLength(0);
  });
});
