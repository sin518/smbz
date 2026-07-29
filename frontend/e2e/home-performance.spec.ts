import { expect, test } from "@playwright/test";

test("首页不会预取尚未点击的功能页", async ({ page }) => {
  const prefetchedRoutes = new Set<string>();

  page.on("request", (request) => {
    const url = new URL(request.url());

    if (url.searchParams.has("_rsc") && url.pathname !== "/") {
      prefetchedRoutes.add(url.pathname);
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "赛博排盘" })).toBeVisible();
  await page.waitForTimeout(1_000);

  expect([...prefetchedRoutes].sort()).toEqual([]);
});

test("首页首屏不依赖渲染阻塞样式表", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "赛博排盘" })).toBeVisible();

  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(0);
});

test("关闭自动预取后功能卡仍可正常导航", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href="/bazi"]').click();

  await expect(page).toHaveURL(/\/bazi$/);
  await expect(page.getByRole("heading", { level: 1, name: "赛博八字" })).toBeVisible();
});
