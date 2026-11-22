import { useRef } from "preact/hooks";
import type { ComponentType, TargetedKeyboardEvent } from "preact";
import { SHAPE_KINDS, type ShapeKind } from "../core";
import { NormalIcon, SquareIcon, StressIcon, TanzakuIcon } from "./icon";

export interface ShapePickerProps {
  value: ShapeKind;
  onChange: (shape: ShapeKind) => void;
}

// accessKey は echo-sd のショートカット割り当て(N/4/T/S)に合わせる（機能面の参考、コードは転記していない）。
// 形状の一覧と順序は core の定義表から導出し、ここは表示用の属性だけを持つ
// （Record にすることで、形状が増えたときに型エラーで追記漏れに気づける）。
// アイコンは文字色に従う線の SVG（des-07、icon.tsx 参照）。
const SHAPE_VIEW: Record<ShapeKind, { label: string; Icon: ComponentType; accessKey: string }> = {
  normal: { label: "通常", Icon: NormalIcon, accessKey: "n" },
  square: { label: "四角形", Icon: SquareIcon, accessKey: "4" },
  tanzaku: { label: "短冊", Icon: TanzakuIcon, accessKey: "t" },
  stress: { label: "ストレス", Icon: StressIcon, accessKey: "s" },
};
const SHAPES = SHAPE_KINDS.map((value) => ({ value, ...SHAPE_VIEW[value] }));

export function ShapePicker({ value, onChange }: ShapePickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA の radiogroup パターン: グループ内は roving tabindex にし、
  // 矢印キーで選択が移動する（Tab は1回でグループを通過する）。
  const handleKeyDown = (event: TargetedKeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % SHAPES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + SHAPES.length) % SHAPES.length;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const nextShape = SHAPES[nextIndex];
    if (!nextShape) return;
    onChange(nextShape.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="shape-picker" role="radiogroup" aria-label="スタイル選択">
      {SHAPES.map((shape, index) => {
        const selected = value === shape.value;
        return (
          <button
            key={shape.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            accessKey={shape.accessKey}
            title={`ショートカットキー: ${shape.accessKey.toUpperCase()}`}
            className="shape-button"
            onClick={() => onChange(shape.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <span className="shape-icon" aria-hidden="true">
              <shape.Icon />
            </span>
            <span>{shape.label}</span>
          </button>
        );
      })}
    </div>
  );
}
