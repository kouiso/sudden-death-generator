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
 *
 * 句読点・括弧類は全角形（，：；！？（）｛｝［］）だけでなく、対応する ASCII 半角形
 * （,:;!?(){}[]）も同じ提示形へ変換する。ASCII 版と全角版は幅が違うだけで字形の意味は
 * 同一であり、"突然!?" や "(突然)" のように ASCII 記号混じりの日本語インターネット文が
 * 縦書きで横向きのまま残る不具合の対策（fresh evidence、Codex bot 指摘）。ただし ASCII
 * ピリオド"."は全角句点「。」とは字形が別物（点 vs 丸）なので対象外とする。
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
  // ASCII半角の句読点・括弧（全角形と字形の意味が同じもののみ。ピリオドは対象外）
  [",", "\u{FE10}"],
  [":", "\u{FE13}"],
  [";", "\u{FE14}"],
  ["!", "\u{FE15}"],
  ["?", "\u{FE16}"],
  ["(", "\u{FE35}"],
  [")", "\u{FE36}"],
  ["{", "\u{FE37}"],
  ["}", "\u{FE38}"],
  ["[", "\u{FE47}"],
  ["]", "\u{FE48}"],
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

function lookup(char: string): string | undefined {
  return VERTICAL_GLYPH_MAP.get(char) ?? ARROW_ROTATION_MAP.get(char);
}

/**
 * 1書記素クラスタを縦書き用の字形に変換する。対応する提示形が無い場合はそのまま返す。
 *
 * クラスタ全体でのマッチを先に試し、失敗した場合のみ先頭（基底）コードポイントだけで
 * 再度マッチを試みる。これは矢印の絵文字提示形（例: ↗️ = U+2197 + VS16）が Intl.Segmenter に
 * より1クラスタとして渡ってくると、矢印そのものはマップにあるのに全体一致では見つからず
 * 回転が素通りしてしまう不具合の対策（Codex bot 指摘）。基底文字が一致した場合は、VS16 等の
 * 提示形セレクタは破棄する（回転後の矢印はテキスト提示のみを想定しており、破棄しても
 * charWidth 側の全角判定には影響しない）。
 */
export function toVerticalGlyph(cluster: string): string {
  const direct = lookup(cluster);
  if (direct) return direct;

  const codePoints = Array.from(cluster);
  if (codePoints.length > 1) {
    const base = codePoints[0] ?? "";
    const rotatedBase = lookup(base);
    if (rotatedBase) return rotatedBase;
  }

  return cluster;
}
