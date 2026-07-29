import { expect, test } from "@playwright/test";

test.describe("无障碍基础能力", () => {
  test("页面允许缩放", async ({ page }) => {
    await page.goto("/bazi");

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");

    expect(viewport).not.toContain("maximum-scale=1");
    expect(viewport).not.toContain("user-scalable=no");
  });

  test("八字资料表单使用持久标签", async ({ page }) => {
    await page.goto("/bazi");

    const nameInput = page.getByRole("textbox", { name: "姓名" });

    await expect(nameInput).toBeVisible();
    await nameInput.fill("无障碍测试");
    await expect(nameInput).toHaveAccessibleName("姓名");
  });

  test("八字校验失败后聚焦并关联首个错误", async ({ page }) => {
    await page.goto("/bazi");

    await page.getByRole("button", { name: "开始排盘" }).click();

    const trigger = page.getByRole("button", { name: "选择出生时间" }).first();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-describedby", "bazi-birth-time-error");
    await expect(page.locator("#bazi-birth-time-error")).toHaveRole("alert");
    await expect(page.locator("#bazi-birth-time-error")).toContainText("请选择出生时间");
  });

  for (const form of [
    { path: "/qimen", submit: "开始起课", field: "主体出生年" },
    { path: "/daliuren", submit: "开始起课", field: "占事" },
    { path: "/liuyao", submit: "开始起卦", field: "求测问题" }
  ] as const) {
    test(`${form.path} 校验失败后聚焦并关联首个错误`, async ({ page }) => {
      await page.goto(form.path);
      await page.getByRole("button", { name: form.submit }).click();

      const field = page.getByRole(form.field === "占事" || form.field === "求测问题" ? "textbox" : "spinbutton", {
        name: form.field
      });
      await expect(field).toBeFocused();
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAttribute("aria-describedby", /.+/);
      await expect(page.getByRole("alert").first()).toBeVisible();
    });
  }

  test("出生时间弹层管理语义与焦点", async ({ page }) => {
    await page.goto("/bazi");

    const trigger = page.getByRole("button", { name: "选择出生时间" }).first();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "选择出生时间" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.locator("input[type='datetime-local']")).toBeVisible();
    await expect(dialog).toContainText("年、月、日、时、分");
    await expect(dialog.getByRole("tab")).toHaveCount(0);
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await expect(page.locator("main")).toHaveJSProperty("inert", true);

    const firstButton = dialog.locator("button").first();
    const confirmButton = dialog.getByRole("button", { name: "确定" });
    await firstButton.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("出生地点与档案选择复用可访问弹层", async ({ page }) => {
    await page.goto("/bazi");

    const locationTrigger = page.getByRole("button", { name: "选择出生地点" });
    await locationTrigger.click();
    const locationDialog = page.getByRole("dialog", { name: "选择出生地点" });
    await expect(locationDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(locationDialog).toBeHidden();
    await expect(locationTrigger).toBeFocused();

    const profileTrigger = page.getByRole("button", { name: "档案" });
    await profileTrigger.click();
    const profileDialog = page.getByRole("dialog", { name: "选择通用档案" });
    await expect(profileDialog).toBeVisible();
    await expect(profileDialog.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(profileDialog).toBeHidden();
    await expect(profileTrigger).toBeFocused();
  });

  test("出生时间模式切换后仍恢复到原触发按钮", async ({ page }) => {
    await page.goto("/bazi");
    const trigger = page.getByRole("button", { name: "选择出生时间" }).first();
    await trigger.click();
    await page.getByRole("button", { name: "农历" }).click();
    await expect(page.getByRole("dialog", { name: "四柱干支反查出生时间" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("深色主题弹层继承深色表面", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("sm1:appearance", "dark"));
    await page.goto("/bazi");
    await page.getByRole("button", { name: "选择出生时间" }).first().click();

    const dialog = page.getByRole("dialog", { name: "选择出生时间" });
    await expect(dialog).toHaveCSS("background-color", "rgb(31, 32, 36)");
  });

  test("系统要求减少动态效果时压缩动画与过渡", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/bazi");

    const motion = await page.getByRole("button", { name: "开始排盘" }).evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        animationDuration: styles.animationDuration,
        animationIterationCount: styles.animationIterationCount,
        transitionDuration: styles.transitionDuration
      };
    });

    expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.001);
    expect(motion.animationIterationCount).toBe("1");
    expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
  });
});

const nativeTimeRoutes = [
  { path: "/bazi", trigger: "选择出生时间" },
  { path: "/ziwei/profile", trigger: "选择出生时间" },
  { path: "/liuyao", trigger: "选择起卦时间" },
  { path: "/qimen", trigger: "选择起卦时间" },
  { path: "/daliuren", trigger: "选择起课时间" }
] as const;

for (const route of nativeTimeRoutes) {
  test(`${route.path} 使用单一原生日期时间输入`, async ({ page }) => {
    await page.goto(route.path);
    await page.getByRole("button", { name: route.trigger }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCount(1);
    await expect(dialog.locator("input[type='datetime-local']")).toHaveCount(1);
    await expect(dialog.getByRole("tab")).toHaveCount(0);
  });
}
