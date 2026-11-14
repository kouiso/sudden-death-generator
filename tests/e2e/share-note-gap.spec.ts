import { test, expect } from "@playwright/test";

// 共有ボタン群の下端と注記（.share-note）の間は 8px 以上空ける（des-04）。
// 以前は .share-note が margin 0 でボタンに貼り付いていた。知らせの行（高さ確保済み）が
// 間に入る今は、その行が隙間になる。主要幅すべてで実測して確かめる。

const MIN_GAP = 8;

for (const width of [320, 390, 481, 560, 641, 720, 768, 1024, 1440]) {
  test(`${width}px: 共有ボタンの下端と注記の間が ${MIN_GAP}px 以上`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("textbox").fill("復帰");

    const m = await page.evaluate(() => {
      const bottoms = [...document.querySelectorAll(".share-button")].map((b) => b.getBoundingClientRect().bottom);
      const note = document.querySelector(".share-note")!.getBoundingClientRect();
      return { buttonsBottom: Math.max(...bottoms), noteTop: note.top };
    });
    const gap = m.noteTop - m.buttonsBottom;
    test.info().annotations.push({ type: "measure", description: `gap=${gap}` });
    console.log(`width=${width} gap=${gap}`);
    expect(gap).toBeGreaterThanOrEqual(MIN_GAP);
  });
}
