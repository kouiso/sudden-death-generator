import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";

// クラウドの作業場には固定版と異なる Chromium が入っており、既定の起動先が存在しない。
// そのため PW_CHROMIUM_PATH があるときだけ実行ファイルを差し替える。
// 未設定ならこれまでどおり Playwright 管理のブラウザを使い、README のローカル手順は変わらない。
const chromiumPath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  // 実クリップボードはOSで共有されるため、コピー検証を並列実行しない。
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  metadata: {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    executedAt: new Date().toISOString(),
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "ja-JP",
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
