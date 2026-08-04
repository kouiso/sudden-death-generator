# sd-symbols.woff2 について

罫線・矢印文字（`─ ━ ┌ ┏ ↘ ↙` 等、Unicode の East Asian Ambiguous）は CJK フォント未導入の
端末では半角幅で描画され、四角形・短冊の枠が崩れる。この対策として、必要な34文字だけを
サブセット化した専用フォントを同梱している。

- 元フォント: [Noto Sans Mono CJK JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/Mono/NotoSansMonoCJKjp-Regular.otf)
- ライセンス: SIL Open Font License, Version 1.1（同梱の `LICENSE-OFL.txt` 参照）
- ソース検証: 2026-08-04 に取得したソースフォントの SHA-256 は
  `4d01725be822d144cf9a56ade981e6fb920cd7a610b8fc24cc601a920beea5b9`。
  `scripts/subset-font.sh` はこの値と一致しないファイルを拒否する（`main` 参照は特定コミットに
  固定していないため、改変・別物のファイルが渡された場合に同じ手順で異なる `sd-symbols.woff2` が
  生成されるのを防ぐための最終防御）
- 生成方法: `scripts/subset-font.sh`（fonttools の `pyftsubset` で該当コードポイントのみ抽出）
- 収録文字: `Y ^ ← ↑ → ↓ ↖ ↗ ↘ ↙ ─ ━ │ ┃ ┌ ┏ ┐ ┓ └ ┗ ┘ ┛ 人 U+FE11 U+FE12 ﹁ ﹂ ﹃ ﹄ ＜ ＞ ＿ ｜ ￣`
  （U+FE11 / U+FE12 は等幅フォント非搭載環境で表示できない可能性があるためコードポイント表記）
