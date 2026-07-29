import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", heading: "赛博排盘", title: "首页" },
  { path: "/bazi", heading: "赛博八字", title: "八字排盘" },
  { path: "/ziwei/profile", heading: "紫薇斗数", title: "紫微斗数排盘" },
  { path: "/liuyao", heading: "六爻断事", title: "六爻排盘" },
  { path: "/qimen", heading: "奇门遁甲", title: "奇门遁甲排盘" },
  { path: "/daliuren", heading: "大六壬", title: "大六壬排盘" },
  { path: "/records", heading: "排盘记录", title: "排盘记录" },
  { path: "/settings", heading: "设置", title: "设置" },
  { path: "/settings/privacy-policy", heading: "隐私政策", title: "隐私政策", absoluteTitle: true },
  { path: "/settings/user-agreement", heading: "用户协议", title: "用户协议", absoluteTitle: true }
] as const;

for (const route of publicRoutes) {
  test(`${route.path} 具有主内容、标题且无自动化 A/AA 违规`, async ({ page }) => {
    if (route.path === "/records") {
      await page.route("**/api/**", async (requestRoute) => {
        await requestRoute.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "测试云端不可用状态" })
        });
      });
    }

    await page.goto(route.path);

    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page).toHaveTitle("absoluteTitle" in route && route.absoluteTitle ? route.title : `${route.title}｜赛博排盘`);
    if (route.path === "/records") {
      await expect(page.getByText("云端记录读取失败，当前显示本机缓存；稍后可重试。")).toBeVisible();
    }

    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasPageOverflow).toBe(false);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations,
      results.violations
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
        .join("\n")
    ).toEqual([]);
  });
}

test("深色主题设置页无自动化 A/AA 违规", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("sm1:appearance", "dark"));
  await page.goto("/settings");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("空干支演示路由返回 404", async ({ page }) => {
  const response = await page.goto("/bazi/demo/ganzhi");

  expect(response?.status()).toBe(404);
});

test("管理后台登录态具有唯一标题与主地标", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveTitle("管理后台｜赛博排盘");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "SM1 后台管理" })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});
