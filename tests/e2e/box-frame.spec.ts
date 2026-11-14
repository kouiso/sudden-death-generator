import { test, expect, type Page } from "@playwright/test";

/**
 * 四角形・短冊の枠が「上の線・縦棒・下の線」のばらばらの部品に見える不具合（PBI #80, des-12）の検証。
 * 罫線グリフが行ボックスを満たしていないと行間に背景色の隙間が出る。
 * 逆に行を詰めすぎると隣の行のグリフと重なるので、4形状とも重なりと切れを見る。
 * 実描画のピクセルを測るため、スクリーンショットをブラウザ内の canvas で読み出して判定する。
 */

type ShapeCase = { name: string; input: string };

const shapes: ShapeCase[] = [
  { name: "通常", input: "突然の死\n二行目" },
  { name: "四角形", input: "突然の死\n二行目\n三行目" },
  { name: "短冊", input: "突然の死" },
  { name: "ストレス", input: "一行目\n二行目\n三行目\n四行目" },
];

const DPR = 3;
test.use({ deviceScaleFactor: DPR, viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

async function select(page: Page, shape: ShapeCase) {
  await page.getByRole("textbox", { name: "テキスト入力" }).fill(shape.input);
  await page.getByRole("radio", { name: shape.name, exact: true }).click();
  await expect(page.getByRole("radio", { name: shape.name, exact: true })).toHaveAttribute("aria-checked", "true");
  // 罫線サブセットフォントは使われて初めて読み込まれるため、描画前に確実に待つ。
  await page.evaluate(() => document.fonts.ready);
}

/**
 * PNG を canvas に展開し、背景(左上の画素)との差が最大差の4割を超える画素を「インク」とみなして測る。
 * 画素配列を Playwright 越しに渡すと遅いので、判定はブラウザ内で済ませて要約だけ返す。
 * 文字色と背景の差の4割以下の薄い画素（アンチエイリアスの縁）は隙間側に数える。
 */
type Measure = { colGaps: number[]; colFirst: number; rowTop: number; rowBottom: number };

async function measure(page: Page, png: Buffer, column?: number): Promise<Measure> {
  return page.evaluate(
    async ({ b64, column }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const px = (i: number) => d[i] ?? 0;
      const n = img.width * img.height;
      const dist = new Float32Array(n);
      let max = 0;
      for (let i = 0; i < n; i++) {
        const v = Math.abs(px(i * 4) - px(0)) + Math.abs(px(i * 4 + 1) - px(1)) + Math.abs(px(i * 4 + 2) - px(2));
        dist[i] = v;
        if (v > max) max = v;
      }
      const ink = (x: number, y: number) => (dist[y * img.width + x] ?? 0) > max * 0.4;
      let rowTop = -1;
      let rowBottom = -1;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          if (ink(x, y)) {
            if (rowTop < 0) rowTop = y;
            rowBottom = y;
            break;
          }
        }
      }
      let colFirst = -1;
      let colLast = -1;
      const colGaps: number[] = [];
      if (column !== undefined) {
        // 縦棒は 0.04〜0.12em と細く中心列が薄くなるため、左右1画素を併せて見る。
        const hit = (y: number) => [-1, 0, 1].some((dx) => ink(column + dx, y));
        for (let y = 0; y < img.height; y++) {
          if (hit(y)) {
            if (colFirst < 0) colFirst = y;
            colLast = y;
          }
        }
        for (let y = colFirst; colFirst >= 0 && y <= colLast; y++) if (!hit(y)) colGaps.push(y);
      }
      return { colGaps, colFirst, rowTop, rowBottom };
    },
    { b64: png.toString("base64"), column },
  );
}

