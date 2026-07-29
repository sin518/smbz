import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoAxeViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(
    results.violations,
    results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`).join("\n")
  ).toEqual([]);
}

test("八字基本盘暴露完整语义表格", async ({ page }) => {
  await page.goto("/bazi/demo?birthTime=1990-01-01T12%3A00&gender=male&name=%E6%B5%8B%E8%AF%95");

  const table = page.getByRole("table", { name: "四柱基本排盘" });
  await expect(page).toHaveTitle("八字命盘｜赛博排盘");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "赛博八字" })).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveCount(5);
  await expect(table.getByRole("rowheader")).toHaveCount(10);
  await expectNoAxeViolations(page);
});

test("紫微十二宫可按命名区域导航", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("sm1:current-ziwei-profile", JSON.stringify({
      name: "测试",
      gender: "male",
      birthTime: "1990-01-01T12:00",
      location: "北京市",
      savedAt: "2026-07-29T00:00:00.000Z"
    }));
  });
  await page.goto("/ziwei");

  await expect(page).toHaveTitle("紫微斗数命盘｜赛博排盘");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "紫薇斗数" })).toBeVisible();
  await expect(page.getByRole("region", { name: /宫$/ })).toHaveCount(12);
  await expectNoAxeViolations(page);
});

test("六爻主卦与变卦暴露逐爻语义表格", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("sm1:current-liuyao-input", JSON.stringify({
      input: {
        castingTime: "2026-07-29T12:00",
        castingMethod: "manual",
        castingCalendar: "solar",
        yongShenTargets: ["官鬼"],
        question: "测试无障碍语义",
        divinationDirection: "事业学业"
      },
      savedAt: "2026-07-29T00:00:00.000Z"
    }));
    window.localStorage.setItem("sm1:current-liuyao-casting", JSON.stringify({
      status: "complete",
      completedAt: "2026-07-29T00:00:00.000Z",
      lines: [
        { position: 1, coins: [1, 0, 0], total: 7, kind: "young-yang", changing: false },
        { position: 2, coins: [1, 1, 0], total: 8, kind: "young-yin", changing: false },
        { position: 3, coins: [1, 1, 1], total: 9, kind: "old-yang", changing: true },
        { position: 4, coins: [0, 0, 0], total: 6, kind: "old-yin", changing: true },
        { position: 5, coins: [1, 0, 0], total: 7, kind: "young-yang", changing: false },
        { position: 6, coins: [1, 1, 0], total: 8, kind: "young-yin", changing: false }
      ]
    }));
  });
  await page.goto("/liuyao/result");

  const table = page.getByRole("table", { name: "六爻主卦与变卦" });
  await expect(page).toHaveTitle("六爻排盘结果｜赛博排盘");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "六爻断事" })).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.getByRole("rowheader")).toHaveCount(6);
  await expectNoAxeViolations(page);
});
