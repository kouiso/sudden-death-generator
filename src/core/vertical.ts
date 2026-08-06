/**
 * 縦書き変換。
 *
 * Unicode の「Vertical Forms」ブロック (U+FE10–FE19) と「CJK Compatibility Forms」
 * ブロック (U+FE30–FE4F) が定める正式な縦書き提示形にのみ基づく。句読点・かぎ括弧の
 * ように縦書き専用の提示形が規格として存在する文字だけを変換し、規格に無い文字（漢字・
 * 仮名など大半の文字）はそのまま素通しする。
 *
 * 長音符「ー」及び同じ「横棒」の意味で使われる同系記号（－ 全角ハイフンマイナス、− マイナス
 * 記号、─ 罫線）は縦書き専用の提示形を Unicode が定めていない（フォント側のグリフ差し替えで
 * 対応するのが一般的）ため、視覚的な近似として縦棒 U+FF5C に置き換える。この横棒系4文字のみ
 * 規格に基づかない近似であることを明記する。〜／＝ 等その他の記号は対応する提示形が無いため
 * 変換せず素通しする（既知の制約。個別に記号を発明して埋めることはしない）。
 */
// 文字リテラルは見た目が非常に近い「Small Form Variants」(U+FE50台) と混同しやすいため、
// \u{} エスケープでコードポイントを明示する（過去に一度この転記ミスを実測で検出したため）。
const VERTICAL_GLYPH_MAP: ReadonlyMap<string, string> = new Map([
  ["、", "\u{FE11}"], // U+3001 → U+FE11 VERTICAL IDEOGRAPHIC COMMA
  ["。", "\u{FE12}"], // U+3002 → U+FE12 VERTICAL IDEOGRAPHIC FULL STOP
  ["，", "\u{FE10}"], // U+FF0C → U+FE10 PRESENTATION FORM FOR VERTICAL COMMA
  ["：", "\u{FE13}"], // U+FF1A → U+FE13 PRESENTATION FORM FOR VERTICAL COLON
  ["；", "\u{FE14}"], // U+FF1B → U+FE14 PRESENTATION FORM FOR VERTICAL SEMICOLON
  ["！", "\u{FE15}"], // U+FF01 → U+FE15 PRESENTATION FORM FOR VERTICAL EXCLAMATION MARK
  ["？", "\u{FE16}"], // U+FF1F → U+FE16 PRESENTATION FORM FOR VERTICAL QUESTION MARK
  ["…", "\u{FE19}"], // U+2026 → U+FE19 PRESENTATION FORM FOR VERTICAL HORIZONTAL ELLIPSIS
  ["「", "\u{FE41}"], // U+300C → U+FE41 VERTICAL LEFT CORNER BRACKET
  ["」", "\u{FE42}"], // U+300D → U+FE42 VERTICAL RIGHT CORNER BRACKET
  ["『", "\u{FE43}"], // U+300E → U+FE43 VERTICAL LEFT WHITE CORNER BRACKET
  ["』", "\u{FE44}"], // U+300F → U+FE44 VERTICAL RIGHT WHITE CORNER BRACKET
  ["（", "\u{FE35}"], // U+FF08 → U+FE35 PRESENTATION FORM FOR VERTICAL LEFT PARENTHESIS
  ["）", "\u{FE36}"], // U+FF09 → U+FE36 PRESENTATION FORM FOR VERTICAL RIGHT PARENTHESIS
  ["｛", "\u{FE37}"], // U+FF5B → U+FE37 PRESENTATION FORM FOR VERTICAL LEFT CURLY BRACKET
  ["｝", "\u{FE38}"], // U+FF5D → U+FE38 PRESENTATION FORM FOR VERTICAL RIGHT CURLY BRACKET
  ["［", "\u{FE47}"], // U+FF3B → U+FE47 PRESENTATION FORM FOR VERTICAL LEFT SQUARE BRACKET
  ["］", "\u{FE48}"], // U+FF3D → U+FE48 PRESENTATION FORM FOR VERTICAL RIGHT SQUARE BRACKET
  ["〔", "\u{FE39}"], // U+3014 → U+FE39 PRESENTATION FORM FOR VERTICAL LEFT TORTOISE SHELL BRACKET
  ["〕", "\u{FE3A}"], // U+3015 → U+FE3A PRESENTATION FORM FOR VERTICAL RIGHT TORTOISE SHELL BRACKET
  ["【", "\u{FE3B}"], // U+3010 → U+FE3B PRESENTATION FORM FOR VERTICAL LEFT BLACK LENTICULAR BRACKET
  ["】", "\u{FE3C}"], // U+3011 → U+FE3C PRESENTATION FORM FOR VERTICAL RIGHT BLACK LENTICULAR BRACKET
  ["〖", "\u{FE17}"], // U+3016 → U+FE17 PRESENTATION FORM FOR VERTICAL LEFT WHITE LENTICULAR BRACKET
  ["〗", "\u{FE18}"], // U+3017 → U+FE18 PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRACKET
  ["《", "\u{FE3D}"], // U+300A → U+FE3D PRESENTATION FORM FOR VERTICAL LEFT DOUBLE ANGLE BRACKET
  ["》", "\u{FE3E}"], // U+300B → U+FE3E PRESENTATION FORM FOR VERTICAL RIGHT DOUBLE ANGLE BRACKET
  ["〈", "\u{FE3F}"], // U+3008 → U+FE3F PRESENTATION FORM FOR VERTICAL LEFT ANGLE BRACKET
  ["〉", "\u{FE40}"], // U+3009 → U+FE40 PRESENTATION FORM FOR VERTICAL RIGHT ANGLE BRACKET
  ["ー", "\u{FF5C}"], // 近似（Unicode に専用提示形なし。FULLWIDTH VERTICAL LINE で代替）
  ["－", "\u{FF5C}"], // 同上（全角ハイフンマイナス）
  ["−", "\u{FF5C}"], // 同上（マイナス記号）
  ["─", "\u{FF5C}"], // 同上（罫線）
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
