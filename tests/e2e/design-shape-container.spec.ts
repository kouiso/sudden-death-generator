import { test, expect, type Page } from "@playwright/test";

// デザイン差分監査 行15。デザイン(Screen.dc.html / Screen390.dc.html)は .shell（画面の列全体）を
// container にして @container (max-width:480px) で 見出し 24px / カード余白 16px / 形選択 2列
// に切り替える。ここでは列(.app-shell)の幅で判定されていることを測る。

async function measure(page: Page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".app-shell")!.getBoundingClientRect().width;
    const card = getComputedStyle(document.querySelector(".card")!);
    return {
      shell,
      cols: getComputedStyle(document.querySelector(".shape-picker")!).gridTemplateColumns.split(" ").length,
      h1: getComputedStyle(document.querySelector(".app-title")!).fontSize,
      padding: card.paddingLeft,
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("列(.app-shell)が 480px 以下なら 2列・見出し24px・カード余白16px、超えたら 4列・32px・28px（画面幅 320〜800 を 1px ずつ）", async ({ page }) => {
  let switchAt = 0;
  for (let w = 320; w <= 800; w++) {
    await page.setViewportSize({ width: w, height: 900 });
    const m = await measure(page);
    const narrow = m.shell <= 480;
    expect(m, `viewport ${w}px / 列 ${m.shell}px`).toMatchObject(
      narrow ? { cols: 2, h1: "24px", padding: "16px" } : { cols: 4, h1: "32px", padding: "28px" },
    );
    if (!narrow && !switchAt) switchAt = w;
  }
  // 列は画面幅 - 左右 16px。512px で列が 480px、513px で超える。
  expect(switchAt).toBe(513);
});

for (const [width, cols] of [
  [320, 2],
  [390, 2],
  [481, 2],
  [512, 2],
  [513, 4],
  [560, 4],
  [720, 4],
  [1440, 4],
] as const) {
  test(`viewport ${width}px: ${cols} 列で、カード内・ページが横にはみ出さない`, async ({ page }) => {
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
