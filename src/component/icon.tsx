import type { ComponentChildren } from "preact";

// アイコンを絵文字にすると端末ごとに絵柄・幅が変わり、文字色（テーマ）にも従わない（des-07）。
// 線のインライン SVG にして stroke を currentColor にし、親要素の color に追従させる。
// 装飾なので aria-hidden にし、読み上げ名は常にボタン・行の文言側に任せる。
// path/viewBox/線幅は design/project/Screen.dc.html・Screen390.dc.html の写し。

interface BaseProps {
  size: number;
  strokeWidth?: number;
  children: ComponentChildren;
}

function Svg({ size, strokeWidth = 2, children }: BaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function NormalIcon() {
  return (
    <Svg size={24}>
      <path d="M3 8l3-3 3 3 3-3 3 3 3-3 3 3v8l-3 3-3-3-3 3-3-3-3 3-3-3z" />
    </Svg>
  );
}

export function SquareIcon() {
  return (
    <Svg size={24}>
      <rect x="3" y="6" width="18" height="12" rx="1" />
    </Svg>
  );
}

export function TanzakuIcon() {
  return (
    <Svg size={24}>
      <rect x="8" y="5" width="8" height="16" rx="1" />
      <path d="M12 2v3" />
    </Svg>
  );
}

export function StressIcon() {
  return (
    <Svg size={24}>
      <path d="M6 3l9 5-9 5 9 5" />
      <path d="M15 18h-4" />
      <path d="M15 18v-4" />
    </Svg>
  );
}

export function CopyIcon() {
  return (
    <Svg size={18}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </Svg>
  );
}

export function LinkIcon() {
  return (
    <Svg size={18}>
      <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" />
      <path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
    </Svg>
  );
}

/** コピー済みボタン用（18px）。デザインの states.dc.html どおり線幅 2.4。 */
export function CheckIcon({ size = 18 }: { size?: 16 | 18 }) {
  return (
    <Svg size={size} strokeWidth={2.4}>
      <path d="M5 12l5 5 9-10" />
    </Svg>
  );
}

export function MoonIcon() {
  return (
    <Svg size={20}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </Svg>
  );
}

/**
 * 太陽。デザインには月しか描かれていない（ダーク時の切替先の絵が無い）ため、
 * 月と同じ 24 のグリッド（viewBox）・描画 20px・線幅 2・丸端で、円（r=4）＋放射8本として実装側で描いた。
 */
export function SunIcon() {
  return (
    <Svg size={20}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}
