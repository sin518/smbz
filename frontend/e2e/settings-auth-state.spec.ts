import { expect, test } from "@playwright/test";

test("本地残留用户信息不能覆盖服务端无会话状态", async ({ page }) => {
  let sessionRequestCount = 0;

  await page.addInitScript(() => {
    window.localStorage.setItem("sm1:user", JSON.stringify({ id: "stale-user", name: "旧账号" }));
  });
  await page.route("**/api/auth/get-session", async (route) => {
    sessionRequestCount += 1;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "未登录" })
    });
  });

  await page.goto("/settings");

  await expect.poll(() => sessionRequestCount).toBe(1);
  await expect(page.getByText("登录", { exact: true })).toBeVisible();
  await expect(page.getByText("已登录", { exact: true })).toHaveCount(0);
  await expect(page.getByText("登录后同步记录与个人资料", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("sm1:user"))).toBeNull();
});

test("网络不可用时显示离线且保留本机账号身份", async ({ page }) => {
  const storedUser = JSON.stringify({ id: "offline-user", name: "离线账号" });
  await page.addInitScript((value) => {
    window.localStorage.setItem("sm1:user", value);
  }, storedUser);
  await page.route("**/api/auth/get-session", async (route) => {
    await route.abort("internetdisconnected");
  });

  await page.goto("/settings");

  await expect(page.getByText("离线", { exact: true })).toBeVisible();
  await expect(page.getByText("已登录", { exact: true })).toHaveCount(0);
  await expect(page.getByText("无法验证登录状态，请联网后重试", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("sm1:user"))).toBe(storedUser);
});

test("登录页不会把本地残留用户信息当作有效会话", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("sm1:user", JSON.stringify({ id: "stale-user", name: "旧账号" }));
  });
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "未登录" })
    });
  });

  await page.goto("/settings/login");

  await expect(page.getByRole("heading", { level: 1, name: "登录" })).toBeVisible();
  await expect(page).toHaveURL(/\/settings\/login$/u);
});
