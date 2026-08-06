import type { ShapeKind } from "./types";

/** URL に載せる状態。text は入力テキスト全文（複数行可）。 */
export interface PermalinkState {
  text: string;
  shape: ShapeKind;
  vertical: boolean;
  padding: boolean;
}

const SHAPE_VALUES: readonly ShapeKind[] = ["normal", "square", "tanzaku", "stress"];

function isShapeKind(value: string | null): value is ShapeKind {
  return value !== null && (SHAPE_VALUES as readonly string[]).includes(value);
}

/**
 * クエリ文字列から状態を復元する。パラメータが無い・不正な場合は各項目 undefined を返し、
 * 呼び出し側の既定値（空文字・normal・false 等）にフォールバックさせる。
 */
export function parsePermalink(search: string): Partial<PermalinkState> {
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
