import type { CharWidth } from "./types";

const ASCII_PRINTABLE_START = 0x20;
const ASCII_PRINTABLE_END = 0x7e;

// 半角カタカナ・半角句読点 (｡-ﾟ)
const HALFWIDTH_KANA_START = 0xff61;
const HALFWIDTH_KANA_END = 0xff9f;

// 伝統的な wcwidth 実装が半角扱いする Latin-1 の記号 (¢ £ ¥ ¦ ¬ ¯)
const NARROW_LATIN1 = new Set([0xa2, 0xa3, 0xa5, 0xa6, 0xac, 0xaf]);

const FULL_WIDTH_SPACE = "　";

// 書記素クラスタ単位で分割する。合字（結合文字・Variation Selector・ZWJ シーケンス）を
// コードポイント単位でバラすと、見た目は1文字でも複数文字分の幅として数えてしまい、
// 縦書きでも1文字が複数行に分裂する。Unicode 標準の書記素分割 (UAX #29) に従う
// Intl.Segmenter を使うことでこれを避ける。
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** 文字列を書記素クラスタ（見た目上の1文字）の配列に分割する。 */
export function splitGraphemes(value: string): string[] {
  return Array.from(GRAPHEME_SEGMENTER.segment(value), (s) => s.segment);
}

/**
 * 1コードポイントの表示幅を返す。
 * ASCII 印字可能域・半角カタカナ・一部の半角記号のみ半角(1)、それ以外は全角(2)とみなす。
 * East Asian Width の Halfwidth/Narrow 以外を Wide とみなす実務的な簡略化で、
 * 絵文字や罫線・矢印など判定が難しい文字も一律で全角として扱うことで枠幅計算を安定させる。
 */
export function charWidth(codePoint: number): CharWidth {
  if (codePoint >= ASCII_PRINTABLE_START && codePoint <= ASCII_PRINTABLE_END) return 1;
  if (codePoint >= HALFWIDTH_KANA_START && codePoint <= HALFWIDTH_KANA_END) return 1;
  if (NARROW_LATIN1.has(codePoint)) return 1;
  return 2;
}

/**
 * 1書記素クラスタの表示幅を返す。結合文字・Variation Selector・ZWJ 結合部分は
 * 表示上ゼロ幅なので、クラスタの先頭（基底）コードポイントの幅だけを見る。
 */
export function clusterWidth(cluster: string): CharWidth {
  return charWidth(cluster.codePointAt(0) ?? 0);
}

/** 文字列全体の表示幅（半角=1 / 全角=2 の合計）。書記素クラスタ単位で数える。 */
export function stringWidth(value: string): number {
  let width = 0;
  for (const cluster of splitGraphemes(value)) {
    width += clusterWidth(cluster);
  }
  return width;
}

/** 複数行のうち最大の表示幅を返す。空配列なら 0。 */
export function maxLineWidth(lines: readonly string[]): number {
  let max = 0;
  for (const line of lines) {
    const w = stringWidth(line);
    if (w > max) max = w;
  }
  return max;
}

/** 奇数幅を偶数へ切り上げる。枠の左右対称性を保つため、内容幅は常に偶数で扱う。 */
export function evenCeil(width: number): number {
  return width + (width % 2);
}

/**
 * 表示幅ぶんの空白を返す。2桁ごとに全角スペース、余り1桁は半角スペースで正確に埋める。
 * 全角スペースのみで埋めると奇数幅を表現できず1桁ズレるため、半角/全角を併用する。
 */
function spacesForWidth(width: number): string {
  if (width <= 0) return "";
  const fullSpaces = Math.floor(width / 2);
  const halfSpace = width % 2 === 1 ? " " : "";
  return FULL_WIDTH_SPACE.repeat(fullSpaces) + halfSpace;
}

/** value の右側を targetWidth まで空白で埋める（左詰め）。 */
export function padEndToWidth(value: string, targetWidth: number): string {
  return value + spacesForWidth(targetWidth - stringWidth(value));
}

/** value を targetWidth の中央に配置する（左右の余りは右側に1単位多く割る）。 */
export function padCenterToWidth(value: string, targetWidth: number): string {
  const deficit = targetWidth - stringWidth(value);
  if (deficit <= 0) return value;
  const left = Math.floor(deficit / 2);
  const right = deficit - left;
  return spacesForWidth(left) + value + spacesForWidth(right);
}
