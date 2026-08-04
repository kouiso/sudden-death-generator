import { describe, expect, it } from "vitest";
import { renderSuddenDeath } from "./render";
import { stringWidth } from "./width";
import type { RenderOptions } from "./types";

const base: RenderOptions = { shape: "normal", vertical: false, padding: false };

/** 1つの枠内の全行が同じ表示幅であることを確認するヘルパー。枠ズレのクラス全体を機械的に封じる。 */
function expectUniformWidth(block: string) {
  const widths = block.split("\n").map(stringWidth);
  const first = widths[0];
  for (const w of widths) {
    expect(w).toBe(first);
  }
}

describe("renderSuddenDeath — golden tests", () => {
  it("通常形・既定文言は左右対称の正解形になる", () => {
    expect(renderSuddenDeath("突然の死", base)).toBe(
      ["＿人人人人人人＿", "＞　突然の死　＜", "￣Y^Y^Y^Y^Y^Y^￣"].join("\n"),
    );
  });

  it("入力が空でも既定文言にフォールバックする", () => {
    expect(renderSuddenDeath("", base)).toBe(renderSuddenDeath("突然の死", base));
    expect(renderSuddenDeath("   \n\n", base)).toBe(renderSuddenDeath("突然の死", base));
  });

  it("四角形・既定文言", () => {
    expect(renderSuddenDeath("突然の死", { ...base, shape: "square" })).toBe(
      ["┌──────┐", "│　突然の死　│", "└──────┘"].join("\n"),
    );
  });

  it("短冊・既定文言は1文字1行の縦一列になる", () => {
    expect(renderSuddenDeath("突然の死", { ...base, shape: "tanzaku" })).toBe(
      ["┏━┓", "┃突┃", "┃然┃", "┃の┃", "┃死┃", "┗━┛"].join("\n"),
    );
  });

  it("縦書きオプション・単一行は1文字1行の枠になる", () => {
    expect(renderSuddenDeath("突然の死", { ...base, vertical: true })).toBe(
      ["＿人人人＿", "＞　突　＜", "＞　然　＜", "＞　の　＜", "＞　死　＜", "￣Y^Y^Y^￣"].join("\n"),
    );
  });
});

describe("renderSuddenDeath — 不変条件（枠内の全行が同じ表示幅）", () => {
  const inputs = ["突然の死", "一行目\n二行目はちょっと長い", "ぬるぽ!!", "😀絵文字混在", "a"];
  const shapes: RenderOptions["shape"][] = ["normal", "square"];

  for (const input of inputs) {
    for (const shape of shapes) {
      for (const vertical of [false, true]) {
        for (const padding of [false, true]) {
          it(`shape=${shape} vertical=${vertical} padding=${padding} input=${JSON.stringify(input)}`, () => {
            const output = renderSuddenDeath(input, { shape, vertical, padding });
            expectUniformWidth(output);
          });
        }
      }
    }
  }

  it("短冊は短冊ごと（空行区切り）に幅が揃う", () => {
    const output = renderSuddenDeath("一行目\n二行目はちょっと長い", { ...base, shape: "tanzaku" });
    for (const frame of output.split("\n\n")) {
      expectUniformWidth(frame);
    }
  });

  it("ストレスは末尾の枠部分（突然の死パート）だけ幅が揃う", () => {
    for (const padding of [false, true]) {
      const output = renderSuddenDeath("残業\n休日出勤\n上司の圧", { ...base, shape: "stress", padding });
      const frameLineCount = padding ? 5 : 3; // renderFramed が出力する行数
      const frame = output.split("\n").slice(-frameLineCount).join("\n");
      expectUniformWidth(frame);
    }
  });
});

describe("renderSuddenDeath — ストレス形状の挙動", () => {
  it("入力行を順番にジグザグへ消費し、最終行を強調して枠で締める", () => {
    const output = renderSuddenDeath("残業\n休日出勤\n上司の圧", { ...base, shape: "stress" });
    const lines = output.split("\n");
    expect(lines[0]).toBe("残業");
    expect(lines[1]).toBe("　　　　↘");
    expect(lines[2]).toBe("休日出勤");
    expect(lines[3]).toBe("　　　　↘");
    expect(lines[4]).toBe("上司の圧");
    expect(lines[5]).toBe("　　　　↘");
    expect(lines[6]).toBe("　　　上司の圧");
    expect(lines[7]).toBe("　　　　↙");
    expect(lines.slice(8).join("\n")).toBe(
      renderSuddenDeath("上司の圧", { ...base, shape: "normal" }),
    );
  });
});

describe("renderSuddenDeath — 余白オプション", () => {
  it("枠の内側上下に空行が1行増える", () => {
    const withoutPadding = renderSuddenDeath("突然の死", base).split("\n");
    const withPadding = renderSuddenDeath("突然の死", { ...base, padding: true }).split("\n");
    expect(withPadding.length).toBe(withoutPadding.length + 2);
    expectUniformWidth(renderSuddenDeath("突然の死", { ...base, padding: true }));
  });
});
