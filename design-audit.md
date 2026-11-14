# デザイン差分監査 (design-audit)

- 対象: 統合 worktree /tmp/integ (origin/main 04daef7 + 6 ブランチ。refactor/104-shape-table は src/app.tsx・src/component/shape-picker.tsx で衝突したため未取込。#102 を含む)
- 設計の正: アーティファクト AAu7a9ZhM9RPnGKAHuds4n は Artifact tool で `artifact not found`(404) となり読めず。repo 写し design/project (版9, 2026-11-11) を使用。
- 製品の測定: /tmp/integ の `vite preview --port 4950`、Chromium 1243、DPR1。値は getComputedStyle/getBoundingClientRect。
- 凡例 cat: COV=統合済みの open ブランチ/Issue が扱う(一致含む) / UND=README の未決定(#91, #103)・タップ領域など決定待ち / UNC=どの Issue にも無い差 / FONT=README が無視してよいとする書体 / OK=一致
- 証拠 PNG: /home/user/notes/evidence/design-audit/ (copydone/normal/hover/focus/pressed/disabled/error/linkdone/stress/arrange × light/dark)
- 注意: Chrome は 1.5px 枠を DPR1 で 1px に丸める(デザインも同じ)。差として数えない。

| # | state | element | property | design | product | issue | cat |
|---|---|---|---|---|---|---|---|
| 1 | copy-done 1440 | ページ下余白 | padding-bottom | 56px (.r padding 48 16 56) | 48px (#app clamp 16-48) | none | UNC |
| 2 | stress 390 | ページ余白 | padding-bottom | 32px (padding 16 16 32) | 16px | none | UNC |
| 3 | 全画面 | h1 タイトル | line-height | 1.3 (41.6px) | normal (46px 高) | none | UNC |
| 4 | 全画面 | サブタイトル | font-size / line-height / text-wrap | 14px / 1.6 / balance | 14.4px / normal / wrap (390 で「で/す。」と孤立折返し) | none | UNC |
| 5 | 全画面 | テーマ切替ボタン | size | 44x44px | 40x40px (タップ領域 #未決定の可能性) | none | UNC |
| 6 | 全画面 | テーマ切替ボタン | box-shadow | none | 0 1px 2px rgba(31,43,92,.08) | none | UNC |
| 7 | 全画面 | テーマ切替アイコン | 絵 | SVG 20px 月 stroke 2 | SVG 20px stroke 2 (一致) | #97 | COV |
| 8 | 全画面 | ラベル | font-size | 13.5px | 13.6px (0.85rem) | none | UNC |
| 9 | 全画面 | チェックボックス行 | min-height / font / gap | 44px / 14.5px / 4px 20px | 24px / 14.4px / 16px (+上 margin 12 vs 8) | none (タップ領域サイズは未決定扱い) | UND |
| 10 | stress 390 | 縦書きチェック(無効) | 色・cursor | muted #5b6478 / not-allowed | 本文色 #1c2333 / pointer (無効の見た目なし) | none | UNC |
| 11 | stress 390 | 縦書きチェック(無効) | 文言 | 縦書き表示（ストレスには効きません） | 縦書き表示（ストレスには影響しません） | none | UNC |
| 12 | 全画面 | textarea placeholder | color | var(--mu) #5b6478 / dark #9aa2b8 | UA 既定 #757575 (dark でも同じ。dark 面 #23283a に対し約 2.6:1) | none | UNC |
| 13 | 全画面 | スタイル選択ボタン | padding / gap / font-size | 12px 8px / 6px / 13.5px (高さ約73) | 10px 8px / 4px / 13.12px (高さ69) | none | UNC |
| 14 | 全画面 | スタイル選択(選択中) | background | --act #e9eefc / dark #232b47 | color-mix 12% → 約 #e6ecfb / dark 約 #242b44 | none | UNC |
| 15 | 全画面 | スタイル選択 | 列の切替 | コンテナ幅 480px 以下で2列 | viewport 480px 未満で2列 (container query でない) | #91 (判定をカードの中身の幅にする、は共有ボタンの話。ここは none) | UNC |
| 16 | 全画面 | スタイル選択アイコン | 絵 | SVG 24px stroke 2 | SVG 24px stroke 2 (一致) | #97 | COV |
| 17 | 全画面 | プレビュー pre | line-height | 16px/1.5 全形 | 通常・ストレス 1.5 / 四角形・短冊 1 (#98 で決める範囲) | #98 | COV |
| 18 | 全画面 | AA の書体 | font-family | BIZ UDGothic (代用) | SD Symbols Mono + Noto 等 | - | FONT |
| 19 | copy-done 1440 | 共有ボタン列 | 列数・並び順 | 2列×2段、順は コピー/リンク/X/LINE | 641px以上 4列、順は コピー/X/LINE/リンク (481-640 は 2列で順 コピー/X/LINE/リンク) | #91 | UND |
| 20 | copy-done 1440 | 共有ボタン | 高さ | 常に 48px (nowrap) | 4列時 68px: 「リンクをコピー」と「コピー済み」(721px以上でも) が2行に折返し | #91 | UND |
| 21 | Main 720 | 共有ボタン4列 | 折返し | 案A 4列は折返すと注記済み(採らない) | 720px で全ボタン 68px (折返し) | #91 | UND |
| 22 | Main 481-640 | 共有ボタン | 2列×2段 | 1つ 326px 級 | 2列 (241-279px) で折返しなし、高さ48 | #91 | UND |
| 23 | Main 320/375/428 | 共有ボタン | 1列 | 48px・折返しなし | 1列 48px・折返しなし (一致) | - | OK |
| 24 | 全画面 | 共有ボタン | font-size / padding | 15px / 0 12px | 14.72px (0.92rem) / 12px 16px (横 padding 差が折返しに効く) | #91 (折返し禁止) | UND |
| 25 | 全画面 | 共有ボタン | border / 高さ48 / 下線 | 1.5px transparent、48px、下線なし | 1.5px transparent、min-height 48、下線なし(一致) | #92 #95 | COV |
| 26 | 全画面 | 共有ボタン注記間隔 | margin | 8px (fld gap) | 8px (一致) | #93 | COV |
| 27 | 全画面 | コピー色 | bg/文字 | --ac #2f5fe0 / --onac (dark #6d8bff / #0b0e17) | 一致 | #94 | COV |
| 28 | 全画面 | X 暗表示の枠 | border | #565e7a | #565e7a (一致) | #96 | COV |
| 29 | 全画面 | LINE | bg | #037a33 | 一致 | - | OK |
| 30 | 全画面 | リンクをコピー | bg/border/文字 | --sfm / --bd / --tx | 一致 | - | OK |
| 31 | 全画面 | アイコン(コピー/リンク/✓) | 絵 | SVG 18px stroke 2 / 2.4 | SVG 18px stroke 2 (✓ の stroke は 2.4 か未確認) | #97 | COV |
| 32 | hover | コピー | bg | #1f47b8 / dark #8ca0ff | 一致 (+ filter:brightness(1.05) でわずかに明るい。デザインに無い) | none | UNC |
| 33 | hover | X | bg | #2a2f36 | 変化なし #14171a | none | UNC |
| 34 | hover | LINE | bg | #026a2c | 変化なし #037a33 | none | UNC |
| 35 | hover | リンクをコピー | 文字色 | var(--ac) (border も ac) | 文字は --tx のまま、border だけ --ac | none | UNC |
| 36 | focus | 全ボタン | outline | 2px solid --ac, offset 2px | 一致 (:focus-visible) | - | OK |
| 37 | pressed(押している間) | 全ボタン | transform | デザインに無い (「押した後」=コピー済み表示のこと) | translateY(1px) | none | UNC |
| 38 | 押した後 | コピー/リンク | ラベル | ✓ コピー済み (SVG ✓) | ✓ + コピー済み (一致) | #97 | COV |
| 39 | disabled | X/LINE/リンク | opacity | 0.5 | 0.5 (一致) | - | OK |
| 40 | disabled | X/LINE | cursor | not-allowed (マウス形も揃える) | CSS は not-allowed だが pointer-events:none のため実際は出ない (リンクは出る) | none | UNC |
| 41 | disabled | 押せない理由 | 置き場所と文言 | ボタン下の注記に1行(例: 入力が長すぎるため、リンクでの共有はできません) | X/LINE: 知らせ行(info, muted 色)に「入力が長すぎるため、X・LINEでの共有はできません」。リンク: 注記末尾に同文 | #90 | COV |
| 42 | notice 成功 | 知らせ行 | size/色 | 14px 700 --ok 高さ24 (画面全体 st は 13.5px) | 14px 700 --ok 24px 一致 (画面全体の 13.5px との差 0.5px) | #88 | COV |
| 43 | notice 成功 390 | 知らせ行 | 高さ | 24px (st min-height 24) | 40px (max-width:430px で意図的に2行分確保) | #88 (PR に要確認と記載済み) | UND |
| 44 | notice 失敗 | 知らせ行 | 色/文言 | --ng #b3243f / dark #ff7a90、コピーできませんでした。もう一度押してください | 一致 (390 では2行に折返す) | #89 | COV |
| 45 | notice リンク成功 | 知らせ | 文言 | デザインに描画なし | 「リンクをコピーしました」 | - | UND |
| 46 | 全画面 | 注記 .note | font-size / line-height | 12.5px / 1.7 (states の注記は 12px/1.6) | 12.48px / normal | none | UNC |
| 47 | dark | カード影 | box-shadow | none (--sh:none) | light と同じ影 rgba(31,43,92,.35) が残る | none | UNC |
| 48 | dark | 背景グラデ開始色 | color | #141824 | #14182430 (アルファ 0.19 のため暗くなる) | none | UNC |
| 49 | dark | テーマ切替の影 | box-shadow | none | 0 1px 2px | none | UNC |
| 50 | stress 390 | ストレス行の割当 | preview | 残業/終電/仕事のストレス/仕事のストレス を矢印でつなぎ、枠は「突然の死」 | 残業/終電/突然の死/仕事のストレス、枠は「仕事のストレス」 | #103 #84 | UND |
| 51 | stress 390 | 入力欄下の説明行 | hint p | 「最後の行が枠に入ります。…」(13px muted) あり | 無し | #103 #84 | UND |
| 52 | stress 390 | タイトル/カード/形選択/共有 | 24px/16px/2列/1列 | 一致 | 一致 | - | OK |
| 53 | missing | Main: 案A/案B/おすすめ(2×2)の並び | 画面 | 3案を幅別に描く | 案A相当(4列)+中間2列+1列。案B(小見出し「コピーする/送る」)は未実装 | #91 | UND |
| 54 | missing | states: 「押せない」コピー | 状態 | 無し(なし) | なし (一致) | - | OK |
| 55 | missing | states: X/LINE の押した後 | 状態 | 別タブで開く | target=_blank (一致) | - | OK |

## 件数
- 合計 55 行: COV=12, FONT=1, OK=8, UNC=23, UND=11
- 差(OK除く)のうち: 統合ブランチで覆われる(COV)=12 / 未決定(UND)=11 / 未カバー(UNC)=23 / 書体無視(FONT)=1
