# AGENTS.md

## Overview

sudden-death-generator - kouiso プロジェクト。「突然の死」AA をリアルタイム生成する静的サイト。
サーバーは無く、Vite でビルドした静的アセットをそのまま配信する（Vercel）。

## Development

### Language & Frameworks

- TypeScript
- Preact
- Vite（バンドラ）

### Setup

```bash
npm install
```

### Code Style

- 日本語でコメント・ドキュメントを記述（コメントは「なぜ」を書く）
- 既存コードスタイルに従う
- `src/core/` はビジネスロジックを純粋関数として置く場所。UI (`src/component/`, `src/app.tsx`)
  から状態を持ち込まない

### Commands

```bash
npm run dev        # 開発サーバー (http://localhost:5173)
npm run build      # 本番ビルド
npm run preview    # 本番ビルドをローカルで確認
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```

### Font subset の再生成

`public/font/sd-symbols.woff2` は罫線・矢印の表示崩れ対策のサブセットフォント。
再生成する場合:

```bash
pip install fonttools brotli
bash script/subset-font.sh /path/to/NotoSansMonoCJKjp-Regular.otf
```

ソースフォントの取得元は `script/subset-font.sh` のコメントを参照。

## GitHub Project での作業管理

- この repo の作業は GitHub Project（`.github/scrum-board.yml` の番号）で管理する
- 次にやる物を決める・課題を起票する・Status を動かす・繰り越す時は必ず先に `.agents/skills/scrum-board/SKILL.md`（`.claude/skills/scrum-board/`）を読んでから手を付ける
- 読めない・見つからない場合の要点: 次にやる物=盤の「今週の Iteration」で Wait 空の先頭（無ければ「無し」と答える・issue一覧や open PR から選ばない）・課題は題の頭に `[PBI]`/`[SBI]` を付け sub-issue と盤登録と項目（Iteration・Priority・Estimate・Size）までやる・繰り越しは `kouiso/.github` の `scripts/scrum_keeper/scrum_keeper.py --job carryover|okawari` を使う
- Status は Backlog / In progress / In review / Done の 4 つ。Todo は作らん
