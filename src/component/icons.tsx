// 絵文字アイコンの置き換え用の線アイコン集。パスはデザイン
// （design/project/Screen.dc.html, states.dc.html）に描かれた svg をそのまま使う。
// 絵文字は OS ごとに見た目が変わり字形もフォント依存のため、stroke=currentColor の
// 線アイコンに揃えてどの環境でも同じ見た目にする。

interface IconProps {
  /** 表示サイズ（px）。デザイン上の指定値を呼び出し側から渡す。 */
  size?: number;
}

/** 「押した後」の状態と成功の知らせに使うチェック。 */
export function CheckIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** 「コピー」ボタンの重なった2枚の紙。 */
export function CopyIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </svg>
  );
}

/** 「リンクをコピー」ボタンのチェーン。 */
export function LinkIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" />
      <path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
    </svg>
  );
}

// ---- スタイル選択（形状）のアイコン。いずれも 24px 角で描かれている ----

export function NormalShapeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8l3-3 3 3 3-3 3 3 3-3 3 3v8l-3 3-3-3-3 3-3-3-3 3-3-3z" />
    </svg>
  );
}

export function SquareShapeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="1" />
    </svg>
  );
}

export function TanzakuShapeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="5" width="8" height="16" rx="1" />
      <path d="M12 2v3" />
    </svg>
  );
}

export function StressShapeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3l9 5-9 5 9 5" />
      <path d="M15 18h-4" />
      <path d="M15 18v-4" />
    </svg>
  );
}

// ---- テーマ切り替え ----

/** 明るい表示で出す月（押すと暗い表示へ）。デザインの .tg にある svg と同じパス。 */
export function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

/** 暗い表示で出す太陽（押すと明るい表示へ）。デザインには月しか無いため、
 * 同じ線スタイル（stroke 2px・角丸端）で太陽を補った。 */
export function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
