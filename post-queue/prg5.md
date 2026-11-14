## 概要
テーマ切替のボタンとチェックボックスの行を、デザインの押せる範囲の大きさにそろえる。

**この PR は、PBI #79 が des-08（押せる範囲の大きさ）を見送った判断を、持ち主のその後の指示（下の引用）に基づいて覆す。** 持ち主はこの PR だけを採らないと決められる（積み方の上では G6 の上だが、ほかの PR はこの PR に頼っていない）。

> 「あと全セッションにdesignartifactを配ったけど（Horsemanager以外）、デザイン通りになるように全部作ること」（持ち主）

デザインの正のアーティファクト（https://claude.ai/artifact/AAu7a9ZhM9RPnGKAHuds4n）はこの作業場から開けない（artifact not found）ので、リポの写し design/project（版9、2026-11-11）と比べた。行の番号は、デザインと画面を比べた表（notes/small-lot 枝の design-audit.md）の番号。

## 変更内容
| 行 | 要素 | デザインの値 | 前 | 後 |
|---|---|---|---|---|
| 5 | テーマ切替のボタン | 44×44px | 40×40px | 44×44px |
| 9 | チェックボックスの行 | 最小の高さ 44px / 14.5px / 間 4px 20px | 24px / 14.4px / 16px（上の余白 12px） | 44px / 14.5px / 間 4px 20px（上 8px） |

- 合わせて: チェックボックスのブラウザの既定の margin を 0 にした（デザインの `.ck input{margin:0}`）。入力欄を display:block にして、すぐ下との間をデザインの 8px にした（前は inline-block の文字の下の隙間で約 13〜17px）

## 確かめた事（head 75dd3c4）
- 新しい tests/e2e/design-tap-targets.spec.ts 10件。元（G6 の先頭）では 9件失敗（例: チェックボックスの行の高さ `Received: 24`、行の間 `Received: "16px"`）。通るのは 390px の横スクロールなしの確かめ1件
- 測った値: 切替 44×44（明暗、1440・390）、行の高さ 44、14.5px、列の間 20px・行の間 4px、入力欄のすぐ下 8px。390px で切替はカードの中に収まり、横スクロールなし
- lint・typecheck・単体テスト 152 件・build・e2e 51 件が通る（Chromium 1243）
- 明暗 × 1440・390 で撮った。コンソールエラーなし

## 関連Issue
該当なし — 持ち主の指示に基づくデザイン差分監査 行 5・9

積み方: design/g6-shape-container の上に積んだ PR。G1 → G4 → G6 → この PR の順にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
