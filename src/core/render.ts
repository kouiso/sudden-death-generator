import type { FrameGlyphs, RenderOptions } from "./types";
import { evenCeil, maxLineWidth, padCenterToWidth, padEndToWidth, splitGraphemes, stringWidth } from "./width";
import { toVerticalGlyph } from "./vertical";

/** 入力が空のときに使う既定文言。リアルタイムプレビューでも常に何かが見えるようにする。 */
const DEFAULT_TEXT = "突然の死";

const NORMAL_GLYPHS: FrameGlyphs = {
  topLeft: "＿",
  top: "人",
  topRight: "＿",
  left: "＞",
  right: "＜",
  bottomLeft: "￣",
  bottom: "Y^",
  bottomRight: "￣",
};

const SQUARE_GLYPHS: FrameGlyphs = {
  topLeft: "┌",
  top: "─",
  topRight: "┐",
  left: "│",
  right: "│",
  bottomLeft: "└",
  bottom: "─",
  bottomRight: "┘",
};

const ZIGZAG_DOWN = "　　　　↘";
const ZIGZAG_UP = "　　　　↙";
const STRESS_INDENT = "　　　";

/** 空行を除いた入力行を返す。全て空なら既定文言1行にフォールバックする。 */
function parseLines(rawInput: string): string[] {
  const lines = rawInput.split("\n").filter((line) => line.trim().length > 0);
  return lines.length > 0 ? lines : [DEFAULT_TEXT];
}

/**
 * 通常形・四角形の共通の枠組み。内容行の最大幅から枠の桁数を導出するため、
 * 「本体幅が決まってから枠を組む」順序になり、枠と本体の桁ズレが構造的に起きない。
 */
function renderFramed(lines: readonly string[], glyphs: FrameGlyphs, padding: boolean): string[] {
  const contentLines = padding ? ["", ...lines, ""] : lines;
  const targetWidth = evenCeil(maxLineWidth(contentLines));
  // 枠の左右対称性 (topLeft+top×N+topRight の幅 = 本体行の幅) から N を逆算する。
  // 本体行の幅 = left(2) + 全角空白(2) + targetWidth + 全角空白(2) + right(2) = targetWidth+8
  // 枠の幅   = topLeft(2) + top(2)×N + topRight(2) = targetWidth+8  →  N = targetWidth/2 + 2
  const repeat = targetWidth / 2 + 2;
  const top = glyphs.topLeft + glyphs.top.repeat(repeat) + glyphs.topRight;
  const bottom = glyphs.bottomLeft + glyphs.bottom.repeat(repeat) + glyphs.bottomRight;
  const middle = contentLines.map(
    (line) => glyphs.left + "　" + padEndToWidth(line, targetWidth) + "　" + glyphs.right,
  );
  return [top, ...middle, bottom];
}

/**
 * 縦書き用に複数行を「列」へ変換する。日本語の縦書きは右→左に列が進むため、
 * 入力の最初の行が最も右側の列になるよう反転してから積む。各文字は
 * toVerticalGlyph で縦書き提示形に変換される。戻り値は横1行ずつの文字列配列で、
 * renderFramed にそのまま渡せる（枠のロジックと縦書きのロジックを分離するため）。
 */
function buildVerticalRows(lines: readonly string[]): string[] {
  const columns = [...lines].reverse().map((line) => splitGraphemes(line).map(toVerticalGlyph));
  const height = columns.reduce((max, col) => Math.max(max, col.length), 0);
  const cellWidth = evenCeil(
    columns.reduce((max, col) => col.reduce((m, ch) => Math.max(m, stringWidth(ch)), max), 1),
  );

  const rows: string[] = [];
  for (let r = 0; r < height; r++) {
    const cells = columns.map((col) => padCenterToWidth(col[r] ?? "", cellWidth));
    rows.push(cells.join("　"));
  }
  return rows;
}

/** 短冊1本分の枠。文字を縦一列に積み、常に縦書き字形へ変換する。 */
function renderTanzakuFrame(line: string, padding: boolean): string {
  const chars = splitGraphemes(line).map(toVerticalGlyph);
  const cells = padding ? ["", ...chars, ""] : chars;
  const cellWidth = evenCeil(cells.reduce((max, ch) => Math.max(max, stringWidth(ch)), 2));
  const repeat = cellWidth / 2;
  const top = "┏" + "━".repeat(repeat) + "┓";
  const bottom = "┗" + "━".repeat(repeat) + "┛";
  const rows = cells.map((ch) => "┃" + padCenterToWidth(ch, cellWidth) + "┃");
  return [top, ...rows, bottom].join("\n");
}

/** 短冊は入力行ごとに1本の短冊を生成し、複数行なら空行区切りで並べる。 */
function renderTanzaku(lines: readonly string[], padding: boolean): string {
  return lines.map((line) => renderTanzakuFrame(line, padding)).join("\n\n");
}

/**
 * ストレス形状。入力行を順番に「↘」で繋いで積み上げ、最後の行をもう一度強調してから
 * 「↙」で受け、最終行だけを通常形の枠で締める。ストレスの蓄積 → 突然の死、という
 * 見せ方そのものが形状の定義なので、縦書きオプションはこの形状には影響しない
 * （内部の枠だけを縦書きにすると蓄積ラインとの整合が崩れるため、意図的に対象外とする）。
 */
function renderStress(lines: readonly string[], padding: boolean): string {
  const rows: string[] = [];
  for (const line of lines) {
    rows.push(line);
    rows.push(ZIGZAG_DOWN);
  }
  const last = lines[lines.length - 1] ?? DEFAULT_TEXT;
  rows.push(STRESS_INDENT + last);
  rows.push(ZIGZAG_UP);
  rows.push(...renderFramed([last], NORMAL_GLYPHS, padding));
  return rows.join("\n");
}

/** 入力テキストとオプションから AA 文字列を生成する。純粋関数で副作用を持たない。 */
export function renderSuddenDeath(rawInput: string, options: RenderOptions): string {
  const lines = parseLines(rawInput);

  if (options.shape === "tanzaku") {
    return renderTanzaku(lines, options.padding);
  }
  if (options.shape === "stress") {
    return renderStress(lines, options.padding);
  }

  const glyphs = options.shape === "square" ? SQUARE_GLYPHS : NORMAL_GLYPHS;
  const contentLines = options.vertical ? buildVerticalRows(lines) : lines;
  return renderFramed(contentLines, glyphs, options.padding).join("\n");
}

export { DEFAULT_TEXT };
