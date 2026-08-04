# AGENTS.md

## Overview

sudden-death-generator - kouiso プロジェクト。「突然の死」AA をリアルタイム生成する静的サイト。
サーバーは無く、Farm でビルドした静的アセットをそのまま配信する（Vercel）。

## Development

### Language & Frameworks

- TypeScript
- Preact
- Farm（バンドラ）

### Setup

```bash
npm install
```

### Code Style

- 日本語でコメント・ドキュメントを記述（コメントは「なぜ」を書く）
- 既存コードスタイルに従う
- `src/core/` はビジネスロジックを純粋関数として置く場所。UI (`src/components/`, `src/app.tsx`)
  から状態を持ち込まない

### Commands

```bash
npm run dev        # 開発サーバー (http://localhost:5173)
npm run build      # 本番ビルド
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```

### Font subset の再生成

`public/fonts/sd-symbols.woff2` は罫線・矢印の表示崩れ対策のサブセットフォント。
再生成する場合:

```bash
pip install fonttools brotli
bash scripts/subset-font.sh /path/to/NotoSansMonoCJKjp-Regular.otf
```

ソースフォントの取得元は `scripts/subset-font.sh` のコメントを参照。
