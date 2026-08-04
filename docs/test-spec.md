# テスト仕様書

新実装（Preact + Farm + TypeScript 7）の受入テスト。実施結果は各項目に追記する。

## 実施環境

- ビルド: `npm run build`（本番ビルド）
- サーバー: `npm run preview` で本番ビルドを配信
- 検証ツール: Playwright（Chromium, `/opt/pw-browsers/chromium-1194`）
- 自動テスト: `vitest run`（`src/core/*.test.ts`）

---

## A. 単体テスト（自動・vitest）

| # | 項目 | 期待結果 |
|---|---|---|
| A1 | `charWidth` / `stringWidth` | ASCII・半角カナ=1、漢字・かな・絵文字=2 |
| A2 | `padEndToWidth` / `padCenterToWidth` | 目標幅に厳密一致（奇数差分も半角+全角で正確に埋まる） |
| A3 | `toVerticalGlyph` | 句読点・かぎ括弧が Unicode 縦書き提示形の正しいコードポイントに変換される |
| A4 | `renderSuddenDeath` golden test | 通常形・四角形・短冊・縦書きの既定文言出力が期待値と1文字も違わない |
| A5 | 不変条件（枠内の全行が同じ表示幅） | normal/square × vertical × padding の全組み合わせ、tanzaku（フレーム単位）、stress（末尾枠部分）で成立 |
| A6 | ストレス形状の行消費順序 | 入力行を順にジグザグへ消費し、最終行を枠で締める |
| A7 | 余白オプション | 枠の内側上下に空行が1行ずつ増える |

## B. 実機（ブラウザ）受入テスト

| # | 項目 | 操作 | 期待結果 |
|---|---|---|---|
| B1 | 初期表示 | ページを開く | 生成ボタン無しで既定文言「突然の死」がプレビューに表示される |
| B2 | リアルタイムプレビュー | テキスト入力欄に文字を打つ | 送信操作なしで即座にプレビューが更新される |
| B3 | 通常形の左右対称性 | 「突然の死」を入力 | `＞　突然の死　＜` の左右に全角スペースが対称に入る（旧実装の非対称バグが再発していない） |
| B4 | 四角形 | 四角形を選択 | 枠が直線・直角に揃う（webfont 適用でズレない） |
| B5 | 短冊 | 短冊を選択、縦書きチェックボックス | 文字が縦一列に表示され、縦書きチェックボックスが disabled になる |
| B6 | ストレス複数行 | 複数行入力しストレスを選択 | 入力行が順に「↘」で繋がり、最終行が枠で締められる |
| B7 | 縦書きオプション | 通常形で縦書きをチェック | CSS回転ではなく文字ごとに1行の枠として表示され、文字が重ならず判読できる |
| B8 | 余白オプション | 余白をチェック | 枠の内側上下に空白行が増える |
| B9 | コピー | コピーボタンを押す | クリップボードの内容がプレビューと一致し、トーストが表示される（`alert()` は使わない） |
| B10 | X シェア | 「X でシェア」リンク | `href` が `twitter.com/intent/tweet?text=<現在の出力>` になっている |
| B11 | LINE 送信 | 「LINE で送信」リンク | `href` が `line.me/R/msg/text/?<現在の出力>` になっている |
| B12 | ダークモード切り替え | テーマ切り替えボタン | `data-theme` が切り替わり、配色がダークになる |
| B13 | モバイル幅 | ビューポート 375px | `body` が横スクロールしない |
| B14 | コンソールエラー | 全操作を通して | `console.error` / `pageerror` が発生しない（HMR 接続ログ等のノイズは除く） |
| B15 | 空入力 | 入力を全消去 | 既定文言「突然の死」にフォールバックし、無反応にならない |

---

## 実施結果

実施日: 本 PR 作成時。対象: `npm run build` の本番ビルドを `npm run preview`（Farm, port 1911）で
配信し、Playwright (Chromium) で操作。

### A. 単体テスト

```
npm test

 Test Files  3 passed (3)
      Tests  68 passed (68)
```

全項目 PASS（width.test.ts / vertical.test.ts / render.test.ts）。

### B. 実機受入テスト — 15/15 PASS

| # | 結果 | 実測 |
|---|---|---|
| B1 | PASS | 既定文言 `＿人人人人人人＿ / ＞　突然の死　＜ / ￣Y^Y^Y^Y^Y^Y^￣` が生成ボタン無しで表示 |
| B2 | PASS | textarea 入力のみでプレビューが即更新（submit 操作なし） |
| B3 | PASS | `＞　突然の死　＜` — 左右とも全角スペース1つで対称（旧実装の非対称バグ再発なし） |
| B4 | PASS | `┌──────┐ / │　突然の死　│ / └──────┘` — 枠が本体幅から正しく導出 |
| B5 | PASS | 短冊が `┏━┓/┃突┃/┃然┃/┃の┃/┃死┃/┗━┛` の縦一列。縦書きチェックボックスは `disabled` |
| B6 | PASS | `残業→↘→休日出勤→↘→...` の順で入力行を消費 |
| B7 | PASS | `＿人人人＿ / ＞　突　＜ / ＞　然　＜ / ＞　の　＜ / ＞　死　＜ / ￣Y^Y^Y^￣` — 文字重なりなし |
| B8 | PASS | 余白ONで行数が6→8（上下に空行が1行ずつ増加） |
| B9 | PASS | `navigator.clipboard.readText()` の内容がプレビューと完全一致、トースト表示を確認 |
| B10 | PASS | `href` が `https://twitter.com/intent/tweet?text=<encodeURIComponent(現在の出力)>` と一致 |
| B11 | PASS | `href` が `https://line.me/R/msg/text/?<encodeURIComponent(現在の出力)>` と一致 |
| B12 | PASS | ボタン押下で `document.documentElement.dataset.theme` が `dark` に切り替わる |
| B13 | PASS | viewport 375px で `document.body.scrollWidth`(375) が viewport 幅(375) を超えない |
| B14 | PASS | `console.error` / `pageerror` の発生なし（Farm HMR の debug ログのみ、ノイズとして除外） |
| B15 | PASS | 入力を全消去すると既定文言 `突然の死` にフォールバック |

スクリーンショット: `/tmp/claude-0/.../scratchpad/shots-spec/B1.png` 〜 `B15.png`
（一時領域のためリポジトリには含めない。本レポートの実測値がテキストとしての検証結果）。

### 結論

単体テスト 68/68、実機受入テスト 15/15 の全項目が PASS。Phase 0 で確定した旧実装の不具合
（非対称パディング、短冊・縦書きの完全崩壊、余白オプション欠落、`alert()`）は全て解消を確認した。
