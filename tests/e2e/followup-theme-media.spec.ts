import { test, expect, type Page } from "@playwright/test";

// #96 / G2 のレビューで残った穴を埋める追加テスト。いずれも「今の挙動」を固定するもので、
// 実装は変えていない（変更前でも通る）。

const errors = new WeakMap<Page, string[]>();

test.afterEach(async ({ page }) => {
  expect(errors.get(page), "ブラウザの例外・console.error").toEqual([]);
});

async function open(page: Page, scheme?: "light" | "dark") {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  // goto より前に OS 設定を決める。localStorage は新規コンテキストなので空（手動選択なし）。
  if (scheme) await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

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

// --- 1. data-theme が無い時の prefers-color-scheme フォールバック ---
// アプリは useTheme の effect が起動直後に必ず data-theme を付ける（手動選択が無くても
// OS の値を反映する）ため、そのままでは CSS の media フォールバックは使われない。
// フォールバックそのものを測るには、読み込み後に属性を外して CSS だけの結果を見る。
// emulateMedia の切り替えは useTheme の change リスナーが data-theme を付け直すので、
// ライト/ダークは別々のページ読み込みで測る（競合を避ける）。
const fallback = {
  dark: { xBorder: "rgb(86, 94, 122)", copyBg: "rgb(109, 139, 255)" },
  light: { xBorder: "rgb(20, 23, 26)", copyBg: "rgb(47, 95, 224)" },
} as const;

for (const scheme of ["dark", "light"] as const) {
  test(`data-theme 無し・OS が ${scheme}: CSS の media フォールバックで X の枠線とコピーの塗りが決まる`, async ({
    page,
  }) => {
    await open(page, scheme);
    // 手動選択が無いので、アプリが付けた data-theme は OS の値と一致しているはず。
    expect(
      await page.evaluate(() => localStorage.getItem("sudden-death-theme")),
    ).toBeNull();
    await page.evaluate(() =>
      document.documentElement.removeAttribute("data-theme"),
    );
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute("data-theme"),
      ),
    ).toBe(false);
    const x = page.locator(".share-button--x");
    const copy = page.locator(".share-button--copy");
    await expect
      .poll(() => x.evaluate((el) => getComputedStyle(el).borderTopColor), {
        message: "X 枠線",
      })
      .toBe(fallback[scheme].xBorder);
    await expect
      .poll(() => copy.evaluate((el) => getComputedStyle(el).backgroundColor), {
        message: "コピー背景",
      })
      .toBe(fallback[scheme].copyBg);
  });
}

// --- 2. :active は今の押し込み（1px 下へ）のまま ---
for (const name of ["copy", "x", "line", "link"] as const) {
  test(`${name}: mousedown 中の transform は translateY(1px)`, async ({
    page,
  }) => {
    await open(page);
    const target = page.locator(`.share-button--${name}`);
    await expect(target).toBeVisible();
    if (name === "link") await expect(target).toBeEnabled();
    else await expect(target).not.toHaveAttribute("aria-disabled", "true");
    await target.hover();
    await page.mouse.down();
    try {
      await expect
        .poll(() => target.evaluate((el) => getComputedStyle(el).transform), {
          message: `${name} :active`,
        })
        .toBe("matrix(1, 0, 0, 1, 0, 1)");
    } finally {
      // 要素の外で離して click を発火させない（X/LINE は別タブを開くため）。
      await page.mouse.move(0, 0);
      await page.mouse.up();
    }
    await expect
      .poll(() => target.evaluate((el) => getComputedStyle(el).transform))
      .toBe("none");
  });
}

// --- 3. ダークで X / LINE に hover しても文字コントラストが落ちず、X の枠線は変わらない ---
for (const name of ["x", "line"] as const) {
  test(`dark: ${name} に hover しても文字コントラスト4.5以上${name === "x" ? "・枠線は #565e7a のまま" : ""}`, async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark"),
    );
    const target = page.locator(`.share-button--${name}`);
    await target.hover();
    const read = () =>
      target.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          color: s.color,
          border: s.borderTopColor,
        };
      });
    // hover の塗りに遷移し終えるまで待つ（transition 中の途中色で測らない）。
    await expect
      .poll(async () => (await read()).bg)
      .toBe(name === "x" ? "rgb(42, 47, 54)" : "rgb(2, 106, 44)");
    const final = await read();
    expect(
      contrast(final.color, final.bg),
      JSON.stringify(final),
    ).toBeGreaterThanOrEqual(4.5);
    if (name === "x")
      expect(final.border, JSON.stringify(final)).toBe("rgb(86, 94, 122)");
  });
}
