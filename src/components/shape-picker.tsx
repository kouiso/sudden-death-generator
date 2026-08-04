import { useRef } from "preact/hooks";
import type { JSX } from "preact";
import type { ShapeKind } from "../core";

export interface ShapePickerProps {
  value: ShapeKind;
  onChange: (shape: ShapeKind) => void;
}

const SHAPES: ReadonlyArray<{ value: ShapeKind; label: string; icon: string }> = [
  { value: "normal", label: "通常", icon: "📝" },
  { value: "square", label: "四角形", icon: "⬜" },
  { value: "tanzaku", label: "短冊", icon: "🎋" },
  { value: "stress", label: "ストレス", icon: "💢" },
];

export function ShapePicker({ value, onChange }: ShapePickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA の radiogroup パターン: グループ内は roving tabindex にし、
  // 矢印キーで選択が移動する（Tab は1回でグループを通過する）。
  const handleKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLButtonElement>, index: number) => {
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
