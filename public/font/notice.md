# sd-symbols.woff2 について

罫線・矢印文字（`─ ━ ┌ ┏ ↘ ↙` 等、Unicode の East Asian Ambiguous）は CJK フォント未導入の
端末では半角幅で描画され、四角形・短冊の枠が崩れる。加えて、表示幅モデルが前提とする
「半角=全角ちょうど半分」は、ユーザーが入力する任意の ASCII 文字が和文フォントより先に
評価される Latin 専用等幅フォント（SF Mono 等）に落ちた場合に成立しない環境がある。
この対策として、罫線・矢印・ASCII印字可能域を含む必要な文字だけをサブセット化した
専用フォントを同梱している。

- 元フォント: [Noto Sans Mono CJK JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/Mono/NotoSansMonoCJKjp-Regular.otf)
- ライセンス: SIL Open Font License, Version 1.1（同梱の `license-ofl.txt` 参照）
- ソース検証: 2026-08-04 に取得したソースフォントの SHA-256 は
  `4d01725be822d144cf9a56ade981e6fb920cd7a610b8fc24cc601a920beea5b9`。
  `script/subset-font.sh` はこの値と一致しないファイルを拒否する（`main` 参照は特定コミットに
  固定していないため、改変・別物のファイルが渡された場合に同じ手順で異なる `sd-symbols.woff2` が
  生成されるのを防ぐための最終防御）
- 生成方法: `script/subset-font.sh`（fonttools の `pyftsubset` で該当コードポイントのみ抽出）
- 収録文字: ASCII印字可能域 U+0020–007E（半角スペース〜チルダ、全ての枠・入力テキストの
  半角文字がこのフォントの0.5em幅に固定される。以前は `Y ^` の2文字のみ収録しておりASCII
  混在入力でフォント環境依存の枠ズレが起きていたため、2026-08-09 に拡張した）+
  全角スペース U+3000（枠内パディング・列区切り・ストレスの字下げに使う、アプリが自分で
  出力する構造用の空白。ASCIIと同じ「収録済みグリフは全部このフォントに含める」方針で
  2026-08-09 に追加。実機検証では現状のフォールバック順で崩れは再現しないが防御的に含める）+
  `← ↑ → ↓ ↖ ↗ ↘ ↙ ─ ━ │ ┃ ┌ ┏ ┐ ┓ └ ┗ ┘ ┛ ┷ 人 ＜ ＞ ＿ ｜ ￣` +
  縦書き提示形 U+FE10–FE19（， ： ； ！ ？ 〖 〗 …）/ U+FE35–FE40（︵ ︶ ｛ ｝ 〔 〕 【 】 《 》 〈 〉）/
  U+FE41–FE44（「 」 『 』）/ U+FE47–FE48（［ ］）
  （提示形は等幅フォント非搭載環境で表示できない可能性があるためコードポイント表記。
  元サイト(echo-sd)との機能比較で見つかった縦書きカバー範囲の差分を埋めるために2026-08-06追加）

# zen-maru-gothic-{400,700,900}.woff2 について

UI（見出し・ボタン・ラベル等）が Hiragino Sans / Yu Gothic UI / Noto Sans JP のいずれも
未導入の環境（本番の実ユーザー環境も含む）にフォールバックすると、特徴の薄い汎用ゴシックに
なってしまう。この対策として、実際に UI 文言で使っている文字だけを抜き出した Zen Maru Gothic
のサブセットを3ウェイト分同梱している。外部フォントCDN（Google Fonts 等）への実行時依存を
避けるため、ビルド時に静的ファイルとして同梱する方式にしている。

- 元フォント: [Zen Maru Gothic](https://github.com/google/fonts/tree/main/ofl/zenmarugothic)
  （Google Fonts 経由で配布、weight 400 / 700 / 900）
- ライセンス: SIL Open Font License, Version 1.1（同梱の `license-ofl-zen-maru-gothic.txt` 参照。
  Copyright 2021 The Zen Maru Gothic Project Authors）
- ソース検証: 2026-08-05 に `fonts.gstatic.com` から取得したソースフォント（各ウェイトの TTF）の
  SHA-256 は `script/subset-ui-font.sh` の `EXPECTED_SHA256` 連想配列に記載の値。一致しない
  ファイルは拒否する（`main` 参照はコミット固定ではないため、改変・別物のファイルが渡された場合の
  最終防御）
- 生成方法: `script/subset-ui-font.sh`（`script/ui-font-corpus.txt` に列挙した実際の UI 文言から
  `pyftsubset --text-file` で必要文字を機械的に抽出。手打ちの Unicode 範囲指定にありがちな
  似た文字ブロックの取り違えを避けるため、コードポイントではなく実文言そのものを入力にしている）
- 収録範囲: `script/ui-font-corpus.txt` に列挙した実際の UI 文言（見出し・ボタン・ラベル・
  トースト文言等）＋ ASCII 印字可能域（U+0020–007E）。数式用の 𝕏（U+1D54F、X共有ボタンの装飾）は
  対象外で、フォントスタックの次の候補にフォールバックする
- UI コピーを追加・変更した場合は `script/ui-font-corpus.txt` を更新し、
  `bash script/subset-ui-font.sh <400.ttf> <700.ttf> <900.ttf>` を再実行すること
