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
#
# 取得元は "main" ブランチの参照であり特定コミットに固定していない
# （このリポジトリの開発環境からは GitHub API 経由でコミット SHA を確認できなかったため）。
# 代わりに、2026-08-04 に実際に取得したバイト列の SHA-256 をこの値に固定し、
# 検証済みのソースと異なるファイルが渡された場合は処理を中断する。
# 正規の upstream 更新に追従する場合は、新しいソースの SHA-256 を確認した上で
# この値を意図的に更新すること（黒魔術的にスキップしない）。
EXPECTED_SHA256="4d01725be822d144cf9a56ade981e6fb920cd7a610b8fc24cc601a920beea5b9"

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset が見つからない。'pip install fonttools brotli' を先に実行してください" >&2
  exit 1
fi

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "sha256sum が見つからない。ソースフォントの整合性を検証できないため中断する" >&2
  exit 1
fi

SRC_FONT="${1:?ソースフォント (NotoSansMonoCJKjp-Regular.otf) のパスを指定してください}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/fonts"
mkdir -p "$OUT_DIR"

ACTUAL_SHA256="$(sha256sum "$SRC_FONT" | awk '{print $1}')"
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  echo "ソースフォントの SHA-256 が想定値と一致しない。想定していない配布物・改変されたファイルの可能性がある" >&2
  echo "  期待値: $EXPECTED_SHA256" >&2
  echo "  実際値: $ACTUAL_SHA256" >&2
  echo "正規の upstream 更新であれば、確認の上で本スクリプトの EXPECTED_SHA256 を更新すること" >&2
  exit 1
fi

# 文字リテラルをシェルスクリプトに直書きすると、見た目が近い別ブロック
# （Vertical Forms U+FE1x と Small Form Variants U+FE5x など）を誤って
# 転記する事故が起きうる（実際に一度 pyftsubset の出力 cmap で検出した）。
# そのため --text ではなく --unicodes で U+ 表記のコードポイントを直接指定する。
#
# ASCII印字可能域: U+0020-007E (半角スペース〜チルダ、95文字)
#   このアプリの表示幅モデルは「半角=全角ちょうど半分」を前提に枠の桁数を計算する
#   （render.ts の renderFramed 参照）。以前は "Y ^"（通常形の下辺）だけを収録していたが、
#   ユーザーが入力する任意のASCII文字はこのフォントの対象外だったため、実際の描画幅は
#   CSSフォントスタック（tokens.css の --font-mono）で ASCII の次に来る和文フォント環境
#   では偶然0.5emに揃うものの、Latin専用の等幅フォント（SF Mono / Cascadia Code /
#   Consolas 等、和文フォントより先に評価される）がインストールされた環境では0.55〜
#   0.60em程度になり、全角(1.0em)のちょうど半分から外れて枠がズレる
#   （自己レビューで、フォントテーブルの実測とヘッドレスChromiumでのレンダリングの両方で
#   確認した不具合。tokens.css 側の並び順ではなく、ASCII文字自体をこのサブセットに含めて
#   都度0.5emへ固定する方を採る。Latin専用等幅を先に置く判断自体はASCII以外の文字での
#   字形の好みとして tokens.css 側に残す）。
# 矢印:  U+2190-2193, U+2196-2199 (← ↑ → ↓ ↖ ↗ ↘ ↙)
# 罫線:  U+2500-2503, U+250C, U+250F, U+2510, U+2513, U+2514, U+2517, U+2518, U+251B
#        (─ ━ │ ┃ ┌ ┏ ┐ ┓ └ ┗ ┘ ┛)
# 罫線(短冊マーク): U+2537 (┷、短冊上枠中央の紐穴マーク用)
# 漢字:  U+4EBA                   (人)
# 縦書き提示形: U+FE10-FE19, U+FE35-FE40, U+FE41-FE44, U+FE47-FE48
#   （， ： ！ ？ 〖 〗 … ︵ ︶ ｛ ｝ 〔 〕 【 】 《 》 〈 〉 「 」 『 』 ［ ］）
#   元サイト(echo-sd)との機能比較で見つかった縦書きカバー範囲の差分を埋めるために追加
#   （vertical.ts 側の対応記号を Unicode の Vertical Forms / CJK Compatibility Forms から
#   個別に検証した上で追加。echo-sd の記号選定自体は転記していない）。
#   CJK フォント未導入端末ではこのサブセットフォントが無いと tofu もしくは非CJKフォールバックに
#   落ちて枠のサイズが狂う（U+FE35/FE36 追加時に同種の追加漏れが判明した教訓を踏まえ、今回は
#   コード追加と同じコミットでフォント側も同時に更新する）。
# 全角記号: U+FF1C, U+FF1E, U+FF3F, U+FF5C, U+FFE3 (＜ ＞ ＿ ｜ ￣)
# 全角スペース: U+3000 (　、枠内パディング・列区切り・ストレスの字下げに使う、アプリが
#   本体テキストとは無関係に自分で出力する構造用の空白)。ASCII印字可能域と同じ理屈で、
#   このフォントに収録していないと Latin専用等幅フォントの次に来る和文フォント環境
#   （偶然1.0emで揃う）に暗黙で依存することになる。実機検証では現状の
#   フォールバック順（Latin専用等幅は U+3000 のグリフを持たないため和文フォントへ
#   スキップされる）で崩れは再現しないが、「アプリが出力する構造用グリフは全部
#   このフォントに含める」という既存方針（Y ^ 等）と矛盾するため、防御的に含める
#   （自己レビューで指摘）。
UNICODES="U+0020-007E,U+2190-2193,U+2196-2199,U+2500-2503,U+250C,U+250F,U+2510,U+2513,U+2514,U+2517,U+2518,U+251B,U+2537,U+3000,U+4EBA,U+FE10-FE19,U+FE35-FE40,U+FE41-FE44,U+FE47-FE48,U+FF1C,U+FF1E,U+FF3F,U+FF5C,U+FFE3"

pyftsubset "$SRC_FONT" \
  --output-file="$OUT_DIR/sd-symbols.woff2" \
  --flavor=woff2 \
  --unicodes="$UNICODES" \
  --no-layout-closure \
  --drop-tables+=DSIG

echo "生成完了: $OUT_DIR/sd-symbols.woff2"
