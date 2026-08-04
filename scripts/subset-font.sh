#!/usr/bin/env bash
set -euo pipefail

# 罫線・矢印など East Asian Ambiguous な文字は CJK フォント未導入端末で半角描画され、
# 四角形・短冊の枠がガタガタに崩れる。この対策として Noto Sans Mono CJK JP
# (SIL Open Font License 1.1) から必要なコードポイントだけ抜き出し、
# unicode-range で該当文字だけ上書きする woff2 を生成する。
#
# 使い方:
#   pip install fonttools brotli
#   bash scripts/subset-font.sh /path/to/NotoSansMonoCJKjp-Regular.otf
#
# ソースフォントの取得元 (OFL 1.1 でこのリポジトリへの再配布が許可されている):
#   https://github.com/notofonts/noto-cjk/blob/main/Sans/Mono/NotoSansMonoCJKjp-Regular.otf

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset が見つからない。'pip install fonttools brotli' を先に実行してください" >&2
  exit 1
fi

SRC_FONT="${1:?ソースフォント (NotoSansMonoCJKjp-Regular.otf) のパスを指定してください}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/fonts"
mkdir -p "$OUT_DIR"

# 文字リテラルをシェルスクリプトに直書きすると、見た目が近い別ブロック
# （Vertical Forms U+FE1x と Small Form Variants U+FE5x など）を誤って
# 転記する事故が起きうる（実際に一度 pyftsubset の出力 cmap で検出した）。
# そのため --text ではなく --unicodes で U+ 表記のコードポイントを直接指定する。
#
# ASCII: Y ^                      (通常形の下辺 "Y^")
# 矢印:  U+2190-2193, U+2196-2199 (← ↑ → ↓ ↖ ↗ ↘ ↙)
# 罫線:  U+2500-2503, U+250C, U+250F, U+2510, U+2513, U+2514, U+2517, U+2518, U+251B
#        (─ ━ │ ┃ ┌ ┏ ┐ ┓ └ ┗ ┘ ┛)
# 漢字:  U+4EBA                   (人)
# 縦書き提示形: U+FE11, U+FE12, U+FE41-FE44 (﹑ ﹒ ﹁ ﹂ ﹃ ﹄)
# 全角記号: U+FF1C, U+FF1E, U+FF3F, U+FF5C, U+FFE3 (＜ ＞ ＿ ｜ ￣)
UNICODES="U+0059,U+005E,U+2190-2193,U+2196-2199,U+2500-2503,U+250C,U+250F,U+2510,U+2513,U+2514,U+2517,U+2518,U+251B,U+4EBA,U+FE11,U+FE12,U+FE41-FE44,U+FF1C,U+FF1E,U+FF3F,U+FF5C,U+FFE3"

pyftsubset "$SRC_FONT" \
  --output-file="$OUT_DIR/sd-symbols.woff2" \
  --flavor=woff2 \
  --unicodes="$UNICODES" \
  --no-layout-closure \
  --drop-tables+=DSIG

echo "生成完了: $OUT_DIR/sd-symbols.woff2"
