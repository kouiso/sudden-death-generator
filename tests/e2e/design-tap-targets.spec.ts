import { test, expect, type Page } from "@playwright/test";

// デザイン差分監査 行5・9（タップ領域）。テーマ切替 44x44、チェックボックス行は高さ 44px /
// 14.5px / 行間 4px・列間 20px。

type Theme = "light" | "dark";

async function open(page: Page, theme: Theme, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript((t) => localStorage.setItem("sudden-death-theme", t), theme);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [1440, 390]) {
    test(`${theme} ${width}px: テーマ切替ボタンは 44x44（行5）`, async ({ page }) => {
      await open(page, theme, width);
      const box = await page.locator(".theme-toggle").boundingBox();
      expect({ w: box?.width, h: box?.height }).toEqual({ w: 44, h: 44 });
    });

    test(`${theme} ${width}px: チェックボックス行は高さ 44px・14.5px（行9）`, async ({ page }) => {
      await open(page, theme, width);
      const rows = page.locator(".checkbox-label");
      await expect(rows).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        const row = rows.nth(i);
        expect((await row.boundingBox())?.height).toBe(44);
        expect(await row.evaluate((e) => getComputedStyle(e).fontSize)).toBe("14.5px");
        // 18px のチェックボックスとラベル文字の間は 8px だけ（UA 既定の margin を持ち込まない）。
        expect(await row.locator("input").evaluate((e) => getComputedStyle(e).margin)).toBe("0px");
      }
    });
  }
}

test("チェックボックス行の間隔: 列間 20px・行間 4px・上は 8px（行9）", async ({ page }) => {
  await open(page, "light", 1440);
  const v = await page.evaluate(() => {
    const row = document.querySelector(".option-row") as HTMLElement;
    const s = getComputedStyle(row);
    const [a, b] = [...row.children].map((e) => e.getBoundingClientRect());
    const ta = document.querySelector(".editor-textarea")!.getBoundingClientRect();
    return { rowGap: s.rowGap, columnGap: s.columnGap, between: b!.left - a!.right, top: a!.top - ta.bottom };
  });
  expect(v.rowGap).toBe("4px");
  expect(v.columnGap).toBe("20px");
  expect(v.between).toBe(20);
  expect(v.top).toBe(8);
});

test("390px: 2 つのチェックボックス行が折り返しても横スクロールが出ない", async ({ page }) => {
  await open(page, "light", 390);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(scroll).toBe(false);
  const header = await page.evaluate(() => {
    const t = document.querySelector(".theme-toggle")!.getBoundingClientRect();
    const card = document.querySelector(".card")!.getBoundingClientRect();
    return t.right <= card.right + 0.5;
  });
  expect(header).toBe(true);
});
