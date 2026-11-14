import { test, expect, type Page } from "@playwright/test";

// コピー成功の知らせは共有ボタンのすぐ下の「先に高さを確保した行」に出す（des-05）。
// 出ても消えてもカードの高さが変わらない事と、知らせが共有ボタン群の直下にある事を
// 実測値（getBoundingClientRect）で確かめる。

const NOTICE_ROW_HEIGHT = 24; // design/project/states.dc.html の min-height

async function measure(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector(".card")!.getBoundingClientRect();
    const bar = document.querySelector(".share-bar")!.getBoundingClientRect();
    const notice = document.querySelector('[role="status"]')?.getBoundingClientRect();
    return {
      cardHeight: card.height,
      barBottom: bar.bottom,
      notice: notice ? { top: notice.top, height: notice.height } : null,
      pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      viewport: document.documentElement.clientWidth,
    };
  });
}

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`${width}px: 知らせが出る前・出ている間・消えた後でカードの高さが同じで、共有ボタンの直下に出る`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("textbox").fill("復帰");
    await expect(page.getByRole("button", { name: /リンクをコピー/ })).toBeEnabled();

    const before = await measure(page);
    await page.getByRole("button", { name: "📋 コピー", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText(/コピーしました$/);
    const during = await measure(page);
    await expect(page.locator('[role="status"]:not(:empty)')).toHaveCount(0);
    const after = await measure(page);

    expect(during.cardHeight).toBe(before.cardHeight);
    expect(after.cardHeight).toBe(before.cardHeight);

    // 知らせの行は共有ボタン群のすぐ下（隙間は 16px 以内）にあり、高さ 24px を先に取っている。
    expect(during.notice).not.toBeNull();
    expect(during.notice!.top).toBeGreaterThanOrEqual(during.barBottom);
    expect(during.notice!.top - during.barBottom).toBeLessThanOrEqual(16);
    expect(during.notice!.height).toBeGreaterThanOrEqual(NOTICE_ROW_HEIGHT);
    expect(before.notice!.height).toBe(during.notice!.height);

    expect(during.pageWidth).toBeLessThanOrEqual(during.viewport);
    // 390×844 では共有ボタンが縦積みなので知らせが画面外に出うる。値は報告用に出力する（#91 待ち）。
    test.info().annotations.push({
      type: "measure",
      description: `before=${before.cardHeight} during=${during.cardHeight} after=${after.cardHeight} noticeTop=${during.notice!.top} barBottom=${during.barBottom}`,
    });
  });
}
