## 概要
デザインの states.dc.html の「押せない時は、マウスの形も『押せない』にそろえる」を、実際に出す。

> 「あと全セッションにdesignartifactを配ったけど（Horsemanager以外）、デザイン通りになるように全部作ること」（持ち主）

デザインの正のアーティファクト（https://claude.ai/artifact/AAu7a9ZhM9RPnGKAHuds4n）はこの作業場から開けない（artifact not found）ので、リポの写し design/project（版9、2026-11-11）と比べた。

## 変更内容
| 行 | 要素 | デザインの値 | 前 | 後 |
|---|---|---|---|---|
| 40 | 押せない X・LINE のマウスの形 | not-allowed | CSS は not-allowed だが pointer-events:none のため出ない（親の .share-bar が受ける） | pointer-events:none をやめ、ボタン自身が受けて not-allowed が出る |

- 押せないままである事: href なし・aria-disabled・onClick と mousedown で preventDefault。押しても何も開かない
- tabIndex は付けない（href の無い <a> はフォーカスできず Tab の順にも入らない。tabIndex=-1 だとクリックでフォーカスが移り、その後のキーで枠が出る）
- 押せない時は、押している間の 1px の沈みも出さない
- 古くなったコメント（pointer-events:none の記述）を直した
- 行の番号は、デザインと画面を比べた表（notes/small-lot 枝の design-audit.md）の番号

## 確かめた事（head 53e7cd7）
- 新しい tests/e2e/design-disabled-cursor.spec.ts 4件
  - 押せない X・LINE: ポインタの下の要素がボタン自身で、マウスの形が not-allowed
  - 普通・中・Ctrl・Meta・Shift のクリックと Enter・Space で、新しいタブも URL の変化も起きない
  - クリックしても document.activeElement が変わらない（入力欄のまま）
  - Tab の順に入らない。押せる時は pointer のまま
- 元（#90 の先頭 90c85a5）では X・LINE の2件が失敗（ポインタの下の要素が .share-bar）。pointer-events:none を外しただけの途中の版 fe3ed6f でも、クリックで a 要素にフォーカスが移って失敗する（\`Expected: "TEXTAREA.editor-textarea" Received: "A.share-button share-button--x"\`）。この PR で全部通る
- lint・typecheck・単体テスト 152 件・build・e2e 25 件が通る（Chromium 1243）
- 押せない X・LINE に hover の色が付かない事は、hover の色を入れる別の PR（design/g2-hover、\`:not([aria-disabled="true"])\` で除いている）の側で扱う
- 200字を入れて X に乗せ、明暗 × 1440・390 で撮った（4枚とも not-allowed を測った）。横スクロール・コンソールエラーなし

## 関連Issue
Refs #76（#90 で理由を出した「押せない X・LINE」の続き）
該当なし — 持ち主の指示に基づくデザイン差分監査 行 40

積み方: #90（fix/90-disabled-reason）の上に積んだ PR。#88 → #89 → #90 → この PR の順にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
