import { useRef } from "preact/hooks";
import type { ComponentChildren, TargetedKeyboardEvent } from "preact";
import type { ShapeKind } from "../core";
import { NormalShapeIcon, SquareShapeIcon, StressShapeIcon, TanzakuShapeIcon } from "./icons";

export interface ShapePickerProps {
  value: ShapeKind;
  onChange: (shape: ShapeKind) => void;
}

// accessKey は echo-sd のショートカット割り当て(N/4/T/S)に合わせる（機能面の参考、コードは転記していない）。
// アイコンはデザイン（design/project/Screen.dc.html の .sp 内 svg）の線アイコン。
const SHAPES: ReadonlyArray<{
  value: ShapeKind;
  label: string;
  icon: ComponentChildren;
  accessKey: string;
}> = [
  { value: "normal", label: "通常", icon: <NormalShapeIcon />, accessKey: "n" },
  { value: "square", label: "四角形", icon: <SquareShapeIcon />, accessKey: "4" },
  { value: "tanzaku", label: "短冊", icon: <TanzakuShapeIcon />, accessKey: "t" },
  { value: "stress", label: "ストレス", icon: <StressShapeIcon />, accessKey: "s" },
];

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
              {shape.icon}
            </span>
            <span>{shape.label}</span>
          </button>
        );
      })}
    </div>
  );
}
