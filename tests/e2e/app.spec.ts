import { test, expect, type Page } from "@playwright/test";

const defaultOutput = ["＿人人人人人人＿", "＞　突然の死　＜", "￣Y^Y^Y^Y^Y^Y^￣"].join("\n");
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

test("初期表示と入力・空白入力の即時反映", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "テキスト入力" });
  const output = page.getByRole("region", { name: "生成結果" }).locator("pre");
  await expect(input).toHaveValue("");
  await expect(output).toHaveText(defaultOutput);
  await input.fill("日本語 & emoji😀\n二行目");
  await expect(output).toContainText("日本語 & emoji😀");
  await expect(output).toContainText("二行目");
  await input.fill("   \n\n");
  await expect(output).toHaveText(defaultOutput);
});

const shapes = [
  { name: "通常", output: defaultOutput, disabled: false, vertical: false },
  { name: "四角形", output: ["┌──────┐", "│　突然の死　│", "└──────┘"].join("\n"), disabled: false, vertical: false },
  { name: "短冊", output: ["┏┷┓", "┃突┃", "┃然┃", "┃の┃", "┃死┃", "┗━┛"].join("\n"), disabled: true, vertical: true },
];

for (const shape of shapes) {
  test(`${shape.name}の枠と縦書き設定`, async ({ page }) => {
    const radio = page.getByRole("radio", { name: shape.name, exact: true });
    await radio.click();
    await expect(radio).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".preview-pre")).toHaveText(shape.output);
    const vertical = page.getByRole("checkbox", { name: /縦書き/ });
    if (shape.disabled) await expect(vertical).toBeDisabled();
    else await expect(vertical).toBeEnabled();
    await expect(vertical).toBeChecked({ checked: shape.vertical });
  });
}

test("ストレス形は複数行を順に結び、縦書き操作を無効にする", async ({ page }) => {
  await page.getByRole("textbox").fill("一行目\n二行目\n三行目\n四行目\n最終行");
  await page.getByRole("radio", { name: "ストレス", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /縦書き/ })).toBeDisabled();
  const output = await page.locator(".preview-pre").innerText();
  expect(output).toMatch(/一行目[\s\S]*↘[\s\S]*二行目[\s\S]*↙[\s\S]*三行目[\s\S]*↘[\s\S]*四行目[\s\S]*↙[\s\S]*最終行/);
  expect(output.split("\n").at(-1)).toContain("Y^");
});

test("縦書きと余白の切り替えで出力が変わる", async ({ page }) => {
  const output = page.locator(".preview-pre");
  await page.getByRole("checkbox", { name: /縦書き/ }).check();
  const vertical = ["＿人人人＿", "＞　突　＜", "＞　然　＜", "＞　の　＜", "＞　死　＜", "￣Y^Y^Y^￣"].join("\n");
  await expect(output).toHaveText(vertical);
  await page.getByRole("checkbox", { name: /余白/ }).check();
  await expect.poll(async () => (await output.innerText()).split("\n").length).toBe(8);
  await page.getByRole("checkbox", { name: /余白/ }).uncheck();
  await expect(output).toHaveText(vertical);
});

