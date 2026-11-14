import { test, expect, type Page } from "@playwright/test";

// デザイン(design/project 版9)との差分監査 行1,2,3,4,8,10,12,13,14,46 の測定テスト。
// rem で書いた値は 16px 基準の px に換算して getComputedStyle と比べる。

type Theme = "light" | "dark";

async function open(page: Page, theme: Theme, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript((t) => localStorage.setItem("sudden-death-theme", t), theme);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

const css = (page: Page, selector: string, props: string[]) =>
  page.evaluate(
    ([sel, ps]) => {
      const s = getComputedStyle(document.querySelector(sel as string)!);
      return Object.fromEntries((ps as string[]).map((p) => [p, s.getPropertyValue(p)]));
    },
    [selector, props],
  );

test("ページ下余白: 1440 は 56px、390 は 32px（行1・2）", async ({ page }) => {
  await open(page, "light", 1440);
  expect((await css(page, "#app", ["padding-bottom"]))["padding-bottom"]).toBe("56px");
  await open(page, "light", 390);
  expect((await css(page, "#app", ["padding-bottom"]))["padding-bottom"]).toBe("32px");
});

test("h1 の line-height は 1.3（行3）", async ({ page }) => {
  await open(page, "light", 1440);
  const v = await css(page, ".app-title", ["line-height", "font-size"]);
  expect(parseFloat(v["line-height"])).toBeCloseTo(parseFloat(v["font-size"]) * 1.3, 1);
  expect(v["font-size"]).toBe("32px");
});

test("サブタイトルは 14px / 1.6 / balance（行4）", async ({ page }) => {
  await open(page, "light", 390);
  const v = await css(page, ".app-subtitle", ["font-size", "line-height", "text-wrap-style"]);
  expect(v["font-size"]).toBe("14px");
  expect(parseFloat(v["line-height"])).toBeCloseTo(22.4, 1);
  expect(v["text-wrap-style"]).toBe("balance");
});

test("ラベルは 13.5px（行8）", async ({ page }) => {
  await open(page, "light", 1440);
  expect((await css(page, ".field-label", ["font-size"]))["font-size"]).toBe("13.5px");
});

for (const [theme, muted] of [
  ["light", "rgb(91, 100, 120)"],
  ["dark", "rgb(154, 162, 184)"],
] as const) {
  test(`${theme}: placeholder の色はミュートトークン（行12）`, async ({ page }) => {
    await open(page, theme, 1440);
    const color = await page.evaluate(() => getComputedStyle(document.querySelector(".editor-textarea")!, "::placeholder").color);
    expect(color).toBe(muted);
  });
}

test("スタイル選択ボタン: padding 12px 8px / gap 6px / 13.5px（行13）", async ({ page }) => {
  await open(page, "light", 1440);
  const v = await css(page, ".shape-button", ["padding-top", "padding-bottom", "padding-left", "padding-right", "row-gap", "font-size"]);
  expect([v["padding-top"], v["padding-right"], v["padding-bottom"], v["padding-left"]]).toEqual(["12px", "8px", "12px", "8px"]);
  expect(v["row-gap"]).toBe("6px");
  expect(v["font-size"]).toBe("13.5px");
});

for (const [theme, act] of [
  ["light", "rgb(233, 238, 252)"],
  ["dark", "rgb(35, 43, 71)"],
] as const) {
  test(`${theme}: 選択中スタイルの背景は --act（行14）`, async ({ page }) => {
    await open(page, theme, 1440);
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.shape-button[aria-checked="true"]')!).backgroundColor);
    expect(bg).toBe(act);
  });
}

test("注記は 12.5px / 1.7（行46）", async ({ page }) => {
  await open(page, "light", 1440);
  const v = await css(page, ".share-note", ["font-size", "line-height"]);
  expect(v["font-size"]).toBe("12.5px");
  expect(parseFloat(v["line-height"])).toBeCloseTo(21.25, 1);
});

for (const [theme, muted] of [
  ["light", "rgb(91, 100, 120)"],
  ["dark", "rgb(154, 162, 184)"],
] as const) {
  test(`${theme}: 無効の縦書きチェックはミュート色 + not-allowed、有効側は変えない（行10）`, async ({ page }) => {
    await open(page, theme, 390);
    const vertical = page.locator(".checkbox-label", { hasText: "縦書き" });
    const enabledColor = await vertical.evaluate((e) => getComputedStyle(e).color);
    expect(await vertical.evaluate((e) => getComputedStyle(e).cursor)).toBe("pointer");
    await page.getByRole("radio", { name: "ストレス", exact: true }).click();
    await expect(vertical.locator("input")).toBeDisabled();
    const v = await vertical.evaluate((e) => ({ color: getComputedStyle(e).color, cursor: getComputedStyle(e).cursor }));
    expect(v).toEqual({ color: muted, cursor: "not-allowed" });
    expect(enabledColor).not.toBe(muted);
    // 余白チェックは影響を受けない。
    const other = page.locator(".checkbox-label", { hasText: "余白" });
    expect(await other.evaluate((e) => getComputedStyle(e).cursor)).toBe("pointer");
  });
}
