## 概要
#106 の審査で残った指摘（want・nit）の続き。AGENTS.md のクラウドの e2e の手順に、`--trace off` を付ける理由と、Chromium の版を書く。

## 変更内容
- `AGENTS.md` だけ
  - 設定は Playwright 1.65.0 の Chromium 1254 を前提にしているが、クラウドのイメージには Chromium 1243 しか無い事と、イメージが変わったらパスも直す事を書いた
  - `--trace off` は、全部のテストでトレースを残す CPU の重さをクラウドの作業場で避けるため。失敗を調べる時は、その1件だけ `--trace on` で回し直す、と書いた

## 確かめた事（head 955d6d2）
- AGENTS.md に書いたクラウドのコマンドをそのまま回して `13 passed`
- node_modules/playwright-core/browsers.json で、Playwright 1.65.0 の Chromium が 1254 である事を確かめた。作業場の /opt/pw-browsers は chromium-1243
- `npm run lint` が通る

## 関連Issue
Refs #106 #85

積み方: #107（chore/107-npm-ci）の上に積んだ PR。#105 → #106 → #107 → この PR の順にマージする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Cv4a6H52pPUGnJFMtyXmHj