test("実クリップボードへのコピーと通知の自動消去", async ({ page }) => {
  await page.getByRole("textbox").fill("コピー😀 & 改行\n確認");
  const output = await page.locator(".preview-pre").innerText();
  await page.getByRole("button", { name: "📋 コピー", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(/コピーしました$/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(output);
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("リンクコピー直後と再読み込み後に全文と全オプションを復元する", async ({ page }) => {
  const text = "日本語😀 & ? #\n二行目";
  await page.getByRole("textbox").fill(text);
  await page.getByRole("radio", { name: "四角形", exact: true }).click();
  await page.getByRole("checkbox", { name: /縦書き/ }).check();
  await page.getByRole("checkbox", { name: /余白/ }).check();
  const output = await page.locator(".preview-pre").innerText();
  await page.getByRole("button", { name: /リンクをコピー/ }).click();
  await expect(page.getByRole("status")).toHaveText(/リンクをコピーしました$/);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const url = new URL(copied);
  expect(url.searchParams.get("text")).toBe(text);
  expect(url.searchParams.get("shape")).toBe("square");
  expect(url.searchParams.get("vertical")).toBe("1");
  expect(url.searchParams.get("padding")).toBe("1");
  await expect(page).toHaveURL(copied);
  await page.goto(copied);
  await expect(page.getByRole("textbox")).toHaveValue(text);
  await expect(page.getByRole("radio", { name: "四角形", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("checkbox", { name: /縦書き/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /余白/ })).toBeChecked();
  await expect(page.locator(".preview-pre")).toHaveText(output);
});

test("X・LINEの共有先とエンコード済み生成結果", async ({ page }) => {
  await page.getByRole("textbox").fill("共有 & # ?😀\n二行目");
  const output = await page.locator(".preview-pre").innerText();
  for (const [name, destination] of [
    ["𝕏 でシェア", "https://twitter.com/intent/tweet"],
    ["LINE で送信", "https://line.me/R/share"],
  ] as const) {
    const link = page.getByRole("link", { name, exact: true });
    const href = await link.getAttribute("href");
    expect(href).not.toBeNull();
    const url = new URL(href!);
    expect(`${url.origin}${url.pathname}`).toBe(destination);
    expect(url.searchParams.get("text")).toBe(output);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
});

test("矢印キーで4形状を巡回し、Tabでグループを抜ける", async ({ page }) => {
  const normal = page.getByRole("radio", { name: "通常", exact: true });
  await normal.focus();
  for (const [key, name] of [
    ["ArrowRight", "四角形"], ["ArrowDown", "短冊"], ["ArrowRight", "ストレス"],
    ["ArrowRight", "通常"], ["ArrowLeft", "ストレス"], ["ArrowUp", "短冊"],
  ] as const) {
    await page.keyboard.press(key);
    const selected = page.getByRole("radio", { name, exact: true });
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "📋 コピー", exact: true })).toBeFocused();
});

test("長文では共有と古いURLを無効にし、短文へ戻すと復帰する", async ({ page }) => {
  await page.getByRole("textbox").fill("短い入力");
  await expect(page).toHaveURL(/text=/);
  await page.getByRole("textbox").fill("あ".repeat(500));
  await expect(page.getByRole("button", { name: /リンクをコピー/ })).toBeDisabled();
  for (const selector of [".share-button--x", ".share-button--line"]) {
    const link = page.locator(selector);
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await expect(link).not.toHaveAttribute("href");
  }
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.getByRole("textbox").fill("復帰");
  await expect(page.getByRole("button", { name: /リンクをコピー/ })).toBeEnabled();
  await expect(page.getByRole("link", { name: "LINE で送信", exact: true })).toHaveAttribute("href", /text=/);
  await expect.poll(() => new URL(page.url()).searchParams.get("text")).toBe("復帰");
});

for (const width of [375, 428]) {
  test(`${width}pxで横はみ出し・共有文の折り返し・通知の重なりがない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 926 });
    await page.getByRole("textbox").fill("長いプレビューを内側でスクロールさせるための入力".repeat(3));
    const assertLayout = async () => {
      const layout = await page.evaluate(() => {
        const box = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        return {
          viewport: document.documentElement.clientWidth,
          pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          buttons: [...document.querySelectorAll(".share-button")].map((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const rows: { top: number; bottom: number }[] = [];
            for (const rect of [...range.getClientRects()].sort((a, b) => a.top - b.top)) {
              const last = rows.at(-1);
              if (last && rect.top < last.bottom) last.bottom = Math.max(last.bottom, rect.bottom);
              else rows.push({ top: rect.top, bottom: rect.bottom });
            }
            return {
              ...box(element),
              textLines: rows.length,
            };
          }),
          toast: document.querySelector(".toast") ? box(document.querySelector(".toast")!) : null,
          preview: box(document.querySelector(".preview-panel")!),
          scroll: {
            client: document.querySelector(".preview-scroll")!.clientWidth,
            content: document.querySelector(".preview-scroll")!.scrollWidth,
          },
        };
      });
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.scroll.content).toBeGreaterThan(layout.scroll.client);
      expect(layout.buttons).toHaveLength(4);
      for (const [index, button] of layout.buttons.entries()) {
        expect(button.x).toBeGreaterThanOrEqual(0);
        expect(button.right).toBeLessThanOrEqual(layout.viewport);
        expect(button.textLines).toBe(1);
        if (index > 0) expect(button.y).toBeGreaterThanOrEqual(layout.buttons[index - 1]!.bottom);
        if (layout.toast) expect(layout.toast.y).toBeGreaterThanOrEqual(button.bottom);
      }
      if (layout.toast) {
        expect(layout.toast.x).toBeGreaterThanOrEqual(0);
        expect(layout.toast.right).toBeLessThanOrEqual(layout.viewport);
        expect(layout.toast.y).toBeGreaterThanOrEqual(layout.preview.bottom);
      }
    };
    await assertLayout();
    await page.getByRole("button", { name: "📋 コピー", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText(/コピーしました$/);
    await assertLayout();
    await page.screenshot({ path: test.info().outputPath(`mobile-${width}.png`), fullPage: true });
  });
}
