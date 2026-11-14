STATE RUNNING 2026-11-14T12:55Z | counts pending
mission: それぞれのプロジェクトに書いてあるプランに書いてある作業をやること／どのプロジェクトもまず既存のPRを本質的に対処することを作業を優先してください。そうしないと溜まってばっかりなので | handoff: none for this repo (packet small-lot part 1/1)
model claude-opus-5-5 (lead) | advisor unknown (no advisor tool visible) | github via connector (gh token invalid) | push via git | png ok
goal: cycle DONE or DONE-WAITING (owner/device-only items listed) | DONE-WAITING satisfies it: yes
repo rules: AGENTS.md (日本語コメント、src/core は純粋関数、npm run lint/typecheck/test/build), .github/scrum-board.yml (project 49, read only); stricter: none beyond exec-prompt-v2
DEPLOY | merge to main -> production | evidence Vercel project ito-games (prj_lONtvDn51I9PKglDDTai6MEjnB9J) git integration: domain ito-games-git-main-kouisos-projects.vercel.app + latestDeployment target=production; vercel.json:2 buildCommand. PR branches -> Vercel preview (staging, SSO-protected). .github/workflows/ci.yml:3-5 and codeql.yml:3-5 deploy nothing.
---
START 2026-11-14T12:51Z lane sudden-death-generator (plan small-lot)
worktree /home/user/sudden-death-generator main clean | nothing unpushed (04daef7 = origin/main)
DECIDED | merges to main are production -> no lane merges; every PR ends at GATE and waits OWNER for merge (G5) | reason Vercel git integration deploys main to production | revert owner says main may merge
DECIDED | iteration board (project 49) unreadable: gh token invalid, connector has no Projects tool | reason tooling | revert read board when a route appears; meanwhile non-claude-cloud first
LEDGER (repo rows from packet)
id	state	who	depends_on	text
SD-4	todo	wait	Q-SL4	sudden-death-generator do 24 件を 1件1PR・審査つき（マージは本番なので本人）
V-5	blocked	wait	SD-4,...	答えの後に変わった所だけ回し直す
F-02	blocked	wait	V-5,...	仕上げ
needs owner:
- main へのマージ＝本番(ito-games.vercel.app)。審査・GATE 済み PR をマージしてよいか（はい／1本ずつ見る／いいえ）。推奨: はい（GATE 済みのみ）
for main session:
- gh CLI の GH_TOKEN が無効。Projects(iteration) を読む道が無い
- 課題 review band: not yet
NOTES PR #111 (draft). baseline main 04daef7: lint/typecheck/test/build pass 2026-11-14T12:54:48Z
#105 | FINISH | branch fix/105-e2e-browser-path pushed | head 65bdf04 | local: e2e 13 pass w/ PW_CHROMIUM_PATH, 13 fail without; unit 152 pass; lint/type/build pass | PR not yet: GitHub secondary rate limit on writes until ~13:57Z | 2026-11-14T12:56:40Z
DECIDED | GitHub write rate-limited (secondary limit, retry ~59m); 2nd connector 403 | reason tooling | work continues on branches, PRs opened after limit clears
