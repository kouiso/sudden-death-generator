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
npm run test:e2e   # Playwright (ローカル: 初回のみ `npx playwright install chromium`)
```

クラウド環境には固定版と異なる Chromium が入っていて既定の起動先が存在しないため、`PW_CHROMIUM_PATH` で実行ファイルを指す:

```bash
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npm run test:e2e -- --trace off
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

- この repo のボードの設定は `.github/scrum-board.yml` にある
- 手順は global skill `scrum-board` に従う
