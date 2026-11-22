import { isPermalinkQueryTooLong } from "./permalink";

const X_SHARE_BASE = "https://twitter.com/intent/tweet";
// LINE 公式ドキュメントが現在案内する共有スキームは R/share?text=。
// 旧 R/msg/text/ は非掲載でクライアントによっては共有ピッカーが開かない
// (実機で開かないため Codex bot 指摘を受け確認・修正)。
const LINE_SHARE_BASE = "https://line.me/R/share";

/**
 * X・LINE 共通の共有 URL のクエリ部分（先頭 "?" 無し）。
 * URL の組み立てと「長すぎる」判定の両方がこの 1 関数の結果を使う。判定側が別の式で
 * 同じ形を再現していると、URL の形を変えた時に判定だけ取り残されてずれるため。
 */
export function buildShareQuery(text: string): string {
  return `text=${encodeURIComponent(text)}`;
}

export function buildXShareUrl(text: string): string {
  return `${X_SHARE_BASE}?${buildShareQuery(text)}`;
}

export function buildLineShareUrl(text: string): string {
  return `${LINE_SHARE_BASE}?${buildShareQuery(text)}`;
}

/**
 * 共有 URL が安全な長さの上限を超えるか。超えると一部環境の URL 長制限で開けない。
 * X/LINE の URL は本体出力（枠のパディング込み）を丸ごと載せるため、入力テキストだけを
 * 載せるパーマリンクより長くなりやすい。新たな閾値を当て推量で作らず、パーマリンクと
 * 同じ上限（MAX_PERMALINK_QUERY_LENGTH）を共有クエリに当てる。
 */
export function isShareTooLong(text: string): boolean {
  return isPermalinkQueryTooLong(buildShareQuery(text));
}
