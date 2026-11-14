import { test, expect, type Page } from "@playwright/test";

// des-07: アイコンは絵文字ではなく、文字色（currentColor）に従う線の SVG にする。
// 端末ごとに絵柄が変わらない事・テーマで色が変わる事・絵文字が画面の文字に残っていない事を測る。

const EMOJI = /\p{Extended_Pictographic}/u;

async function visibleText(page: Page) {
  return page.evaluate(() => document.body.innerText);
}

test("通常・コピー成功・コピー失敗・長文入力のどの状態でも、画面の文字に絵文字が無い", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("復帰");
  expect(await visibleText(page)).not.toMatch(EMOJI);

  await page.getByRole("button", { name: "コピー", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(/コピーしました$/);
  expect(await visibleText(page)).not.toMatch(EMOJI);

  // 失敗: clipboard 書き込みを失敗させる
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", { value: () => Promise.reject(new Error("denied")), configurable: true });
  });
  await expect(page.locator('[role="status"]:not(:empty)')).toHaveCount(0, { timeout: 5000 });
  await page.getByRole("button", { name: "コピー", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("コピーできませんでした");
  expect(await visibleText(page)).not.toMatch(EMOJI);
  void context;

  await page.getByRole("textbox").fill("長い入力".repeat(200));
  await expect(page.getByRole("status")).toContainText(/長すぎる|コピー/);
  expect(await visibleText(page)).not.toMatch(EMOJI);
});

test("形の選択・コピー・リンク・テーマ切替のアイコンは currentColor の inline svg で aria-hidden", async ({ page }) => {
  await page.goto("/");
  const buttons = [
    ...["通常", "四角形", "短冊", "ストレス"].map((n) => page.getByRole("radio", { name: n })),
    page.getByRole("button", { name: "コピー", exact: true }),
    page.getByRole("button", { name: "リンクをコピー" }),
    page.getByRole("button", { name: /に切り替え$/ }),
  ];
  for (const button of buttons) {
    const svg = button.locator("svg");
    await expect(svg).toHaveCount(1);
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).toHaveAttribute("stroke", "currentColor");
    await expect(svg).toHaveAttribute("fill", "none");
  }
});

test("アイコンの色は文字色に従い、明暗を切り替えると変わる", async ({ page }) => {
  await page.goto("/");
  const read = () =>
    page.evaluate(() => {
      const pick = (el: Element) => {
        const svg = el.querySelector("svg")!;
        return { button: getComputedStyle(el).color, icon: getComputedStyle(svg).color };
      };
      const toggle = document.querySelector(".theme-toggle")!;
      const radio = document.querySelector('[role="radio"]')!;
      const link = document.querySelector(".share-button--link")!;
      return { toggle: pick(toggle), radio: pick(radio), link: pick(link) };
    });
  const toggle = page.locator(".theme-toggle");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await toggle.click(); // 現在のテーマを確定させるため一度切り替える
  const first = await read();
  await toggle.click();
  const second = await read();
  for (const key of ["toggle", "radio", "link"] as const) {
    expect(first[key].icon).toBe(first[key].button);
    expect(second[key].icon).toBe(second[key].button);
    expect(first[key].icon).not.toBe(second[key].icon);
  }
});

test("コピー成功の直後、コピー・リンクのボタンはチェックの svg と「コピー済み」を出し、知らせにもチェックが付く", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("復帰");
  const checkPath = 'path[d="M5 12l5 5 9-10"]';

  await page.getByRole("button", { name: "コピー", exact: true }).click();
  const copied = page.getByRole("button", { name: "コピー済み" });
  await expect(copied).toHaveCount(1);
  await expect(copied.locator(`svg ${checkPath}`)).toHaveCount(1);
  await expect(page.getByRole("status").locator(`svg ${checkPath}`)).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("コピーしました");
});

test("リンクコピー成功の直後もチェックの svg と「コピー済み」になる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("復帰");
  await page.getByRole("button", { name: "リンクをコピー" }).click();
  const copied = page.getByRole("button", { name: "コピー済み" });
  await expect(copied).toHaveCount(1);
  await expect(copied.locator('svg path[d="M5 12l5 5 9-10"]')).toHaveCount(1);
});
