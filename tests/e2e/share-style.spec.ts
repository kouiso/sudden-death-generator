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