test.describe("行の高さは枠の形だけ詰める", () => {
  // デザインは 16px/1.5 (=24px)。四角形・短冊だけ罫線をつなぐため 1em (=16px) にする。
  const expected: Record<string, string> = { 通常: "24px", 四角形: "16px", 短冊: "16px", ストレス: "24px" };
  for (const shape of shapes) {
    test(`${shape.name}: line-height は ${expected[shape.name]}`, async ({ page }) => {
      await select(page, shape);
      await expect(page.locator(".preview-pre")).toHaveCSS("line-height", expected[shape.name]!);
      await expect(page.locator(".preview-pre")).toHaveCSS("font-size", "16px");
    });
  }
});

test.describe("四角形・短冊の枠は行をまたいでつながって見える", () => {
  for (const shape of shapes.filter((s) => s.name === "四角形" || s.name === "短冊")) {
    test(`${shape.name}: 先頭文字の縦線に行間の隙間が無い`, async ({ page }) => {
      await select(page, shape);
      const pre = page.locator(".preview-pre");
      const box = (await pre.boundingBox())!;
      // 各行の先頭文字（┌│└ / ┏┃┗）の中心 x と行数を取る。罫線の縦棒は字幅の中央にある。
      const info = await pre.evaluate((el) => {
        const node = el.firstChild as Text;
        const text = node.data;
        const first = new Range();
        first.setStart(node, 0);
        first.setEnd(node, 1);
        const r = first.getBoundingClientRect();
        return { rows: text.split("\n").length, centerX: r.left + r.width / 2 };
      });
      expect(info.rows).toBeGreaterThanOrEqual(3);
      const px = Math.round((info.centerX - box.x) * DPR);
      const m = await measure(page, await pre.screenshot(), px);
      expect(m.colFirst, "縦線のインクが見つかる").toBeGreaterThanOrEqual(0);
      expect(m.colGaps, `縦線(x=${px}px)の途切れ画素y`).toEqual([]);
    });
  }
});

test.describe("行間を詰めても隣の行と重ならず、切れない", () => {
  for (const shape of shapes) {
    test(`${shape.name}: 行ごとのインクが重ならず表示領域に収まる`, async ({ page }) => {
      await select(page, shape);
      const scroll = page.locator(".preview-scroll");
      const pre = page.locator(".preview-pre");
      const original = (await pre.textContent())!;
      const lines = original.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(2);
      const area = (await scroll.boundingBox())!;
      // 切れの有無は、はみ出しを許した状態の実インクが表示領域に収まるかで見る。
      await scroll.evaluate((el) => { (el as HTMLElement).style.overflow = "visible"; });
      const margin = 12; // パネルの余白(20px)内に収め、クリップ内を単色の背景にする
      const clip = { x: area.x, y: Math.max(0, area.y - margin), width: area.width, height: area.height + margin * 2 };
      const spans: { top: number; bottom: number }[] = [];
      for (let i = 0; i < lines.length; i++) {
        // 他の行を空白に置き換えると、その行だけの字のインク範囲を隣の行に邪魔されず測れる。
        await pre.evaluate((el, text) => { el.textContent = text; }, lines.map((l, j) => (j === i ? l : " ".repeat(l.length))).join("\n"));
        const m = await measure(page, await page.screenshot({ clip }));
        expect(m.rowTop, `${i + 1}行目のインクが見える`).toBeGreaterThanOrEqual(0);
        spans.push({ top: clip.y + m.rowTop / DPR, bottom: clip.y + (m.rowBottom + 1) / DPR });
      }
      for (let i = 0; i + 1 < spans.length; i++) {
        const [cur, next] = [spans[i]!, spans[i + 1]!];
        // 縦に並ぶ罫線は端が接するだけが正常。1CSS px を超える食い込みを重なりとみなす。
        expect(cur.bottom - next.top, `${i + 1}行目と${i + 2}行目のインクの食い込み(px)`).toBeLessThanOrEqual(1);
      }
      expect(spans[0]!.top, "先頭行が上で切れない").toBeGreaterThanOrEqual(area.y - 0.5);
      expect(spans.at(-1)!.bottom, "最終行が下で切れない").toBeLessThanOrEqual(area.y + area.height + 0.5);
    });
  }
});
