## 概要
文字の組み方と余白、押せない縦書きのチェックの見た目をデザインにそろえる（CSS と色の決まりだけ。単位は rem）。

> 「あと全セッションにdesignartifactを配ったけど（Horsemanager以外）、デザイン通りになるように全部作ること」（持ち主）

デザインの正のアーティファクト（https://claude.ai/artifact/AAu7a9ZhM9RPnGKAHuds4n）はこの作業場から開けない（artifact not found）ので、リポの写し design/project（版9、2026-11-11）と比べた。行の番号は、デザインと画面を比べた表（notes/small-lot 枝の design-audit.md）の番号。

## 変更内容
| 行 | 要素 | デザインの値 | 前 | 後 |
|---|---|---|---|---|
| 1 | ページの下の余白（1440） | 56px | 48px | 56px |
| 2 | ページの下の余白（390） | 32px | 16px | 32px |
| 3 | 題（h1）の行の高さ | 1.3 | normal | 1.3 |
| 4 | 副題 | 14px / 1.6 / balance | 14.4px / normal / wrap（390 で「す。」が1行に残る） | 14px / 1.6 / balance |
| 8 | ラベル | 13.5px | 13.6px | 13.5px |
| 10 | 押せない縦書きのチェック | 薄い色 / not-allowed | 本文の色 / pointer | 薄い色 / not-allowed（文言は変えない） |
| 12 | 入力欄の placeholder の色 | --mu #5b6478 / 暗 #9aa2b8 | ブラウザの既定 #757575（暗い表示で約 2.6） | 薄い色の決まり（明暗とも） |
| 13 | 形の選択のボタン | 余白 12px 8px / 間 6px / 13.5px、高さ約 73px（アイコン 24px） | 10px 8px / 4px / 13.12px、アイコンの枠 28px、高さ 73px（Chromium 1243 で測った値。デザインと画面を比べた表の 69px は別の環境の値） | 12px 8px / 6px / 13.5px、アイコンの枠 24px、高さ 72.2px |
| 14 | 選んでいる形の背景 | --act #e9eefc / 暗 #232b47 | color-mix 12%（約 #e6ecfb / #242b44） | 新しい決まり --color-accent-tint（#e9eefc / #232b47） |
| 46 | 注記 | 12.5px / 1.7 | 12.48px / normal | 12.5px / 1.7 |

- ページの下の余白は、390px の 32px から約 1225px 以上の 56px まで滑らかにつなぐ（間の幅はデザインに値が無い）
- 形のボタンの高さ: 余白・間・文字の大きさとアイコンの枠（24px）をデザインに合わせても、行の高さが normal のままだと 76px になる（アイコンの枠が 28px のままなら 80px）。デザインの `.sp` は `font:700 13.5px 'Zen Maru Gothic',sans-serif`（Screen.dc.html:34）で、この書き方は行の高さを normal にする。この UI の書体では normal が 76px になり、描かれた約 73px と合わないので、アイコンの枠を 24px にし、ラベルの行の高さを 1.2 にした。**1.2 はこのレーンが決めた値**（リードが了承した。持ち主が normal を望むなら1行で戻せる）。高さが 72.2px なのは、Chrome が DPR 1 で 1.5px の枠を 1px に丸めるため（デザインも同じ）

## 確かめた事（head bff642c）
- 新しい tests/e2e/design-type-spacing.spec.ts 13件。元（G1 の先頭）では失敗（例: 下の余白 `Received: "48px"`、副題 `"14.4px"`、placeholder `"rgb(117, 117, 117)"`、形のアイコンの枠 `Received: 28`）、この PR で通る
- コントラスト: placeholder 明 5.58 / 暗 5.73、選んでいる形 6.83 / 5.69、押せないチェック 5.93 / 6.51（すべて 4.5 以上）
- lint・typecheck・単体テスト 152 件・build・e2e 32 件が通る（Chromium 1243）
- 明暗 × 1440・390 で撮った。横スクロール・コンソールエラーなし

## 関連Issue
該当なし — 持ち主の指示に基づくデザイン差分監査 行 1・2・3・4・8・10・12・13・14・46

積み方: design/g1-dark-surfaces の上に積んだ PR。G1 を先にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
