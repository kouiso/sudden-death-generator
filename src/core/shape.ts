/**
 * 形状の定義表。「どの形状があるか」と「縦書きオプションがどう効くか」の唯一の出所。
 * 以前は形状一覧が型・permalink・UI に、縦書きの規則が render・permalink・UI に
 * 別々の式で書かれており、形状を足すたびに全部を直す必要があった。
 * 表示順（UI のピッカー順）もこの配列の順序に従う。
 *
 * vertical の意味:
 * - "free":   縦書きオプションが効く（通常・四角形）
 * - "always": 常に縦書き。紙の短冊自体が縦長のため、オプションは無視される（短冊）
 * - "none":   縦書きが適用外。蓄積ラインとの整合が崩れるため、オプションは効かない（ストレス）
 */
export const SHAPE_TABLE = [
  { value: "normal", vertical: "free" },
  { value: "square", vertical: "free" },
  { value: "tanzaku", vertical: "always", verticalHint: "（短冊は常に縦書き）" },
  { value: "stress", vertical: "none", verticalHint: "（ストレスには影響しません）" },
] as const;

export type ShapeKind = (typeof SHAPE_TABLE)[number]["value"];
export type VerticalRule = (typeof SHAPE_TABLE)[number]["vertical"];

/** 表の順に並んだ形状値の一覧。 */
export const SHAPE_KINDS: readonly ShapeKind[] = SHAPE_TABLE.map((entry) => entry.value);

export function isShapeKind(value: string | null): value is ShapeKind {
  return value !== null && (SHAPE_KINDS as readonly string[]).includes(value);
}

export function verticalRuleOf(shape: ShapeKind): VerticalRule {
  // 表に無い値は型で排除されているので、find は必ず見つかる
  return SHAPE_TABLE.find((entry) => entry.value === shape)!.vertical;
}

/** 縦書きオプションの値が見た目・復元結果を左右する形状か（permalink に vertical を載せる条件）。 */
export function isVerticalMeaningful(shape: ShapeKind): boolean {
  return verticalRuleOf(shape) === "free";
}

/** UI のチェックボックスを無効化すべき形状か（値が見た目に影響しない形状）。 */
export function isVerticalDisabled(shape: ShapeKind): boolean {
  return verticalRuleOf(shape) !== "free";
}

/** 無効化されたチェックボックスに添える説明。無効化しない形状では空文字。 */
export function verticalHintOf(shape: ShapeKind): string {
  const entry = SHAPE_TABLE.find((e) => e.value === shape)!;
  return "verticalHint" in entry ? entry.verticalHint : "";
}

/**
 * ユーザーが選んだ縦書き値を、形状の規則に従って実際に使う値へ解決する。
 * "always" だけ強制的に true にする。"none" は値をそのまま通す（描画側が無視し、
 * UI のチェック状態は形状を切り替えて戻したときに保たれる）。
 */
export function resolveVertical(shape: ShapeKind, vertical: boolean): boolean {
  return verticalRuleOf(shape) === "always" ? true : vertical;
}
