import { describe, expect, it } from "vitest";
import { MAX_PERMALINK_QUERY_LENGTH, buildPermalinkQuery, isPermalinkQueryTooLong, parsePermalink } from "./permalink";

describe("buildPermalinkQuery", () => {
  it("既定値のみなら空文字列を返す（URLを汚さない）", () => {
    expect(buildPermalinkQuery({ text: "", shape: "normal", vertical: false, padding: false })).toBe("");
  });

  it("入力テキストをクエリに載せる", () => {
    const qs = buildPermalinkQuery({ text: "突然の死", shape: "normal", vertical: false, padding: false });
    expect(new URLSearchParams(qs).get("text")).toBe("突然の死");
  });

  it("既定値(normal/false)以外のオプションだけをクエリに載せる", () => {
    const qs = buildPermalinkQuery({ text: "a", shape: "square", vertical: true, padding: true });
    const params = new URLSearchParams(qs);
    expect(params.get("shape")).toBe("square");
    expect(params.get("vertical")).toBe("1");
    expect(params.get("padding")).toBe("1");
  });

  it("複数行の入力も往復できる（改行が失われない）", () => {
    const text = "残業\n休日出勤\n上司の圧";
    const qs = buildPermalinkQuery({ text, shape: "stress", vertical: false, padding: false });
    expect(parsePermalink("?" + qs).text).toBe(text);
  });
});

describe("parsePermalink", () => {
  it("クエリが空なら何も返さない", () => {
    expect(parsePermalink("")).toEqual({});
  });

  it("text と shape を復元する", () => {
    const result = parsePermalink("?text=突然の死&shape=tanzaku");
    expect(result.text).toBe("突然の死");
    expect(result.shape).toBe("tanzaku");
  });

  it("不正な shape 値は無視する（クラッシュしない）", () => {
    const result = parsePermalink("?shape=invalid-shape");
    expect(result.shape).toBeUndefined();
  });

  it("vertical/padding は 1 のときだけ true", () => {
    expect(parsePermalink("?vertical=1&padding=1")).toMatchObject({ vertical: true, padding: true });
    expect(parsePermalink("?vertical=0")).toMatchObject({ vertical: false });
  });

  it("build → parse の往復で状態が一致する", () => {
    const state = { text: "Wi-Fiが繋がらない!!", shape: "square" as const, vertical: true, padding: true };
    const restored = parsePermalink("?" + buildPermalinkQuery(state));
    expect(restored).toEqual(state);
  });

  it("上限を超える text は既定値にフォールバックさせる（このアプリが書いたとは限らないURLへの防御）", () => {
    const hugeText = "あ".repeat(MAX_PERMALINK_QUERY_LENGTH + 1);
    const result = parsePermalink("?text=" + hugeText);
    expect(result.text).toBeUndefined();
  });

  it("復元後の文字数が上限以下でも、encode後のクエリ長が上限を超えるなら復元しない（CodeRabbit 指摘）", () => {
    // 日本語2000文字は decode 後の文字数だと上限(4000)未満だが、percent-encoding で
    // 1文字最大9文字に膨らむため encode 後のクエリ長は上限を超える。書き込み側が
    // 「共有しない」と判断するのと同じ基準で読み込み側も弾かないと、書き込み不可能な
    // URLを読み込み側だけが復元してしまう非対称になる。
    const qs = buildPermalinkQuery({ text: "あ".repeat(2000), shape: "normal", vertical: false, padding: false });
    expect(qs.length).toBeGreaterThan(MAX_PERMALINK_QUERY_LENGTH);
    const result = parsePermalink("?" + qs);
    expect(result.text).toBeUndefined();
  });
});

describe("isPermalinkQueryTooLong", () => {
  it("上限以下なら false", () => {
    expect(isPermalinkQueryTooLong("text=" + "あ".repeat(10))).toBe(false);
  });

  it("上限を超えると true（数千字の日本語入力はpercent-encodingで大きく膨らむ、Codex bot 指摘）", () => {
    const hugeQuery = buildPermalinkQuery({
      text: "あ".repeat(2000),
      shape: "normal",
      vertical: false,
      padding: false,
    });
    expect(hugeQuery.length).toBeGreaterThan(MAX_PERMALINK_QUERY_LENGTH);
    expect(isPermalinkQueryTooLong(hugeQuery)).toBe(true);
  });
});
