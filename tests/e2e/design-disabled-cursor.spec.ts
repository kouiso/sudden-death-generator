import { test, expect, type Page } from "@playwright/test";

// デザイン states.dc.html の注記「押せない時は、マウスの形も『押せない』にそろえる」。
// 以前は pointer-events:none のため cursor:not-allowed が CSS にあっても実際には出なかった。
// ポインタが届く要素（elementFromPoint）の computed cursor で測る。押せないままであることも確かめる。

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
  await page.getByRole("textbox").fill("あ".repeat(200));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page), "ブラウザの例外・console.error").toEqual([]);
});

for (const [name, selector] of [
  ["X", ".share-button--x"],
  ["LINE", ".share-button--line"],
] as const) {
  test(`${name}: 押せない時、マウスを乗せた先の cursor が not-allowed で、クリックしても何も開かない`, async ({
    page,
    context,
  }) => {
    const target = page.locator(selector);
    await expect(target).toHaveAttribute("aria-disabled", "true");

    // elementFromPoint は表示領域外だと null を返すため、先に画面内へ入れる。
    await target.scrollIntoViewIfNeeded();
    // ボタンの中心にポインタが届く要素（pointer-events:none だと背面の別要素になる）。
    const box = (await target.boundingBox())!;
    const hit = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y)!;
        return { cls: el.className, cursor: getComputedStyle(el).cursor };
      },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(hit.cls, JSON.stringify(hit)).toContain("share-button");
    expect(hit.cursor, JSON.stringify(hit)).toBe("not-allowed");

    // 実際に hover しても同じ（hover 規則で cursor が上書きされない）。
    await target.hover();
    expect(await target.evaluate((el) => getComputedStyle(el).cursor)).toBe("not-allowed");

    // 押せないまま: href が無く、Tab 順にも入らない。
    await expect(target).not.toHaveAttribute("href");

    // クリック（通常・中・Ctrl・Meta・Shift）とキー（Enter・Space）で、新しいタブも遷移も起きない。
    // 入力に応じた URL 同期（?text=）が落ち着いてから基準を取る。
    await expect(page.getByRole("status")).toHaveText(/共有はできません/);
    await page.waitForTimeout(500);
    const urlBefore = page.url();
    const textbox = page.getByRole("textbox");
    await textbox.focus();
    let opened = 0;
    context.on("page", () => opened++);
    const focusOf = () =>
      page.evaluate(() => `${document.activeElement?.tagName}.${document.activeElement?.className}`);
    const focusBefore = await focusOf();
    const clicks = [
      {},
      { button: "middle" as const },
      { modifiers: ["Control" as const] },
      { modifiers: ["Meta" as const] },
      { modifiers: ["Shift" as const] },
    ];
    for (const options of clicks) {
      await target.click(options);
      // クリックでフォーカスが移らない（移ると後のキー操作で枠が出る）。
      expect(await focusOf(), JSON.stringify(options)).toBe(focusBefore);
    }
    // Enter・Space はテキスト欄に入ると本文を書き換えるため、フォーカスを外してから押す。
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    expect(opened, "新しいタブが開いた").toBe(0);
    expect(page.url()).toBe(urlBefore);
    expect(context.pages()).toHaveLength(1);
    expect(await target.evaluate((el) => el.matches(":focus-visible"))).toBe(false);
    // tabindex を付けるとクリックでフォーカスできてしまう（Tab 順に入れない事は別テストで測る）。
    await expect(target).not.toHaveAttribute("tabindex");
  });
}

test("押せない X・LINE は Tab 順に入らない", async ({ page }) => {
  await page.getByRole("button", { name: "📋 コピー", exact: true }).focus();
  const visited: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Tab");
    visited.push(await page.evaluate(() => document.activeElement?.className ?? ""));
  }
  expect(visited.join("|")).not.toMatch(/share-button--(x|line)/);
  expect(visited[0]).toContain("share-button--link");
});

test("押せる時の X・LINE は pointer のまま（not-allowed にならない）", async ({ page }) => {
  await page.getByRole("textbox").fill("短い入力");
  for (const selector of [".share-button--x", ".share-button--line"]) {
    const target = page.locator(selector);
    await expect(target).toHaveAttribute("href", /text=/);
    expect(await target.evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
  }
});
