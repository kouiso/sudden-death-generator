# sd-symbols.woff2 について

罫線・矢印文字（`─ ━ ┌ ┏ ↘ ↙` 等、Unicode の East Asian Ambiguous）は CJK フォント未導入の
端末では半角幅で描画され、四角形・短冊の枠が崩れる。この対策として、必要な34文字だけを
サブセット化した専用フォントを同梱している。

- 元フォント: [Noto Sans Mono CJK JP](https://github.com/notofonts/noto-cjk/tree/main/Sans/Mono)
- ライセンス: SIL Open Font License, Version 1.1（同梱の `LICENSE-OFL.txt` 参照）
- 生成方法: `scripts/subset-font.sh`（fonttools の `pyftsubset` で該当コードポイントのみ抽出）
- 収録文字: `Y ^ ← ↑ → ↓ ↖ ↗ ↘ ↙ ─ ━ │ ┃ ┌ ┏ ┐ ┓ └ ┗ ┘ ┛ 人 U+FE11 U+FE12 ﹁ ﹂ ﹃ ﹄ ＜ ＞ ＿ ｜ ￣`
  （U+FE11 / U+FE12 は等幅フォント非搭載環境で表示できない可能性があるためコードポイント表記）
