import { describe, expect, it } from "vitest";
import { toVerticalGlyph } from "./vertical";

// 文字リテラルは見た目が近い別ブロック(Small Form Variants, U+FE50台)と混同しやすいため、
// アサーション側も \u{} エスケープでコードポイントを明示し、実装側の転記ミスを検出できるようにする。
describe("toVerticalGlyph", () => {
  it("句読点を Unicode の Vertical Forms 提示形 (U+FE11/FE12) に変換する", () => {
    expect(toVerticalGlyph("、")).toBe("\u{FE11}");
    expect(toVerticalGlyph("。")).toBe("\u{FE12}");
  });

  it("かぎ括弧を CJK Compatibility Forms の縦書き提示形に変換する", () => {
    expect(toVerticalGlyph("「")).toBe("\u{FE41}");
    expect(toVerticalGlyph("」")).toBe("\u{FE42}");
    expect(toVerticalGlyph("『")).toBe("\u{FE43}");
    expect(toVerticalGlyph("』")).toBe("\u{FE44}");
  });

  it("丸括弧を CJK Compatibility Forms の縦書き提示形に変換する", () => {
    // 実機で「（突然）」を縦書きで入力し、横向きの丸括弧のまま表示される不具合を
    // 確認した再発防止（Codex bot 指摘）。
    expect(toVerticalGlyph("（")).toBe("\u{FE35}");
    expect(toVerticalGlyph("）")).toBe("\u{FE36}");
  });

  it("矢印を90°回転させる", () => {
    expect(toVerticalGlyph("→")).toBe("↓");
    expect(toVerticalGlyph("↓")).toBe("←");
    expect(toVerticalGlyph("←")).toBe("↑");
    expect(toVerticalGlyph("↑")).toBe("→");
  });

  it("縦書き提示形を持たない文字はそのまま返す", () => {
    expect(toVerticalGlyph("死")).toBe("死");
    expect(toVerticalGlyph("あ")).toBe("あ");
    expect(toVerticalGlyph("A")).toBe("A");
  });
});
