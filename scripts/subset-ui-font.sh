#!/usr/bin/env bash
set -euo pipefail

# UI（見出し・ボタン・ラベル等）のフォールバックが Hiragino/Yu Gothic/Noto Sans JP のみだと、
# それらが未導入の環境では特徴の薄い汎用ゴシックに落ちてしまう。この対策として Zen Maru Gothic
# (SIL Open Font License 1.1) から実際に UI で使っている文字だけを抜き出し、専用の woff2 として
# 同梱する（scripts/ui-font-corpus.txt に実際の UI 文言を列挙し、そこから必要文字を機械的に算出する
# ことで、手打ちの Unicode 範囲指定にありがちな似た文字ブロックの取り違えを避ける）。
#
# 使い方:
#   前提: Bash 4.0 以降（下記の EXPECTED_SHA256 連想配列が declare -A に依存するため。
#         macOS 標準の /bin/bash は 3.2 系で非対応。Homebrew 等で新しい bash を入れて実行すること）
#   pip install fonttools brotli
#   bash scripts/subset-ui-font.sh /path/to/ZenMaruGothic-Regular.ttf \
#                                   /path/to/ZenMaruGothic-Bold.ttf \
#                                   /path/to/ZenMaruGothic-Black.ttf
#
# ソースフォントの取得元 (OFL 1.1 でこのリポジトリへの再配布が許可されている):
#   https://github.com/google/fonts/tree/main/ofl/zenmarugothic
#   (Google Fonts CDN 経由: https://fonts.gstatic.com/s/zenmarugothic/... の各ウェイト)
#
# 取得元は "main" ブランチの参照であり特定コミットに固定していない
# （sd-symbols 同様、このリポジトリの開発環境から GitHub API 経由でコミット SHA を確認できなかった
# ため）。代わりに、2026-08-05 に実際に取得したバイト列の SHA-256 をこの値に固定し、
# 検証済みのソースと異なるファイルが渡された場合は処理を中断する。
declare -A EXPECTED_SHA256=(
  [400]="fea6d7937b375090353e9df58987b784bb807ca8aa2e28d9c0c018f13ee21221"
  [700]="cd35e29918e3b485606211f7f8e7fac943a2e46422868f55fcadb45e1011ddb8"
  [900]="063367e350e7c8221e0e12ed590910a7814f84bb2826e284db0505317ef4b6e6"
)

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset が見つからない。'pip install fonttools brotli' を先に実行してください" >&2
  exit 1
fi

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "sha256sum が見つからない。ソースフォントの整合性を検証できないため中断する" >&2
  exit 1
fi

SRC_400="${1:?ソースフォント (Regular/400) のパスを指定してください}"
SRC_700="${2:?ソースフォント (Bold/700) のパスを指定してください}"
SRC_900="${3:?ソースフォント (Black/900) のパスを指定してください}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/fonts"
CORPUS="$ROOT_DIR/scripts/ui-font-corpus.txt"
mkdir -p "$OUT_DIR"

declare -A SRC_PATHS=([400]="$SRC_400" [700]="$SRC_700" [900]="$SRC_900")

for weight in 400 700 900; do
  src="${SRC_PATHS[$weight]}"
  actual="$(sha256sum "$src" | awk '{print $1}')"
  expected="${EXPECTED_SHA256[$weight]}"
  if [ "$actual" != "$expected" ]; then
    echo "ウェイト ${weight} のソースフォントの SHA-256 が想定値と一致しない。想定していない配布物・改変されたファイルの可能性がある" >&2
    echo "  期待値: $expected" >&2
    echo "  実際値: $actual" >&2
    echo "正規の upstream 更新であれば、確認の上で本スクリプトの EXPECTED_SHA256 を更新すること" >&2
    exit 1
  fi

  pyftsubset "$src" \
    --output-file="$OUT_DIR/zen-maru-gothic-${weight}.woff2" \
    --flavor=woff2 \
    --text-file="$CORPUS" \
    --unicodes="U+0020-007E" \
    --no-layout-closure \
    --drop-tables+=DSIG

  echo "生成完了: $OUT_DIR/zen-maru-gothic-${weight}.woff2"
done
