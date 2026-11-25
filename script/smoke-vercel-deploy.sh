#!/usr/bin/env bash
set -euo pipefail

# Vercel へ prebuilt deploy した成果物が、SPA の配信契約を守って応答するかを
# 配信先 URL に対して実際に叩いて確認する。GHA の deploy ジョブで
# preview/production 両方の smoke として使う。
#
# 使い方:
#   bash script/smoke-vercel-deploy.sh <base-url> [static-dir]
#     static-dir: 省略時 .vercel/output/static
#
# ローカルの `npm run preview` では Vercel 側の header が付かないので、
# 手元確認用に限り SDG_SMOKE_SKIP_HEADERS=1 で header 系だけスキップできる。
# CI では付けないこと。

BASE=${1:?usage: smoke-vercel-deploy.sh <base-url> [static-dir]}
BASE=${BASE%/}
STATIC=${2:-.vercel/output/static}
SKIP_HEADERS=${SDG_SMOKE_SKIP_HEADERS:-0}

failures=0
pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*"; failures=$((failures + 1)); }

sha() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fetch() { # fetch <path> -> $work/body, $work/headers
  curl -fsS --max-time 20 -D "$work/headers" -o "$work/body" "$BASE$1" \
    || { echo "curl failed: $1"; return 1; }
}

header_value() { # 大文字小文字を吸収して値を取り出す
  grep -i "^$1:" "$work/headers" | head -n1 | tr -d '\r' | cut -d: -f2- | sed 's/^ *//'
}

expect_header() { # expect_header <name> <needle> <label>
  local got
  got=$(header_value "$1")
  if printf '%s' "$got" | grep -qi -- "$2"; then
    pass "$3 ($1: $got)"
  else
    fail "$3 — $1 に '$2' が無い (got: ${got:-<none>})"
  fi
}

# --- 1. ルートが index.html をそのまま返す（同一成果物の証明） ---
index_hash=$(sha "$STATIC/index.html")
if fetch "/"; then
  if [ "$(sha "$work/body")" = "$index_hash" ]; then
    pass "/ は deploy した index.html とバイト一致"
  else
    fail "/ の内容が deploy した index.html と一致しない"
  fi
  expect_header "Content-Type" "text/html" "/ が HTML として返る"
  if [ "$SKIP_HEADERS" != "1" ]; then
    # HTML が immutable キャッシュ化すると配信切替が利用者へ届かない
    got=$(header_value "Cache-Control")
    if printf '%s' "$got" | grep -q "immutable"; then
      fail "/ に immutable Cache-Control が付いている (got: $got)"
    else
      pass "/ に immutable Cache-Control は付かない"
    fi
    expect_header "X-Content-Type-Options" "nosniff" "セキュリティ header (/)"
    expect_header "Referrer-Policy" "strict-origin-when-cross-origin" "セキュリティ header (/)"
    expect_header "X-Frame-Options" "DENY" "セキュリティ header (/)"
    expect_header "Content-Security-Policy" "default-src 'self'" "CSP header (/)"
    expect_header "Permissions-Policy" "camera=()" "Permissions-Policy (/)"
  fi
fi

# --- 2. SPA fallback: 深いパス・クエリ付きでも index.html が返る ---
for path in "/deep/path/for/spa" "/deep/path/for/spa?text=probe"; do
  if fetch "$path"; then
    if [ "$(sha "$work/body")" = "$index_hash" ]; then
      pass "$path → index.html に fallback"
    else
      fail "$path が index.html に fallback しない"
    fi
  fi
done

# --- 3. 実アセットが HTML fallback に化けず、immutable cache 付きで返る ---
check_asset() { # check_asset <glob> <content-type needle>
  local file ctype_needle=$2
  file=$(find "$STATIC/assets" -name "$1" 2>/dev/null | head -n1 || true)
  [ -n "$file" ] || { fail "static 内に $1 が無い"; return; }
  local rel=${file#"$STATIC"}
  if fetch "$rel"; then
    expect_header "Content-Type" "$ctype_needle" "$rel の Content-Type"
    if [ "$SKIP_HEADERS" != "1" ]; then
      expect_header "Cache-Control" "immutable" "$rel の Cache-Control"
      expect_header "Cache-Control" "max-age=31536000" "$rel の Cache-Control"
    fi
  fi
}
check_asset "*.js" "javascript"
check_asset "*.css" "text/css"

# --- 4. フォントが正しい Content-Type で返る ---
font=$(find "$STATIC/font" -name "*.woff2" 2>/dev/null | head -n1 || true)
if [ -n "$font" ]; then
  rel=${font#"$STATIC"}
  if fetch "$rel"; then
    expect_header "Content-Type" "font" "$rel の Content-Type"
  fi
fi

echo "---"
if [ "$failures" -gt 0 ]; then
  echo "smoke FAILED: $failures 件"
  exit 1
fi
echo "smoke OK: $BASE"
