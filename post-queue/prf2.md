## 概要
#96 と G2（共有ボタンの hover の色）の審査で残った、テストの抜けを埋める。実装は変えていない。どれも今の動きを固定するテストなので、変更前のコードでも通る。

## 変更内容
新しい `tests/e2e/followup-theme-media.spec.ts`（8件: media の決まり 2・押している間 4・暗い表示の hover 2）。
1. data-theme が無い時の `prefers-color-scheme` の決まり
   - 暗: X の枠線 #565e7a（rgb(86, 94, 122)）、コピーの塗り rgb(109, 139, 255)
   - 明: X の枠線 rgb(20, 23, 26)、コピーの塗り rgb(47, 95, 224)（明は :root の既定の値で、暗い media の決まりが明の OS では効かない事を確かめる）
   - アプリは読み込みの直後に useTheme の effect が必ず data-theme を付けるので、読み込んだ後に属性を外し、CSS の media の決まりだけを測る。localStorage が空のままである事も確かめる
2. 押している間は今のまま（デザインに押している間の絵は無く、1px 下がる動きを残すかは持ち主に聞いている。持ち主が外すと決めたら、このテストも一緒に変える）: コピー・X・LINE・リンクをコピーの4つで、mousedown の間の transform が `matrix(1, 0, 0, 1, 0, 1)`（1px 下）。離すと none に戻る
3. 暗い表示で X・LINE に乗せても文字のコントラストが 4.5 以上。X の hover の時の枠線は #565e7a のまま
- 色は transition の途中の値を返す事があるので、`expect.poll` で最後の値を待つ

## 確かめた事（head f316a26）
- e2e（design/g2-hover の上）を3回続けて回し、3回とも 37 passed（既存 29 + 新規 8）。新しい spec だけを --repeat-each 5 で回すと 40 passed。Chromium 1243
- lint・typecheck・build が通る。単体テスト 152 件
- 今の動きを固定するテストなので、直す前の失敗は無い（変更前でも通る）
- package-lock.json の差分なし

## 関連Issue
Refs #96 #78

積み方: design/g2-hover の上に積んだ PR。先にそちらをマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
