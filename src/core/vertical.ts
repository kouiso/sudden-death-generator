/**
 * 縦書き変換。
 *
 * Unicode の「Vertical Forms」ブロック (U+FE10–FE19) と「CJK Compatibility Forms」
 * ブロック (U+FE30–FE4F) が定める正式な縦書き提示形にのみ基づく。句読点・かぎ括弧の
 * ように縦書き専用の提示形が規格として存在する文字だけを変換し、規格に無い文字（漢字・
 * 仮名など大半の文字）はそのまま素通しする。
 *
 * 長音符「ー」は縦書き専用の提示形を Unicode が定めていない（フォント側のグリフ差し替えで
 * 対応するのが一般的）ため、視覚的な近似として縦棒 U+FF5C に置き換える。この1点のみ規格に
 * 基づかない近似であることを明記する。
 */
// 文字リテラルは見た目が非常に近い「Small Form Variants」(U+FE50台) と混同しやすいため、
// \u{} エスケープでコードポイントを明示する（過去に一度この転記ミスを実測で検出したため）。
const VERTICAL_GLYPH_MAP: ReadonlyMap<string, string> = new Map([
  ["、", "\u{FE11}"], // U+3001 → U+FE11 VERTICAL IDEOGRAPHIC COMMA
  ["。", "\u{FE12}"], // U+3002 → U+FE12 VERTICAL IDEOGRAPHIC FULL STOP
  ["「", "\u{FE41}"], // U+300C → U+FE41 VERTICAL LEFT CORNER BRACKET
  ["」", "\u{FE42}"], // U+300D → U+FE42 VERTICAL RIGHT CORNER BRACKET
  ["『", "\u{FE43}"], // U+300E → U+FE43 VERTICAL LEFT WHITE CORNER BRACKET
  ["』", "\u{FE44}"], // U+300F → U+FE44 VERTICAL RIGHT WHITE CORNER BRACKET
  ["（", "\u{FE35}"], // U+FF08 → U+FE35 PRESENTATION FORM FOR VERTICAL LEFT PARENTHESIS
  ["）", "\u{FE36}"], // U+FF09 → U+FE36 PRESENTATION FORM FOR VERTICAL RIGHT PARENTHESIS
  ["ー", "\u{FF5C}"], // 近似（Unicode に専用提示形なし。FULLWIDTH VERTICAL LINE で代替）
]);

/**
 * 矢印を書字方向の90°回転則で変換する。横書きの「進行方向」を縦書きでも保つための変換で、
 * 例えば → (右=横書きの前方) は ↓ (下=縦書きの前方) になる。この規則は本実装独自の定義。
 */
const ARROW_ROTATION_MAP: ReadonlyMap<string, string> = new Map([
  ["→", "↓"],
  ["↓", "←"],
  ["←", "↑"],
  ["↑", "→"],
  ["↘", "↙"],
  ["↙", "↖"],
  ["↖", "↗"],
  ["↗", "↘"],
]);

/** 1文字を縦書き用の字形に変換する。対応する提示形が無い文字はそのまま返す。 */
export function toVerticalGlyph(char: string): string {
  return VERTICAL_GLYPH_MAP.get(char) ?? ARROW_ROTATION_MAP.get(char) ?? char;
}
