import { test, expect, type Page } from "@playwright/test";

// デザイン(design/project 版9)との差分監査 行6・47・48・49 の測定テスト。
// 値は getComputedStyle で測る（見た目の目視ではなく数値で固定する）。

type Theme = "light" | "dark";

async function open(page: Page, theme: Theme) {
  // テーマはアプリ自身の保存キーで指定する（use-theme.ts の STORAGE_KEY）。
  await page.addInitScript((t) => localStorage.setItem("sudden-death-theme", t), theme);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

const read = (page: Page) =>
  page.evaluate(() => {
    const toggle = getComputedStyle(document.querySelector(".theme-toggle")!);
    const card = getComputedStyle(document.querySelector(".card")!);
    const body = getComputedStyle(document.body);
    return { toggleShadow: toggle.boxShadow, cardShadow: card.boxShadow, bodyBg: body.backgroundImage };
  });

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: テーマ切替ボタンに影が無い（行6・49）`, async ({ page }) => {
    await open(page, theme);
    expect((await read(page)).toggleShadow).toBe("none");
  });
}

test("light: カードの影はデザインの --sh のまま残る", async ({ page }) => {
  await open(page, "light");
  const { cardShadow } = await read(page);
  expect(cardShadow).toContain("rgba(31, 43, 92, 0.35)");
  expect(cardShadow).toContain("rgba(31, 43, 92, 0.12)");
});

test("dark: カードの影が無い（行47, --sh:none）", async ({ page }) => {
  await open(page, "dark");
  expect((await read(page)).cardShadow).toBe("none");
});

test("dark: 背景グラデーションは #141824 → #0a0c12 でアルファ無し（行48）", async ({ page }) => {
  await open(page, "dark");
  expect((await read(page)).bodyBg).toBe("linear-gradient(160deg, rgb(20, 24, 36), rgb(10, 12, 18))");
});

test("light: 背景グラデーションは #eef2fb → #e4e9f5", async ({ page }) => {
  await open(page, "light");
  expect((await read(page)).bodyBg).toBe("linear-gradient(160deg, rgb(238, 242, 251), rgb(228, 233, 245))");
});
