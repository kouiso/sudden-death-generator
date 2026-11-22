import { CheckIcon } from "./icon";

export interface NoticeProps {
  /** 知らせの種類。info は押せない理由（アイコン無し）。null は何も出さない（行の高さだけ確保したまま空にする）。 */
  status: "success" | "error" | "info" | null;
  message: string;
}

/**
 * コピー結果の知らせ行。共有ボタンのすぐ下に置く。
 * 行そのものは常に描画し高さ（24px）を先に確保する。出る・消えるたびに行を差し込むと
 * カードの高さが変わり、下の要素が押し下げられて操作中のボタンがずれるため。
 * role="status" も常に DOM に置く。後から現れる live region は読み上げられない
 * スクリーンリーダーがあるので、中身だけを差し替える。
 */
export function Notice({ status, message }: NoticeProps) {
  return (
    <p className={`notice ${status === "error" ? "notice--error" : ""} ${status === "info" ? "notice--info" : ""}`} role="status" aria-live="polite">
      {status !== null && (
        <>
          {/* 失敗は色（--color-danger）と文言だけで示す。デザインの states.dc.html に失敗用の絵が無いため。 */}
          {status === "success" && <CheckIcon size={16} />}
          <span>{message}</span>
        </>
      )}
    </p>
  );
}
