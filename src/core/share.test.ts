import { describe, expect, it } from "vitest";
import { MAX_PERMALINK_QUERY_LENGTH } from "./permalink";
import { buildLineShareUrl, buildShareQuery, buildXShareUrl, isShareTooLong } from "./share";

// 旧実装（share-bar.tsx 内の buildXShareUrl / buildLineShareUrl）の出力を、リファクタ前の
// コードで実際に生成して控えた文字列。href が 1 バイトも変わらない事の証拠なので、
// 期待値を実装から導出せず固定値のまま置く。
const LEGACY_HREFS: { input: string; x: string; line: string }[] = [
  {
    input: "",
    x: "https://twitter.com/intent/tweet?text=",
    line: "https://line.me/R/share?text=",
  },
  {
    input: "abc",
    x: "https://twitter.com/intent/tweet?text=abc",
    line: "https://line.me/R/share?text=abc",
  },
  {
    input: "突然の死",
    x: "https://twitter.com/intent/tweet?text=%E7%AA%81%E7%84%B6%E3%81%AE%E6%AD%BB",
    line: "https://line.me/R/share?text=%E7%AA%81%E7%84%B6%E3%81%AE%E6%AD%BB",
  },
  {
    input: "＿人人人＿\n＞ 突然の死 ＜\n￣Y^Y^Y￣",
    x: "https://twitter.com/intent/tweet?text=%EF%BC%BF%E4%BA%BA%E4%BA%BA%E4%BA%BA%EF%BC%BF%0A%EF%BC%9E%20%E7%AA%81%E7%84%B6%E3%81%AE%E6%AD%BB%20%EF%BC%9C%0A%EF%BF%A3Y%5EY%5EY%EF%BF%A3",
    line: "https://line.me/R/share?text=%EF%BC%BF%E4%BA%BA%E4%BA%BA%E4%BA%BA%EF%BC%BF%0A%EF%BC%9E%20%E7%AA%81%E7%84%B6%E3%81%AE%E6%AD%BB%20%EF%BC%9C%0A%EF%BF%A3Y%5EY%5EY%EF%BF%A3",
  },
  {
    input: "🔥絵文字👨‍👩‍👧 & a=b?c#d%e+f /g",
    x: "https://twitter.com/intent/tweet?text=%F0%9F%94%A5%E7%B5%B5%E6%96%87%E5%AD%97%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A7%20%26%20a%3Db%3Fc%23d%25e%2Bf%20%2Fg",
    line: "https://line.me/R/share?text=%F0%9F%94%A5%E7%B5%B5%E6%96%87%E5%AD%97%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A7%20%26%20a%3Db%3Fc%23d%25e%2Bf%20%2Fg",
  },
  {
    input: "  半角 space\tタブ\r\nCRLF  ",
    x: "https://twitter.com/intent/tweet?text=%20%20%E5%8D%8A%E8%A7%92%20space%09%E3%82%BF%E3%83%96%0D%0ACRLF%20%20",
    line: "https://line.me/R/share?text=%20%20%E5%8D%8A%E8%A7%92%20space%09%E3%82%BF%E3%83%96%0D%0ACRLF%20%20",
  },
  {
    input: "あいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえおあいうえお",
    x: "https://twitter.com/intent/tweet?text=%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A",
    line: "https://line.me/R/share?text=%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A",
  },
];

describe("X・LINE の共有 URL（旧実装と同一）", () => {
  for (const { input, x, line } of LEGACY_HREFS) {
    it(`X: ${JSON.stringify(input).slice(0, 30)}`, () => {
      expect(buildXShareUrl(input)).toBe(x);
    });
    it(`LINE: ${JSON.stringify(input).slice(0, 30)}`, () => {
      expect(buildLineShareUrl(input)).toBe(line);
    });
  }
});

describe("buildShareQuery", () => {
  it("URL のクエリ部分と一致する（判定と組み立てが同じ結果を見る）", () => {
    const text = "突然の死\n🔥";
    expect(buildXShareUrl(text).endsWith(`?${buildShareQuery(text)}`)).toBe(true);
    expect(buildLineShareUrl(text).endsWith(`?${buildShareQuery(text)}`)).toBe(true);
  });
});

describe("isShareTooLong の境界", () => {
  // クエリは "text=" (5文字) + エンコード後の本文。半角英字はエンコードで増えない。
  const PREFIX = "text=".length;
  const room = MAX_PERMALINK_QUERY_LENGTH - PREFIX;
  const exactly = "a".repeat(room);

  it("上限ちょうどは長すぎない", () => {
    expect(buildShareQuery(exactly).length).toBe(MAX_PERMALINK_QUERY_LENGTH);
    expect(isShareTooLong(exactly)).toBe(false);
  });

  it("上限を 1 文字超えると長すぎる", () => {
    const over = `${exactly}a`;
    expect(buildShareQuery(over).length).toBe(MAX_PERMALINK_QUERY_LENGTH + 1);
    expect(isShareTooLong(over)).toBe(true);
  });

  it("エンコードで膨らむ文字はエンコード後の長さで数える", () => {
    // 全角1文字は 9 文字、改行は 3 文字（パーセント符号3つ分ではなく %0A の3文字）に膨らむ。
    const kanji = "あ".repeat(Math.floor(room / 9));
    expect(isShareTooLong(kanji)).toBe(false);
    expect(isShareTooLong(`${kanji}あ`)).toBe(true);
    const breaks = "\n".repeat(Math.floor(room / 3));
    expect(isShareTooLong(breaks)).toBe(false);
    expect(isShareTooLong(`${breaks}\n`)).toBe(true);
  });

  it("空文字は長すぎない", () => {
    expect(isShareTooLong("")).toBe(false);
  });
});
