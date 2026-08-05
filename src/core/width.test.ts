import { describe, expect, it } from "vitest";
import { charWidth, clusterWidth, evenCeil, padCenterToWidth, padEndToWidth, splitGraphemes, stringWidth } from "./width";

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

  it("ラテン文字拡張（アクセント付き文字）は半角", () => {
    // 実機で "café au lait très bien" を入力し、枠が本体より広くなる非対称崩れを
    // 目視確認した不具合の再発防止（Latin-1 Supplement / Latin Extended-A/B）。
    expect(charWidth("é".codePointAt(0)!)).toBe(1);
    expect(charWidth("ñ".codePointAt(0)!)).toBe(1);
    expect(charWidth("ø".codePointAt(0)!)).toBe(1);
    expect(charWidth("ß".codePointAt(0)!)).toBe(1);
    expect(charWidth("œ".codePointAt(0)!)).toBe(1);
  });

  it("ギリシャ文字・キリル文字は半角", () => {
    // 実機で "Привет" / "Γειά" を入力し、枠が本体より広くなる非対称崩れを
    // 目視確認した不具合の再発防止（Codex bot 指摘）。
    expect(charWidth("Γ".codePointAt(0)!)).toBe(1);
    expect(charWidth("α".codePointAt(0)!)).toBe(1);
    expect(charWidth("П".codePointAt(0)!)).toBe(1);
    expect(charWidth("я".codePointAt(0)!)).toBe(1);
  });

  it("タブは半角（CSS tab-size:1 に合わせて計算幅と描画幅を一致させる）", () => {
    // 実機で "A\tB" を入力し、タブストップの可変幅描画とのズレを確認した不具合の再発防止。
    expect(charWidth("\t".codePointAt(0)!)).toBe(1);
  });

  it("ベトナム語の合成済み声調記号付き文字は半角", () => {
    // 実機で "Tiếng Việt" を入力し、枠が本体より広くなる非対称崩れを
    // 目視確認した不具合の再発防止（Codex bot 指摘、Latin Extended Additional）。
    expect(charWidth("ế".codePointAt(0)!)).toBe(1);
    expect(charWidth("ệ".codePointAt(0)!)).toBe(1);
  });
});

describe("clusterWidth", () => {
  it("VS16 付き keycap 絵文字クラスタは基底が半角文字でも全角として扱う", () => {
    // "1" (ASCII, 単体なら半角) + VS16 + combining enclosing keycap = 1️⃣。
    // 実機でブラウザは正方形の絵文字として描画するため、基底文字だけを見ると
    // 右の枠がズレる不具合の再発防止。
    const keycap1 = "1\u{FE0F}\u{20E3}";
    expect(clusterWidth(keycap1)).toBe(2);
    const keycapHash = "#\u{FE0F}\u{20E3}";
    expect(clusterWidth(keycapHash)).toBe(2);
  });

  it("VS16 を含まない結合文字は従来通り基底文字の幅", () => {
    expect(clusterWidth("e\u{0301}")).toBe(1);
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

  it("ラテン文字拡張混じりの文はASCII同様に半角で数える", () => {
    expect(stringWidth("café")).toBe(4); // c,a,f,é 全て半角1
  });

  it("結合文字（基底+アクセント）は1書記素として基底文字の幅で数える", () => {
    // "e"(U+0065) + U+0301 COMBINING ACUTE ACCENT の分解形。
    // コードポイント単位で数えると e(半角1)+結合文字(全角2扱い)=3 になってしまうが、
    // 結合文字は表示上ゼロ幅なので正しくは基底の "e" と同じ半角(1)。
    // \u{} で明示するのは、エディタ等が正規化して合成済み1コードポイントの
    // "e with acute"(U+00E9) に変換してしまい、意図した分解形でテストできなくなる事故を防ぐため
    // （実際に一度このテスト作成時に発生した）。
    const combining = "e\u{0301}";
    expect(combining.length).toBe(2); // 分解形（2コードポイント）であることの前提確認
    expect(stringWidth(combining)).toBe(1);
  });

  it("Variation Selector 付き絵文字は基底の幅だけを数える", () => {
    // U+2615 (全角2) + U+FE0F (VS16)。VS16 自体は表示幅を持たない。
    const vs16Emoji = "\u{2615}\u{FE0F}";
    expect(stringWidth(vs16Emoji)).toBe(2);
  });

  it("ZWJ 絵文字シーケンスは1書記素として数える", () => {
    // U+1F468 + ZWJ(U+200D) + U+1F469 + ZWJ + U+1F467 の家族絵文字。
    // コードポイント単位で数えると 3絵文字分の幅(6)になってしまう。
    const zwjFamily = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
    expect(stringWidth(zwjFamily)).toBe(2);
  });
});

describe("splitGraphemes", () => {
  it("結合文字・VS16・ZWJ シーケンスを1クラスタとして分割する", () => {
    const combining = "e\u{0301}";
    const vs16Emoji = "\u{2615}\u{FE0F}";
    const zwjFamily = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
    expect(splitGraphemes(combining)).toEqual([combining]);
    expect(splitGraphemes(vs16Emoji)).toEqual([vs16Emoji]);
    expect(splitGraphemes(zwjFamily)).toEqual([zwjFamily]);
  });

  it("通常の文字列は1文字ずつに分割する", () => {
    expect(splitGraphemes("突然の死")).toEqual(["突", "然", "の", "死"]);
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
