// core の唯一の入口。UI（src/app.tsx, src/component/*）はここからだけ読み込む。
// 画面が使うものだけを出す。内部でしか使わない関数（幅計算など）は各ファイルから
// 直接読み込めば足りるので、ここには出さない（公開面を狭く保つ）。
export { renderSuddenDeath } from "./render";
export type { ShapeKind } from "./type";
export {
  parsePermalink,
  buildPermalinkQuery,
  isPermalinkQueryTooLong,
  MAX_PERMALINK_QUERY_LENGTH,
} from "./permalink";
export { buildXShareUrl, buildLineShareUrl, isShareTooLong } from "./share";
// [dry-run] #104 の定義表を #101 の「画面は ./core の入口だけから読む」に合わせて入口から出す。
export { SHAPE_KINDS, isVerticalDisabled, resolveVertical, verticalHintOf } from "./shape";
