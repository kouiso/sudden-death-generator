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

  it("句点・感嘆符・疑問符・省略記号を Vertical Forms 提示形に変換する", () => {
    // 元サイト(echo-sd)との機能比較で見つかったカバー範囲の抜け（実ソース比較で確認）。
    expect(toVerticalGlyph("，")).toBe("\u{FE10}");
    expect(toVerticalGlyph("：")).toBe("\u{FE13}");
    expect(toVerticalGlyph("；")).toBe("\u{FE14}");
    expect(toVerticalGlyph("！")).toBe("\u{FE15}");
    expect(toVerticalGlyph("？")).toBe("\u{FE16}");
    expect(toVerticalGlyph("…")).toBe("\u{FE19}");
  });

  it("各種括弧を CJK Compatibility Forms の縦書き提示形に変換する", () => {
    expect(toVerticalGlyph("｛")).toBe("\u{FE37}");
    expect(toVerticalGlyph("｝")).toBe("\u{FE38}");
    expect(toVerticalGlyph("［")).toBe("\u{FE47}");
    expect(toVerticalGlyph("］")).toBe("\u{FE48}");
    expect(toVerticalGlyph("〔")).toBe("\u{FE39}");
    expect(toVerticalGlyph("〕")).toBe("\u{FE3A}");
    expect(toVerticalGlyph("【")).toBe("\u{FE3B}");
    expect(toVerticalGlyph("】")).toBe("\u{FE3C}");
    expect(toVerticalGlyph("〖")).toBe("\u{FE17}");
    expect(toVerticalGlyph("〗")).toBe("\u{FE18}");
    expect(toVerticalGlyph("《")).toBe("\u{FE3D}");
    expect(toVerticalGlyph("》")).toBe("\u{FE3E}");
    expect(toVerticalGlyph("〈")).toBe("\u{FE3F}");
    expect(toVerticalGlyph("〉")).toBe("\u{FE40}");
  });

  it("横棒系の同義記号（ー－−─）は全て同じ縦棒近似に変換する", () => {
    const bar = "\u{FF5C}";
    expect(toVerticalGlyph("ー")).toBe(bar);
    expect(toVerticalGlyph("－")).toBe(bar);
    expect(toVerticalGlyph("−")).toBe(bar);
    expect(toVerticalGlyph("─")).toBe(bar);
  });

  it("矢印を90°回転させる", () => {
    expect(toVerticalGlyph("→")).toBe("↓");
    expect(toVerticalGlyph("↓")).toBe("←");
    expect(toVerticalGlyph("←")).toBe("↑");
    expect(toVerticalGlyph("↑")).toBe("→");
  });

  it("VS16付き絵文字提示形の矢印（モバイルキーボードが送出しうる）も基底文字を回転させる", () => {
    // 例: ↗️ = U+2197 + U+FE0F(VS16) が1書記素クラスタとして渡ってくる（Codex bot 指摘）。
    expect(toVerticalGlyph("\u{2197}\u{FE0F}")).toBe("↘");
    expect(toVerticalGlyph("\u{2192}\u{FE0F}")).toBe("↓");
  });

  it("縦書き提示形を持たない文字はそのまま返す", () => {
    expect(toVerticalGlyph("死")).toBe("死");
    expect(toVerticalGlyph("あ")).toBe("あ");
    expect(toVerticalGlyph("A")).toBe("A");
  });

  it("Unicode に提示形が無い記号（〜／＝）は素通しする（既知の制約）", () => {
    // 波ダッシュ・スラッシュ・イコールは Unicode が縦書き専用提示形を定めていないため、
    // 記号を発明して埋めることはせず横書きのまま残す。
    expect(toVerticalGlyph("〜")).toBe("〜");
    expect(toVerticalGlyph("／")).toBe("／");
    expect(toVerticalGlyph("＝")).toBe("＝");
  });
});
