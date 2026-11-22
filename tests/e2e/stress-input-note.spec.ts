import { test, expect, type Page } from "@playwright/test";

// #103 / design Screen390.dc.html の .hint: ストレス形を選んだ時だけ、入力欄の下に
// 「最後の行が枠に入り、その前（4行まで）がストレスになる」使われ方を 1 行で出す。
// 値はデザインの .hint（13px / 1.6 / ミュート色）を getComputedStyle で固定する。

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page), "ブラウザの例外・console.error").toEqual([]);
});

const NOTE = "最後の行が枠に入ります。その前の行（4行まで）がストレスになり、足りない段は「仕事のストレス」で埋まります。";

test("ストレス形を選ぶと入力欄の下に補足が出て、他の形では出ない", async ({ page }) => {
  const hint = page.locator(".editor-hint");
  // 初期（通常形）では無い
  await expect(hint).toHaveCount(0);

  for (const name of ["四角形", "短冊", "ストレス"] as const) {
    await page.getByRole("radio", { name }).click();
    if (name === "ストレス") {
      await expect(hint).toHaveText(NOTE);
    } else {
      await expect(hint).toHaveCount(0);
    }
  }

  // ストレスから別の形に戻すと消える
  await page.getByRole("radio", { name: "通常" }).click();
  await expect(hint).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  const muted = theme === "light" ? "rgb(91, 100, 120)" : "rgb(154, 162, 184)";
  test(`${theme}: 補足は 13px / 1.6 / ミュート色で、テキストエリアとチェックボックス行の間に出る`, async ({ page }) => {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.getByRole("radio", { name: "ストレス" }).click();
    const hint = page.locator(".editor-hint");
    const m = await hint.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const ta = document.querySelector(".editor-textarea")!.getBoundingClientRect();
      const opts = document.querySelector(".option-row")!.getBoundingClientRect();
      return {
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        color: s.color,
        top: r.top - ta.bottom,
        bottom: opts.top - r.bottom,
      };
    });
    expect(m.fontSize).toBe("13px");
    expect(m.lineHeight).toBe("20.8px"); // 13px * 1.6
    expect(m.color).toBe(muted);
    // デザインの fld gap 8px（上下とも）
    expect(m.top).toBeCloseTo(8, 0);
    expect(m.bottom).toBeCloseTo(8, 0);
  });
}

test("390px: 補足が折り返してもカード内・ページに横はみ出しが無い", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("radio", { name: "ストレス" }).click();
  await expect(page.locator(".editor-hint")).toBeVisible();
  const overflow = await page.evaluate(() => {
    const card = document.querySelector(".card")!.getBoundingClientRect();
    const r = document.querySelector(".editor-hint")!.getBoundingClientRect();
    return {
      right: r.right > card.right + 0.5,
      pageScroll: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(overflow).toEqual({ right: false, pageScroll: false });
});
