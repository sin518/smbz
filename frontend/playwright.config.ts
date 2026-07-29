import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 412, height: 823 }
      }
    },
    {
      name: "narrow-320",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 900 }
      }
    },
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    }
  ],
  webServer: {
    command: process.env.CI
      ? "corepack pnpm@11.17.0 dev --hostname 127.0.0.1 --port 3100"
      : "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
