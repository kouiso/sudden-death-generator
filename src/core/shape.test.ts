import { describe, expect, it } from "vitest";
import { buildPermalinkQuery, parsePermalink } from "./permalink";
import { renderSuddenDeath } from "./render";
import {
  SHAPE_KINDS,
  SHAPE_TABLE,
  isShapeKind,
  isVerticalDisabled,
  isVerticalMeaningful,
  resolveVertical,
  verticalHintOf,
  verticalRuleOf,
} from "./shape";

describe("形状の定義表", () => {
  it("形状一覧は表の順序どおりで、重複しない", () => {
    expect(SHAPE_KINDS).toEqual(["normal", "square", "tanzaku", "stress"]);
    expect(new Set(SHAPE_KINDS).size).toBe(SHAPE_TABLE.length);
  });

  it("各形状の縦書き規則", () => {
    expect(verticalRuleOf("normal")).toBe("free");
    expect(verticalRuleOf("square")).toBe("free");
    expect(verticalRuleOf("tanzaku")).toBe("always");
    expect(verticalRuleOf("stress")).toBe("none");
  });

  it("縦書きの解決: always だけ強制 true、それ以外は入力値のまま", () => {
    for (const v of [true, false]) {
      expect(resolveVertical("normal", v)).toBe(v);
      expect(resolveVertical("square", v)).toBe(v);
      expect(resolveVertical("stress", v)).toBe(v);
      expect(resolveVertical("tanzaku", v)).toBe(true);
    }
  });

  it("UI の無効化・説明文・permalink の対象は規則から導かれる", () => {
    expect(SHAPE_KINDS.filter(isVerticalDisabled)).toEqual(["tanzaku", "stress"]);
    expect(SHAPE_KINDS.filter(isVerticalMeaningful)).toEqual(["normal", "square"]);
    expect(verticalHintOf("normal")).toBe("");
    expect(verticalHintOf("square")).toBe("");
    expect(verticalHintOf("tanzaku")).toBe("（短冊は常に縦書き）");
    expect(verticalHintOf("stress")).toBe("（ストレスには影響しません）");
  });

  it("isShapeKind は表にある値だけを通す", () => {
    for (const kind of SHAPE_KINDS) expect(isShapeKind(kind)).toBe(true);
    expect(isShapeKind("invalid")).toBe(false);
    expect(isShapeKind(null)).toBe(false);
  });
});

describe("全形状の permalink 往復", () => {
  for (const shape of SHAPE_KINDS) {
    for (const vertical of [true, false]) {
      it(`${shape} / vertical=${vertical} を build → parse で復元できる`, () => {
        const state = { text: "突然の死", shape, vertical, padding: true };
        const restored = parsePermalink(buildPermalinkQuery(state));
        expect(restored.shape ?? "normal").toBe(shape);
        expect(restored.text).toBe(state.text);
        // vertical は意味を持つ形状でだけ復元される。それ以外は URL に載らず、見た目も同じ
        expect(restored.vertical ?? false).toBe(isVerticalMeaningful(shape) ? vertical : false);
      });
    }
  }
});

describe("縦書き規則と描画の整合", () => {
  it("always / none の形状は vertical の値で出力が変わらない", () => {
    for (const shape of SHAPE_KINDS.filter((s) => verticalRuleOf(s) !== "free")) {
      const on = renderSuddenDeath("あい\nう", { shape, vertical: true, padding: false });
      const off = renderSuddenDeath("あい\nう", { shape, vertical: false, padding: false });
      expect(on).toBe(off);
    }
  });

  it("free の形状は vertical の値で出力が変わる", () => {
    for (const shape of SHAPE_KINDS.filter((s) => verticalRuleOf(s) === "free")) {
      const on = renderSuddenDeath("あい", { shape, vertical: true, padding: false });
      const off = renderSuddenDeath("あい", { shape, vertical: false, padding: false });
      expect(on).not.toBe(off);
    }
  });
});
