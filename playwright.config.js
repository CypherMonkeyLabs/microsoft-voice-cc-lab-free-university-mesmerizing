import { defineConfig, devices } from "@playwright/test";

const chrome = process.env.PW_CHROME || "/usr/bin/google-chrome";

export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:41731",
    launchOptions: { executablePath: chrome, args: ["--no-sandbox"] },
  },
  webServer: {
    command: "python3 -m http.server 41731 --bind 127.0.0.1",
    url: "http://127.0.0.1:41731/campus/",
    reuseExistingServer: true,
    timeout: 20000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } } },
  ],
});
