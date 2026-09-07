import type { ShapeKind } from "./type";

/** URL に載せる状態。text は入力テキスト全文（複数行可）。 */
export interface PermalinkState {
  text: string;
  shape: ShapeKind;
  vertical: boolean;
  padding: boolean;
}

// クエリ文字列の安全な上限（文字数）。エディタは入力文字数を制限しておらず、日本語は
// percent-encoding で1文字あたり最大9文字（3バイトUTF-8 × %XX）に膨らむため、長文を
// そのまま載せると一部のブラウザ・プロキシ・デプロイ環境のリクエストURL長制限に
// 引っかかって開けない・切り詰められるおそれがある（Codex bot 指摘）。この上限を
// 超える場合は「復元できる保証がないリンクを共有できると見せかける」ことを避け、
// URLへの同期・コピーの両方を行わない。
export const MAX_PERMALINK_QUERY_LENGTH = 4000;

const SHAPE_VALUES: readonly ShapeKind[] = ["normal", "square", "tanzaku", "stress"];

function isShapeKind(value: string | null): value is ShapeKind {
  return value !== null && (SHAPE_VALUES as readonly string[]).includes(value);
}

/**
 * クエリ文字列から状態を復元する。パラメータが無い・不正な場合は各項目 undefined を返し、
 * 呼び出し側の既定値（空文字・normal・false 等）にフォールバックさせる。
 *
 * 書き込み側（buildPermalinkQuery + isPermalinkQueryTooLong）は上限を超えるクエリを
 * 生成しないが、読み込み側はブラウザ履歴・ブックマーク・他者から共有された URL 等、
 * このアプリが書いたとは限らない任意の文字列を受け取る。上限チェックを書き込み時だけに
 * 課すと、細工された極端に長い text= を渡す URL で初回レンダー時に renderSuddenDeath へ
 * 巨大な文字列がそのまま渡り、初回ペイントが極端に重くなる・固まる恐れがある
 * （fresh evidence、自己レビューで指摘）。読み込み側でも同じ上限で弾き、
 * 超過時は text を既定値へフォールバックさせる。
 *
 * 上限は書き込み側（isPermalinkQueryTooLong）と同じく、クエリ文字列そのものの長さ
 * （percent-encoding 後・先頭 "?" 抜き）で判定する。復元後の文字数で判定すると、
 * 日本語1文字が最大9文字にエンコードされる分だけ基準がずれ、書き込み側が
 * 「長すぎて共有しない」と判断した URL を読み込み側だけが復元してしまう
 * （CodeRabbit 指摘、PR #20）。
 */
export function parsePermalink(search: string): Partial<PermalinkState> {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (isPermalinkQueryTooLong(query)) return {};

  const params = new URLSearchParams(search);
  const result: Partial<PermalinkState> = {};

  const text = params.get("text");
  if (text !== null) result.text = text;

  const shape = params.get("shape");
  if (isShapeKind(shape)) result.shape = shape;

  if (params.has("vertical")) result.vertical = params.get("vertical") === "1";
  if (params.has("padding")) result.padding = params.get("padding") === "1";

  return result;
}

/**
 * 状態からクエリ文字列（先頭 "?" 無し）を組み立てる。既定値と同じ項目は省略し、URL を短く保つ。
 */
export function buildPermalinkQuery(state: PermalinkState): string {
  const params = new URLSearchParams();
  if (state.text !== "") params.set("text", state.text);
  if (state.shape !== "normal") params.set("shape", state.shape);
  if (state.vertical) params.set("vertical", "1");
  if (state.padding) params.set("padding", "1");
  return params.toString();
}

/** クエリ文字列が安全な長さの上限を超えているか。超える場合はURL同期・コピーを行わない。 */
export function isPermalinkQueryTooLong(query: string): boolean {
  return query.length > MAX_PERMALINK_QUERY_LENGTH;
}
