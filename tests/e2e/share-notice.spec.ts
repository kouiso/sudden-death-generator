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
    await page.getByRole("button", { name: "コピー", exact: true }).click();
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

// コピー失敗（クリップボードへの書き込みが拒否される）時も同じ行に出し、文言はデザイン
// （states.dc.html）どおり。文字色はカード面に対して WCAG AA の 4.5:1 以上にする。
function luminance(c: number[]) {
  const [r, g, b] = [c[0]!, c[1]!, c[2]!];
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const rgb = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
// design/project/states.dc.html の --ng（ライト #b3243f / ダーク #ff7a90）。
const DANGER_COLOR = { light: "rgb(179, 36, 63)", dark: "rgb(255, 122, 144)" } as const;

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`${width}px ${scheme}: コピー失敗の知らせが同じ行に出て、カードの高さが変わらず、文字が 4.5:1 以上`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: () => Promise.reject(new Error("denied")) },
        });
      });
      await page.goto("/");
      await page.getByRole("textbox").fill("復帰");
      const before = await measure(page);

      await page.getByRole("button", { name: "コピー", exact: true }).click();
      const status = page.getByRole("status");
      await expect(status).toHaveText(/コピーできませんでした。もう一度押してください$/);
      const during = await measure(page);

      expect(during.cardHeight).toBe(before.cardHeight);
      // 同じ行（成功時と同じ位置・高さ）に出る。折り返して行が伸びていない。
      expect(during.notice!.top).toBe(before.notice!.top);
      expect(during.notice!.height).toBe(before.notice!.height);
      expect(during.pageWidth).toBeLessThanOrEqual(during.viewport);

      const colors = await page.evaluate(() => ({
        fg: getComputedStyle(document.querySelector('[role="status"]')!).color,
        bg: getComputedStyle(document.querySelector(".card")!).backgroundColor,
      }));
      const lums = [luminance(rgb(colors.fg)), luminance(rgb(colors.bg))].sort((a, b) => b - a);
      const [l1, l2] = [lums[0]!, lums[1]!];
      const ratio = (l1 + 0.05) / (l2 + 0.05);
      test.info().annotations.push({
        type: "measure",
        description: `fg=${colors.fg} bg=${colors.bg} ratio=${ratio.toFixed(2)} noticeH=${during.notice!.height} cardH=${during.cardHeight}`,
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      // 4.5:1 の判定は旧 #d1425a（4.53:1）でも通ってしまうため、デザインの --ng に合わせた
      // 値そのものを明暗の両方で固定し、色が戻ったら落ちるようにする。
      expect(colors.fg).toBe(DANGER_COLOR[scheme]);
    });
  }
}
