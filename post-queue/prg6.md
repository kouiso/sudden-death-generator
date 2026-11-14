## 概要
480px 以下の切り替えを、デザイン（Screen.dc.html・Screen390.dc.html）どおり、画面の列全体（`.shell`）の container query にする。

> 「あと全セッションにdesignartifactを配ったけど（Horsemanager以外）、デザイン通りになるように全部作ること」（持ち主）

デザインの正のアーティファクト（https://claude.ai/artifact/AAu7a9ZhM9RPnGKAHuds4n）はこの作業場から開けない（artifact not found）ので、リポの写し design/project（版9、2026-11-11）と比べた。行の番号は、デザインと画面を比べた表（notes/small-lot 枝の design-audit.md）の番号。

## 変更内容
| 行 | 要素 | デザインの値 | 前 | 後 |
|---|---|---|---|---|
| 15 | 形の選択の列 | `.shell` を container にし、@container (max-width:480px) で 2 列 | 画面の幅 480px 未満で 2 列 | 列（.app-shell）が 480px 以下で 2 列（画面の幅 512px 以下） |
| 15 と同じ決まり | 題（h1）の大きさ | 32px、container ≤480px で 24px | clamp(1.5rem, 4vw, 2rem)（画面の幅で少しずつ変わる） | 2rem、container ≤480px で 1.5rem |
| 15 と同じ決まり | カードの内側の余白 | 28px、container ≤480px で 16px | clamp(16px, 3vw, 28px) | 1.75rem、container ≤480px で 1rem |

- container の名前は `shell`。共有ボタンの並び（#91）も `@container shell (...)` で同じ container を使える
- デザインの同じ決まりは、共有ボタンも ≤480px で1列にする。今の共有ボタンは画面の幅 ≤480px で1列（481〜640px は2列）なので、画面の幅 481〜512px の間だけデザインとずれる（今は2列、デザインは1列）。共有ボタンの並びは #91 が決まっていないので触っていない
- ページの余白の clamp() は変えていない

## 確かめた事（head 073b8cd）
- tests/e2e/design-shape-container.spec.ts: 画面の幅 320〜800 を 1px ずつ動かし、列の数・題の大きさ・カードの余白が列の幅に合わせて変わり、切り替えが 513px である事を確かめる。320/390/481/512/513/560/720/1440 でカードの中の横のはみ出し・ページの横スクロールなし。元（G4 の先頭、画面の幅で判定）では 3件失敗（例: 481 で `Expected: 2 Received: 4`）
- 切り替えは画面の幅 512px（2列）/ 513px（4列）
- lint・typecheck・単体テスト 152 件・build・e2e 41 件が通る（Chromium 1243）
- 明暗 × 1440・390 で撮った。横スクロール・コンソールエラーなし

## 関連Issue
該当なし — 持ち主の指示に基づくデザイン差分監査 行 15

積み方: design/g4-type-spacing の上に積んだ PR。G1 → G4 → この PR の順にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
