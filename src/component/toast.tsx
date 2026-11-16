import { CheckIcon } from "./icons";

export interface ToastProps {
  status: "idle" | "success" | "error";
  message: string;
}

/**
 * コピー結果の知らせ行。デザイン（design/project/states.dc.html の .st）に合わせ、
 * 絵文字・ピル背景をやめ、共有ボタンのすぐ下に置くプレーンな色付きテキストにした。
 * idle でも空のまま常に描画して1行分の高さを確保し、出現・消去でカードが
 * 伸び縮みしないようにする。ライブリージョンは中身を後から差し替えても確実に
 * 読み上げられるよう、空の状態から常時マウントしておく。
 */
export function Toast({ status, message }: ToastProps) {
  return (
    <p className={`toast${status === "error" ? " toast--error" : ""}`} role="status" aria-live="polite">
      {status === "success" && <CheckIcon size={16} />}
      {message}
    </p>
  );
}
