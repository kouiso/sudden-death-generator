import { test, expect, type Page } from "@playwright/test";

// 長い入力で X・LINE が押せなくなった時の理由を、押せないボタンのすぐ下に見せる（ux-04）。
// 以前は title に入れていたが、pointer-events:none と tabIndex=-1 のため誰にも表示されなかった。
// 実測値（getBoundingClientRect）で「見えている・ボタンの直下・title が無い・高さが動かない」を確かめる。

const REASON = "入力が長すぎるため、X・LINEでの共有はできません";
const LONG_INPUT = "あ".repeat(200);

async function measure(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector(".card")!.getBoundingClientRect();
    const bar = document.querySelector(".share-bar")!.getBoundingClientRect();
    const x = document.querySelector(".share-button--x")!.getBoundingClientRect();
    const line = document.querySelector(".share-button--line")!.getBoundingClientRect();
    const row = document.querySelector('[role="status"]')!;
    const r = row.getBoundingClientRect();
    return {
      cardHeight: card.height,
      barBottom: bar.bottom,
      buttonsBottom: Math.max(x.bottom, line.bottom),
      row: { top: r.top, height: r.height, text: row.textContent ?? "" },
      pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      viewport: document.documentElement.clientWidth,
      titles: [".share-button--x", ".share-button--line"].map((s) => document.querySelector(s)!.getAttribute("title")),
      disabled: [".share-button--x", ".share-button--line"].map((s) => document.querySelector(s)!.getAttribute("aria-disabled")),
    };
  });
}

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`${width}px: 200字で X・LINE が押せない時、理由がボタンの直下に見え、title は無く、カードの高さが動かない`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("textbox").fill(LONG_INPUT);

    const reason = page.getByRole("status");
    await expect(reason).toHaveText(REASON);
    await expect(reason).toBeVisible();
    const withReason = await measure(page);

    // X・LINE は押せない状態で、title（誰にも見えない説明）は付いていない。
    expect(withReason.disabled).toEqual(["true", "true"]);
    expect(withReason.titles).toEqual([null, null]);

    // 理由は X・LINE のすぐ下（隙間 16px 以内）で、行の高さを先に確保している。
    expect(withReason.row.top).toBeGreaterThanOrEqual(withReason.buttonsBottom);
    expect(withReason.row.top - withReason.barBottom).toBeLessThanOrEqual(16);
    expect(withReason.row.height).toBeGreaterThanOrEqual(24);
    // 画面の中に収まっている（折り返しても行からはみ出さない）。
    expect(withReason.pageWidth).toBeLessThanOrEqual(withReason.viewport);

    // コピーの知らせが同じ行に出て消えても、理由に戻り、カードの高さと行の位置は同じ。
    await page.getByRole("button", { name: "コピー", exact: true }).click();
    await expect(reason).toHaveText(/コピーしました$/);
    const during = await measure(page);
    await expect(reason).toHaveText(REASON);
    const after = await measure(page);

    expect(during.cardHeight).toBe(withReason.cardHeight);
    expect(after.cardHeight).toBe(withReason.cardHeight);
    expect(during.row.top).toBe(withReason.row.top);
    expect(after.row.top).toBe(withReason.row.top);
    expect(during.row.height).toBe(withReason.row.height);

    // 短い入力（理由なし）の空の行と高さが同じ＝理由が出ても行が伸びない。
    await page.getByRole("textbox").fill("復帰");
    await expect(page.locator('[role="status"]:not(:empty)')).toHaveCount(0);
    const idle = await measure(page);
    expect(withReason.row.height).toBe(idle.row.height);

    test.info().annotations.push({
      type: "measure",
      description: `rowTop=${withReason.row.top} buttonsBottom=${withReason.buttonsBottom} barBottom=${withReason.barBottom} rowH=${withReason.row.height} idleRowH=${idle.row.height} card=${withReason.cardHeight}/${during.cardHeight}/${after.cardHeight}`,
    });
  });
}
