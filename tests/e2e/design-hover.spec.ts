import { test, expect, type Page } from "@playwright/test";

// デザイン states.dc.html の「マウスを乗せた」列（.cph / .xh / .lnh / .lkh）の値。
// 色は transition 中に途中の値を返しうるため、最終値になるまで expect.poll で待つ。

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

const buttons = {
  copy: { selector: ".share-button--copy" },
  x: { selector: ".share-button--x" },
  line: { selector: ".share-button--line" },
  link: { selector: ".share-button--link" },
} as const;

type Name = keyof typeof buttons;

// ライトは --ach #1f47b8 / ダークは --ach #8ca0ff。X・LINE の塗りは両テーマ共通。
const expected: Record<
  "light" | "dark",
  Record<Name, { bg: string; color: string; border?: string }>
> = {
  light: {
    copy: { bg: "rgb(31, 71, 184)", color: "rgb(255, 255, 255)" },
    x: { bg: "rgb(42, 47, 54)", color: "rgb(255, 255, 255)" },
    line: { bg: "rgb(2, 106, 44)", color: "rgb(255, 255, 255)" },
    link: { bg: "rgb(246, 248, 252)", color: "rgb(47, 95, 224)", border: "rgb(47, 95, 224)" },
  },
  dark: {
    copy: { bg: "rgb(140, 160, 255)", color: "rgb(11, 14, 23)" },
    x: { bg: "rgb(42, 47, 54)", color: "rgb(255, 255, 255)" },
    line: { bg: "rgb(2, 106, 44)", color: "rgb(255, 255, 255)" },
    link: { bg: "rgb(35, 40, 58)", color: "rgb(109, 139, 255)", border: "rgb(109, 139, 255)" },
  },
};

for (const theme of ["light", "dark"] as const) {
  for (const name of Object.keys(buttons) as Name[]) {
    test(`${theme}: ${name} に hover した時の色がデザインどおり・文字コントラスト4.5以上`, async ({
      page,
    }) => {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      const target = page.locator(buttons[name].selector);
      await target.hover();
      const want = expected[theme][name];
      const read = () =>
        target.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            bg: s.backgroundColor,
            color: s.color,
            border: s.borderTopColor,
            filter: s.filter,
          };
        });
      await expect
        .poll(async () => (await read()).bg, { message: `${theme} ${name} 背景` })
        .toBe(want.bg);
      await expect.poll(async () => (await read()).color).toBe(want.color);
      const final = await read();
      // コピーの hover は色だけ。brightness フィルタを重ねるとデザインより明るくなる。
      expect(final.filter, JSON.stringify(final)).toBe("none");
      if (want.border) expect(final.border, JSON.stringify(final)).toBe(want.border);
      expect(contrast(final.color, final.bg), JSON.stringify(final)).toBeGreaterThanOrEqual(4.5);
    });
  }
}
