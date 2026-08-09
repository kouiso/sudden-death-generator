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

  it("タブは半角（CSS tab-size:1 に合わせて計算幅と描画幅を一致させる）", () => {
    // 実機で "A\tB" を入力し、タブストップの可変幅描画とのズレを確認した不具合の再発防止。
    expect(charWidth("\t".codePointAt(0)!)).toBe(1);
  });

  it("非日本語文字（ラテン文字拡張・ギリシャ・キリル等）は全角扱い", () => {
    // 本ツールは日本語入力を前提とするため、ASCII と半角カタカナ以外は一律全角とみなす
    // （海外文字の個別半角対応は行わない、という製品スコープ上の判断）。
    expect(charWidth("é".codePointAt(0)!)).toBe(2);
    expect(charWidth("Γ".codePointAt(0)!)).toBe(2);
    expect(charWidth("Привет".codePointAt(0)!)).toBe(2);
  });

  it("ゼロ幅制御文字は幅0（他所からのコピペで紛れ込んでも枠が広がらない、Codex bot 指摘）", () => {
    expect(charWidth("\u{200B}".codePointAt(0)!)).toBe(0); // ZERO WIDTH SPACE
    expect(charWidth("\u{200C}".codePointAt(0)!)).toBe(0); // ZERO WIDTH NON-JOINER
    expect(charWidth("\u{2060}".codePointAt(0)!)).toBe(0); // WORD JOINER
    expect(charWidth("\u{FEFF}".codePointAt(0)!)).toBe(0); // ZERO WIDTH NO-BREAK SPACE (BOM)
  });

  it("双方向制御文字（LRM/RLM・bidi isolate）も幅0（残っていた見落とし、Codex bot 指摘）", () => {
    expect(charWidth("\u{200E}".codePointAt(0)!)).toBe(0); // LEFT-TO-RIGHT MARK
    expect(charWidth("\u{200F}".codePointAt(0)!)).toBe(0); // RIGHT-TO-LEFT MARK
    expect(charWidth("\u{2066}".codePointAt(0)!)).toBe(0); // LEFT-TO-RIGHT ISOLATE
    expect(charWidth("\u{2067}".codePointAt(0)!)).toBe(0); // RIGHT-TO-LEFT ISOLATE
    expect(charWidth("\u{2068}".codePointAt(0)!)).toBe(0); // FIRST STRONG ISOLATE
    expect(charWidth("\u{2069}".codePointAt(0)!)).toBe(0); // POP DIRECTIONAL ISOLATE
  });

  it("結合文字単体（基底文字を伴わない孤立した状態）は幅0", () => {
    // コピペ由来の孤立した結合文字（例: 濁点だけがクリップボードに残る等）が
    // 書記素クラスタの先頭に来ると、以前は「未知の文字」として全角(2)扱いされ、
    // 実際は表示幅を持たない（隣接する何らかの文字に重なって描画される）のに
    // 行の表示幅計算だけが2桁分膨らんでいた（自己レビューで発見・修正）。
    expect(charWidth("\u{0301}".codePointAt(0)!)).toBe(0); // COMBINING ACUTE ACCENT
    expect(charWidth("\u{3099}".codePointAt(0)!)).toBe(0); // COMBINING KATAKANA-HIRAGANA VOICED SOUND MARK
  });

  it("合成済み文字（NFC）は結合文字扱いにならず従来通り全角", () => {
    // U+00E9 (é、単一コードポイントの合成済み文字) は Unicode 一般カテゴリが Ll
    // （小文字）であって Mn ではないため、上の孤立結合文字の判定に巻き込まれない。
    expect(charWidth("é".codePointAt(0)!)).toBe(2);
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

  it("半角濁点・半角半濁点を含むクラスタは半角2文字ぶんの幅", () => {
    // Intl.Segmenter は "ｶﾞ"(U+FF76+U+FF9E) を1クラスタにまとめるが、半角濁点は
    // ゼロ幅の結合文字ではなく独立した半角1文字ぶんの幅で描画される（実機で "ｶﾞｷﾞ" を
    // 入力し、枠が本体より1桁狭くなる崩れを確認した不具合の再発防止、Codex bot 指摘）。
    expect(clusterWidth("ｶﾞ")).toBe(2);
    expect(clusterWidth("ﾊﾟ")).toBe(2);
  });

  it("単独の半角濁点は半角1文字ぶんの幅", () => {
    expect(clusterWidth("ﾞ")).toBe(1);
  });

  it("全角カナ基底+半角濁点は基底の全角幅+半角1（固定値ではなく合算、Codex bot 指摘）", () => {
    // "カﾞ"(U+30AB+U+FF9E) は全角カナに半角濁点が続く珍しいが起こりうる入力。
    // 固定値2を返すと基底の全角ぶん(2)が消えてしまう。
    expect(clusterWidth("カ\u{FF9E}")).toBe(3);
  });

  it("濁点が連続するクラスタは濁点の個数ぶん加算する（Codex bot 指摘）", () => {
    // "ｶﾞﾟ"(U+FF76+U+FF9E+U+FF9F) は Intl.Segmenter が1クラスタにまとめる。
    // 固定値2では濁点1個ぶんしか計上できない。
    expect(clusterWidth("ｶﾞﾟ")).toBe(3);
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

  it("他所からのコピペで紛れ込むゼロ幅スペースは幅に含めない", () => {
    // "突然​の死" は見た目上「突然の死」と同じ幅で描画されるべき。
    expect(stringWidth("突然\u{200B}の死")).toBe(stringWidth("突然の死"));
  });

  it("他所からのコピペで紛れ込む双方向制御文字（LRM等）も幅に含めない", () => {
    expect(stringWidth("突然\u{200E}の死")).toBe(stringWidth("突然の死"));
  });

  it("非日本語文字（アクセント付きラテン文字等）混じりの文は全角換算", () => {
    expect(stringWidth("café")).toBe(5); // c,a,f(半角1×3=3) + é(全角2)
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

  it("奇数の不足幅では右側に1幅多く配置する", () => {
    // 総幅の一致だけでは左右の配分ミスを検出できない（CodeRabbit 指摘）。
    // 不足3 → 左1(半角スペース) + 右2(全角スペース) に分かれることを直接検証する。
    expect(padCenterToWidth("A", 4)).toBe(" A　");
  });
});
