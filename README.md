# ＞　突然の死　＜ ジェネレーター

テキストを入力するだけでリアルタイムに「突然の死」AA（アスキーアート）を生成する静的サイト。
生成ボタンは無く、入力とオプション変更が即プレビューに反映される。

## 特徴

- **リアルタイムプレビュー** — 入力するだけで即反映（送信/生成ボタン不要）
- **4形状** — 通常 / 四角形 / 短冊（縦一列） / ストレス（複数行をジグザグに積む）
- **縦書き** — Unicode の縦書き提示形（CJK Compatibility Forms / Vertical Forms）に基づき、
  文字単位で正しく変換する（CSS 回転ではない）
- **崩れないレイアウト** — 半角/全角の表示幅を厳密に計算し、枠と本文の桁が常に一致する
- **表示崩れ対策** — 罫線・矢印を専用のサブセット webfont で固定し、CJK フォント未導入の
  端末でも枠が崩れない
- **共有** — クリップボードコピー / X（旧Twitter）シェア / LINE 送信

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| ビルド | [Farm](https://farmfe.org/) |
| UI | [Preact](https://preactjs.com/) |
| 言語 | TypeScript |
| テスト | [Vitest](https://vitest.dev/) |
| Lint | [oxlint](https://oxc.rs/docs/guide/usage/linter.html) |
| デプロイ | Vercel（静的サイト） |

サーバーサイドの処理は無く、完全にクライアントサイドで完結する静的サイト。

## コマンド

```bash
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動 (http://localhost:5173)
npm run build      # 本番ビルド (dist/)
npm run preview    # 本番ビルドをローカルで確認
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```

## コア描画ロジック

`src/core/` にビジネスロジックを純粋関数として分離している。UI から独立してテストできる。

- `width.ts` — 半角=1/全角=2 の表示幅計算とパディング
- `vertical.ts` — 縦書き字形変換（句読点・かぎ括弧は Unicode の Vertical Forms /
  CJK Compatibility Forms、矢印は90°回転則）
- `render.ts` — 4形状の枠組み構築

`src/core/*.test.ts` に golden test と、「枠内の全行が同じ表示幅になる」という不変条件を
検証する property test がある。

## ライセンス

MIT（`LICENSE` 参照）。同梱のサブセットフォント `public/fonts/sd-symbols.woff2` と
`public/fonts/zen-maru-gothic-*.woff2` のみ SIL Open Font License 1.1
（`public/fonts/LICENSE-OFL.txt` / `public/fonts/LICENSE-OFL-ZenMaruGothic.txt` 参照、元フォントは
[Noto Sans Mono CJK JP](https://github.com/notofonts/noto-cjk) /
[Zen Maru Gothic](https://github.com/google/fonts/tree/main/ofl/zenmarugothic)）。
詳細は `public/fonts/NOTICE.md` 参照。

## 参考にした先行実装

「突然の死」フォーマット自体は日本のインターネット文化における汎用的な表現で、
以下のサイトを機能面の参考にした（ソースコードは移植していない）。

- [echo-sd（OSSTech）](https://www.osstech.co.jp/cgi-bin/echo-sd) — 元は
  [SATOH Fumiyasu 氏の bash スクリプト](https://github.com/fumiyas/home-commands/blob/master/echo-sd)
  （GPL-3）。オプション構成の参考にした
- [突然の死ジェネレーター（sacnoha）](https://totuzennosi.sacnoha.com/)
