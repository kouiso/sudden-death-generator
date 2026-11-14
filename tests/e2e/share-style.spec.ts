import { test, expect, type Page } from "@playwright/test";

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

test("共有ボタン4つのラベルに下線が出ない（a 要素の X/LINE も button と同じ）", async ({ page }) => {
  const buttons = page.locator(".share-bar .share-button");
  await expect(buttons).toHaveCount(4);
  // a 要素は UA 既定で underline になる。button との差が出ていないかを computed style で測る。
  const decorations = await buttons.evaluateAll((elements) =>
    elements.map((element) => ({
      tag: element.tagName,
      line: getComputedStyle(element).textDecorationLine,
    })),
  );
  expect(decorations.map((d) => d.tag)).toEqual(["BUTTON", "A", "A", "BUTTON"]);
  for (const d of decorations) expect(d.line, d.tag).toBe("none");
});

// 2列になる幅（ラベルが折り返さない幅）。4列幅の折り返しは別 PBI（#91 並びの決定待ち）で扱う。
for (const width of [481, 560, 640]) {
  test(`${width}px: 共有ボタン4つの枠線の太さと高さ(48px)がそろう`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const buttons = page.locator(".share-bar .share-button");
    await expect(buttons).toHaveCount(4);
    const metrics = await buttons.evaluateAll((elements) =>
      elements.map((element) => ({
        border: getComputedStyle(element).borderTopWidth,
        height: element.getBoundingClientRect().height,
      })),
    );
    // 「リンクをコピー」だけ枠線を持つと 2px 高くなり、2段目と1段目で高さがずれていた。
    expect(new Set(metrics.map((m) => m.border)).size, JSON.stringify(metrics)).toBe(1);
    expect(parseFloat(metrics[0]?.border ?? "0")).toBeGreaterThan(0);
    for (const m of metrics) expect(m.height, JSON.stringify(metrics)).toBe(48);
  });
}

// --- X ボタンの枠線（ダーク）。デザインの --xbd。 ---
function luminance(css: string): number {
  const m = css.match(/[\d.]+/g)!.map(Number);
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: X ボタンの枠線・文字色`, async ({ page }) => {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    const x = await page.locator(".share-button--x").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        border: s.borderTopColor,
        width: s.borderTopWidth,
        bg: s.backgroundColor,
        color: s.color,
        card: getComputedStyle(el.closest(".card") ?? document.body).backgroundColor,
      };
    });
    // DPR1 では 1.5px が 1px に丸められて返るため、枠線があること（>0）だけ見る。
    expect(parseFloat(x.width)).toBeGreaterThan(0);
    expect(x.bg).toBe("rgb(20, 23, 26)");
    // 文字と塗りのコントラストは WCAG 1.4.3 の 4.5:1 以上
    expect(contrast(x.color, x.bg), JSON.stringify(x)).toBeGreaterThanOrEqual(4.5);
    if (theme === "light") {
      // ライトは従来と同じ見た目（枠線は塗りと同色）
      expect(x.border).toBe("rgb(20, 23, 26)");
    } else {
      expect(x.border).toBe("rgb(86, 94, 122)");
      // 閾値 2.5:1（デザイン値は 2.59:1。3:1 未達は PR で明示）
      expect(contrast(x.border, x.card), JSON.stringify(x)).toBeGreaterThanOrEqual(2.5);
    }
  });
}

// --- 「コピー」を主操作のアクセント色にする（緑は LINE と成功の知らせだけ）。デザインの --ac / --onac。 ---
const expected = {
  light: { copy: "rgb(47, 95, 224)", copyText: "rgb(255, 255, 255)" },
  dark: { copy: "rgb(109, 139, 255)", copyText: "rgb(11, 14, 23)" },
} as const;

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: コピーはアクセント色の塗り・LINE は緑のまま・4つとも文字コントラスト4.5以上`, async ({
    page,
  }) => {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    const styles = await page.locator(".share-bar .share-button").evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return { cls: el.className, bg: s.backgroundColor, color: s.color };
      }),
    );
    const by = (c: string) => styles.find((s) => s.cls.includes(c))!;
    const copy = by("share-button--copy");
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
    );
    expect(copy.bg, JSON.stringify(copy)).toBe(expected[theme].copy);
    expect(copy.color).toBe(expected[theme].copyText);
    // トークン（アプリのアクセント色）と同じ値であること。hex を rgb に直して比べる。
    const hex = accent.replace("#", "");
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
    expect(copy.bg).toBe(`rgb(${rgb})`);
    // LINE は緑のまま（コピーと見分けがつく）
    expect(by("share-button--line").bg).toBe("rgb(3, 122, 51)");
    expect(copy.bg).not.toBe(by("share-button--line").bg);
    expect(styles).toHaveLength(4);
    for (const s of styles) {
      expect(contrast(s.color, s.bg), JSON.stringify(s)).toBeGreaterThanOrEqual(4.5);
    }
  });
}
