import { describe, expect, it } from "vitest";
import { charWidth, evenCeil, padCenterToWidth, padEndToWidth, stringWidth } from "./width";

describe("charWidth", () => {
  it("ASCII 印字可能文字は半角", () => {
    expect(charWidth("A".codePointAt(0)!)).toBe(1);
    expect(charWidth("!".codePointAt(0)!)).toBe(1);
  });

  it("半角カタカナは半角", () => {
    expect(charWidth("ｶ".codePointAt(0)!)).toBe(1);
  });

  it("漢字・かな・絵文字は全角", () => {
    expect(charWidth("死".codePointAt(0)!)).toBe(2);
    expect(charWidth("あ".codePointAt(0)!)).toBe(2);
    expect(charWidth("😀".codePointAt(0)!)).toBe(2);
  });
});

describe("stringWidth", () => {
  it("空文字は0", () => {
    expect(stringWidth("")).toBe(0);
  });

  it("全角のみ", () => {
    expect(stringWidth("突然の死")).toBe(8);
  });

  it("半角と全角の混在", () => {
    expect(stringWidth("ぬるぽ!!")).toBe(8); // ぬ,る,ぽ(2×3=6) + !,!(1×2=2)
  });

  it("サロゲートペア（絵文字）を1文字として数える", () => {
    expect(stringWidth("😀")).toBe(2);
  });
});

describe("evenCeil", () => {
  it("偶数はそのまま", () => {
    expect(evenCeil(8)).toBe(8);
  });
  it("奇数は+1", () => {
    expect(evenCeil(7)).toBe(8);
  });
  it("0はそのまま", () => {
    expect(evenCeil(0)).toBe(0);
  });
});

describe("padEndToWidth", () => {
  it("不足分を右側に詰める", () => {
    expect(padEndToWidth("あ", 4)).toBe("あ　");
    expect(stringWidth(padEndToWidth("あ", 4))).toBe(4);
  });

  it("既に目標幅なら変化しない", () => {
    expect(padEndToWidth("突然の死", 8)).toBe("突然の死");
  });

  it("奇数の不足分も半角スペースで正確に埋める", () => {
    const result = padEndToWidth("A", 4); // 不足3 → 全角1+半角1
    expect(stringWidth(result)).toBe(4);
  });
});

describe("padCenterToWidth", () => {
  it("左右中央に寄せる", () => {
    const result = padCenterToWidth("死", 6);
    expect(stringWidth(result)).toBe(6);
  });

  it("既に目標幅なら変化しない", () => {
    expect(padCenterToWidth("突", 2)).toBe("突");
  });
});
