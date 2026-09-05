import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("选择日期后同步更新每日黄历", async ({ page }) => {
  await page.goto("/settings/calendar");

  await page.getByRole("button", { name: /选择年月/u }).click();
  await page.getByLabel("年份").fill("2026");
  await page.getByLabel("月份").selectOption("9");
  await page.getByRole("button", { name: "查看该月" }).click();

  await page.getByRole("button", { name: /2026年9月7日/u }).click();
  await expect(page.getByText("冲(戊寅)虎 煞南", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "宜事项" }).getByText("嫁娶", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /2026年9月8日/u }).click();
  await expect(page.getByText("冲(己卯)兔 煞东", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "忌事项" }).getByText("诸事不宜", { exact: true })).toBeVisible();
});

test("选择日期和时辰后进入指定排盘并预填时间", async ({ page }) => {
  await page.goto("/settings/calendar");

  await page.getByRole("button", { name: /选择年月/u }).click();
  await page.getByLabel("年份").fill("2026");
  await page.getByLabel("月份").selectOption("9");
  await page.getByRole("button", { name: "查看该月" }).click();
  await page.getByRole("button", { name: /2026年9月7日/u }).click();

  await page.getByRole("button", { name: /为2026年9月7日选择时辰并排盘/u }).click();
  await page.getByRole("button", { name: /巳时/u }).click();
  await expect(page.getByLabel("精确时间")).toHaveValue("10:00");
  await page.getByRole("button", { name: "下一步：选择排盘" }).click();
  await page.getByRole("button", { name: /进入奇门遁甲/u }).click();

  await expect(page).toHaveURL(/\/qimen\?dateTime=2026-09-07T10%3A00&source=calendar/u);
  await expect(page.getByRole("button", { name: "选择起卦时间" })).toContainText("2026/09/07 10:00");
});

test("五类排盘页面都读取万年历预填时间", async ({ page }) => {
  const cases = [
    { path: "/bazi", label: "选择出生时间", value: "2026/09/04 10:00" },
    { path: "/ziwei/profile", label: "选择出生时间", value: "2026/09/04 10:00" },
    { path: "/qimen", label: "选择起卦时间", value: "2026/09/04 10:00" },
    { path: "/daliuren", label: "选择起课时间", value: "2026/09/04 10:00" },
    { path: "/liuyao", label: "选择起卦时间", value: "2026-09-04 10:00" }
  ] as const;

  for (const item of cases) {
    await page.goto(`${item.path}?dateTime=2026-09-04T10%3A00&source=calendar`);
    await expect(page.getByRole("button", { name: item.label })).toContainText(item.value);
  }
});

test("辅助排盘的两个步骤无自动化 A/AA 违规", async ({ page }) => {
  await page.goto("/settings/calendar");
  await page.getByRole("button", { name: /选择时辰并排盘/u }).click();

  const timeStepResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(timeStepResults.violations).toEqual([]);

  await page.getByRole("button", { name: /午时/u }).click();
  await page.getByRole("button", { name: "下一步：选择排盘" }).click();
  const chartStepResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(chartStepResults.violations).toEqual([]);
});
