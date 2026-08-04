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
  return (
    <div className="shape-picker" role="radiogroup" aria-label="スタイル選択">
      {SHAPES.map((shape) => (
        <button
          key={shape.value}
          type="button"
          role="radio"
          aria-checked={value === shape.value}
          className="shape-button"
          onClick={() => onChange(shape.value)}
        >
          <span className="shape-icon" aria-hidden="true">
            {shape.icon}
          </span>
          <span>{shape.label}</span>
        </button>
      ))}
    </div>
  );
}
