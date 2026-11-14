## 概要
デザインの states.dc.html の「マウスを乗せた」に、共有ボタン4つの hover の色をそろえる。

> 「あと全セッションにdesignartifactを配ったけど（Horsemanager以外）、デザイン通りになるように全部作ること」（持ち主）

デザインの正のアーティファクト（https://claude.ai/artifact/AAu7a9ZhM9RPnGKAHuds4n）はこの作業場から開けない（artifact not found）ので、リポの写し design/project（版9、2026-11-11）と比べた。

## 変更内容
| 行 | 要素 | デザインの値 | 前 | 後 |
|---|---|---|---|---|
| 32 | コピー hover | 背景 --ach（#1f47b8 / 暗 #8ca0ff） | 色は同じで、さらに filter:brightness(1.05) でわずかに明るい | 色だけ（filter なし） |
| 33 | X hover | 背景 #2a2f36 | 変わらない #14171a | #2a2f36 |
| 34 | LINE hover | 背景 #026a2c | 変わらない #037a33 | #026a2c |
| 35 | リンクをコピー hover | 文字・枠線とも --ac | 文字は --tx のまま、枠線だけ --ac | 文字も --ac |

- 押している間（行 37、1px 下がる）は変えていない（デザインに描いていないので、持ち主に聞く）
- 押せない X・LINE には hover の色を付けない
- 行の番号は、デザインと画面を比べた表（notes/small-lot 枝の design-audit.md）の番号

## 確かめた事（head 911e85a）
- 新しい tests/e2e/design-hover.spec.ts（page.hover と expect.poll）8件。元（#94 の先頭 56dc02d）では 8件失敗（例: X `Expected "rgb(42, 47, 54)" Received "rgb(20, 23, 26)"`）、変更後は全部通る
- hover の時の文字のコントラスト（明 / 暗）: コピー 7.92 / 7.88、X 13.48 / 13.48、LINE 6.77 / 6.77、リンク 5.15 / 4.73。すべて 4.5 以上
- lint・typecheck・単体テスト 152 件・build・e2e 29 件が通る（Chromium 1243）
- 明暗 × 1440・390 で LINE に乗せて撮った。横スクロール・コンソールエラーなし

## 関連Issue
Refs #78（マネージャーの判断: hover の色は states.dc.html の一部で、#78 の最初の項目に入る）
該当なし — 持ち主の指示に基づくデザイン差分監査 行 32〜35
#78 の項目「明るい表示・暗い表示 × 幅 1440px・390px で実装の画面を撮り、design/project/states.dc.html・Screen.dc.html・Screen390.dc.html の共有ボタンと並べて、ボタンの色・下線・X の枠線が合っている」のうち、hover の色の分（デザイン差分の表の行 32〜35）

積み方: #94（fix/94-copy-accent）の上に積んだ PR。#95 → #92 → #96 → #94 → この PR の順にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
