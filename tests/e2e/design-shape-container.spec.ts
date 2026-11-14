import { test, expect, type Page } from "@playwright/test";

// デザイン差分監査 行15: スタイル選択の列数は「カードの中身の幅」が 480px 以下で 2 列。
// 画面幅ではなくカードの中身の幅（content box）で測る。

async function measure(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector(".card") as HTMLElement;
    const cs = getComputedStyle(card);
    const content =
      card.getBoundingClientRect().width -
      parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) -
      parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
    const cols = getComputedStyle(document.querySelector(".shape-picker")!).gridTemplateColumns.split(" ").length;
    return { content, cols };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("カードの中身が 480px 以下なら 2 列、超えたら 4 列（画面幅 320〜800 を 1px ずつ）", async ({ page }) => {
  let sawTwo = false;
  let sawFour = false;
  // 旧実装（viewport 480px 未満で 2 列）は 480〜540px 付近で中身 480px 以下なのに 4 列だった。
  for (let w = 320; w <= 800; w++) {
    await page.setViewportSize({ width: w, height: 900 });
    const { content, cols } = await measure(page);
    expect(cols, `viewport ${w}px / カードの中身 ${content.toFixed(1)}px`).toBe(content <= 480 ? 2 : 4);
    if (cols === 2) sawTwo = true;
    else sawFour = true;
  }
  expect(sawTwo && sawFour).toBe(true);
});

for (const [width, cols] of [
  [320, 2],
  [390, 2],
  [481, 2],
  [560, 4],
  [720, 4],
  [1440, 4],
] as const) {
  test(`viewport ${width}px: ${cols} 列で、カード内が横にはみ出さない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    expect((await measure(page)).cols).toBe(cols);
    const overflow = await page.evaluate(() => {
      const card = document.querySelector(".card")!.getBoundingClientRect();
      const out: string[] = [];
      for (const el of document.querySelectorAll(".card *")) {
        if (el.closest(".preview-scroll")) continue; // AA は横スクロールが仕様。
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > card.right + 0.5 || r.left < card.left - 0.5)) out.push(`${el.className || el.tagName}`);
      }
      return {
        out,
        pageScroll: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(overflow).toEqual({ out: [], pageScroll: false });
  });
}
