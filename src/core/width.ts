import type { CharWidth } from "./types";

const ASCII_PRINTABLE_START = 0x20;
const ASCII_PRINTABLE_END = 0x7e;

// タブ(U+0009)。white-space:pre 下ではタブストップ(既定 tab-size:8)で可変幅描画され、
// 固定幅の計算と食い違って枠がズレる（実機で "A\tB" を入力して確認した不具合）。
// タブストップの可変計算までは行わず、CSS 側の tab-size を 1 に固定して「タブ=半角
// スペース1個」として描画・計算の両方を一致させる（preview-pre 参照）。
const TAB = 0x09;

// 半角カタカナ・半角句読点 (｡-ﾟ)
const HALFWIDTH_KANA_START = 0xff61;
const HALFWIDTH_KANA_END = 0xff9f;

// Variation Selector-16。基底コードポイントを絵文字表示（emoji presentation）に
// 強制する結合文字。"1"+VS16+U+20E3(combining enclosing keycap) の合字（1️⃣ 等）は
// 基底が ASCII 数字のため単体では半角判定されるが、実際のブラウザ描画は正方形の
// 絵文字として全角幅になる（実機で "1️⃣" を入力して右にズレるのを確認した不具合）。
const VARIATION_SELECTOR_EMOJI = 0xfe0f;

// 半角濁点・半角半濁点（ﾞﾟ）。Unicode の一般カテゴリは Lm（結合文字ではなく独立した文字）で、
// 実際のブラウザ描画でも半角カナ1文字ぶんの幅を占有する。ところが Intl.Segmenter は
// "ｶﾞ"（U+FF76+U+FF9E）を1書記素クラスタにまとめてしまうため、クラスタの先頭コードポイント
// だけを見ると濁点の分の幅が消えてしまう（実機で "ｶﾞｷﾞ" を入力し、枠が本体より1桁狭くなる
// 崩れを確認した不具合、Codex bot 指摘）。
const HALFWIDTH_VOICE_MARK = 0xff9e;
const HALFWIDTH_SEMI_VOICE_MARK = 0xff9f;

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
 * ASCII 印字可能域・半角カタカナのみ半角(1)、それ以外は全角(2)とみなす。
 * 日本語（漢字・かな・全角記号）と ASCII の混在だけを想定した実務的な簡略化。
 * ラテン文字拡張・キリル・ギリシャ等の非日本語文字は対象外（本ツールは日本語入力前提）。
 */
export function charWidth(codePoint: number): CharWidth {
  if (codePoint === TAB) return 1;
  if (codePoint >= ASCII_PRINTABLE_START && codePoint <= ASCII_PRINTABLE_END) return 1;
  if (codePoint >= HALFWIDTH_KANA_START && codePoint <= HALFWIDTH_KANA_END) return 1;
  return 2;
}

/**
 * 1書記素クラスタの表示幅を返す。結合文字・Variation Selector・ZWJ 結合部分は
 * 表示上ゼロ幅なので、原則クラスタの先頭（基底）コードポイントの幅だけを見る。
 * ただし以下はクラスタ全体を見て例外的に扱う:
 * - VS16 を含むクラスタ（1️⃣ 等の keycap 絵文字）は基底が半角文字でも絵文字として全角描画される
 * - 半角濁点・半角半濁点を含むクラスタ（ｶﾞ 等）はゼロ幅ではなく、基底文字と合わせて半角2文字ぶんを占有する
 */
export function clusterWidth(cluster: string): CharWidth {
  const codePoints = Array.from(cluster, (ch) => ch.codePointAt(0) ?? 0);
  if (codePoints.some((cp) => cp === VARIATION_SELECTOR_EMOJI)) {
    return 2;
  }
  if (codePoints.length > 1 && codePoints.some((cp) => cp === HALFWIDTH_VOICE_MARK || cp === HALFWIDTH_SEMI_VOICE_MARK)) {
    return 2;
  }
  return charWidth(codePoints[0] ?? 0);
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
