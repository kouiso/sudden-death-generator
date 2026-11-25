# Vercel prebuilt 配信（issue #31）

GHA で検証した成果物を、Vercel に再ビルドさせず `vercel deploy --prebuilt` で配信する
仕組みの記録。現状・設計・必要な資格情報・cutover/rollback をここに集約する。

## 現状（2026-11-24 読み取り）

- Vercel プロジェクト: `ito-games`（team `kouisos-projects`、framework preset は `nuxtjs` のまま。
  実際のビルドは `vercel.json` 側の `buildCommand`/`outputDirectory` が効いている）
- projectId: `prj_lONtvDn51I9PKglDDTai6MEjnB9J` / orgId(teamId): `team_rWBWGQA0e6oD9KzMOIrMogLw`
- GitHub 連携: `kouiso/sudden-death-generator`、production branch `main`
- 現行の配信: Git push のたびに Vercel 側が build→deploy（main=production、それ以外=preview）
- 既存の公開 URL: `ito-games.vercel.app`（production alias）
- 配信契約は `vercel.json` に集約: `dist` を配信、全パス `/index.html` fallback、
  `/assets/*` に immutable Cache-Control、全パスに nosniff/Referrer-Policy/XFO/CSP/Permissions-Policy

## 移行後の流れ

```
CI/build:  npm ci → lint → typecheck → vitest → vite build
           → script/build-vercel-output.mjs で dist から .vercel/output を生成
           → artifact vercel-output-<sha> として保存（1日）
CI/deploy: artifact を取得 → .vercel/project.json を生成
           → npx vercel@54.10.1 deploy --prebuilt（main は --prod）
           → script/smoke-vercel-deploy.sh で配信契約を検証
           → PR なら preview URL をコメント
```

- deploy は `vars.VERCEL_DEPLOY_ENABLED == 'true'` の時だけ起動する。資格情報が揃う前は常に skip。
- fork PR には credential を渡さない（job `if` で除外）。
- `vercel.json` の `git.deploymentEnabled: false` により、Vercel 側の Git 自動 deploy は全 branch で停止し、
  同一 SHA の二重配信を防ぐ。Git 連携自体は残るので PR の Vercel 関連情報は維持される。
- preview/production の分離: `pull_request` → preview、main への push → `--prod` で production。
- 同一 target の concurrency: job `concurrency` で `vercel-production` / `vercel-pr-<n>` に serialize。

## 配信契約（.vercel/output/config.json）

`script/build-vercel-output.mjs` が `vercel.json` から生成。`vercel build` の出力と同じ形:

1. `/assets/*` → immutable Cache-Control（continue）
2. `/*` → nosniff / Referrer-Policy / X-Frame-Options / CSP / Permissions-Policy（continue）
3. `handle: filesystem` — 実在ファイルを先に配信（JS/CSS/font が HTML fallback に化けない）
4. `/(.*)` → `/index.html`（check 付き。SPA の深いパス・permalink 復元）
5. `handle: error` → 404

翻訳できない routing キーが `vercel.json` に増えた場合はスクリプトが明示失敗する。
翻訳結果は `script/build-vercel-output.test.mjs`（vitest）で固定している。

## 必要な資格情報・設定（オーナー対応）

| 種別 | 名前 | 値・スコープ |
|---|---|---|
| Secret | `VERCEL_TOKEN` | Vercel account token。`kouisos-projects` への deploy 権を持つ最小限のもの |
| Secret | `VERCEL_ORG_ID` | `team_rWBWGQA0e6oD9KzMOIrMogLw` |
| Secret | `VERCEL_PROJECT_ID` | `prj_lONtvDn51I9PKglDDTai6MEjnB9J` |
| Variable | `VERCEL_DEPLOY_ENABLED` | `true` を設定すると deploy job が起動する |

- ID 類は秘匿情報ではないが secrets として置くことで差し替えを一元化する。
- `vercel` CLI の版は workflow 内で `vercel@54.10.1` に pin している（変更は明示的に行う）。
- GitHub Environment（`production` 保護・env スコープ secrets）への移行は今後の検討事項。

## cutover 手順

1. 上記 3 secrets を repo secrets に登録する（トークンはオーナーが発行。AI は発行しない）
2. repo variable `VERCEL_DEPLOY_ENABLED=true` を設定する
3. **この順で** PR をマージする。マージコミットの CI が成功すれば、そのまま
   `vercel deploy --prebuilt --prod` で production が切り替わる
   （secrets 未設定のままマージすると、Git 連携側も止まるため新規 deploy が一時的に無い状態になる。
   既存 production deployment は残るのでサイト自体は落ちないが、先に設定を済ませること）
4. `https://ito-games.vercel.app/` で表示・共有導線を目視確認する

## smoke / rollback

- 各 deploy の直後に `script/smoke-vercel-deploy.sh <url> .vercel/output/static` が
  SPA fallback・asset の Content-Type・header・index.html のバイト一致を検証する。
  失敗すると job が失敗する（その場合でも deployment 自体は残る。内容を確認して対処する）。
- rollback は Vercel dashboard の対象 deployment → **Promote**、または
  `vercel rollback <deployment-url>`。直前の artifact を再 deploy してもよい
  （`vercel-output-<sha>` artifact は1日で消えるため、古い SHA への rollback は
  その SHA で CI を再実行する）。
- Git 連携 deploy に戻す場合は `vercel.json` の `git.deploymentEnabled` を `true` に戻す。

## 未実行・残課題

- **実 deploy は未実行**（issue #31 の承認ゲート。資格情報の登録・変数設定はオーナー対応）
- CI がリポジトリ設定で停止中（issue #86）。workflow の実動作確認は CI 再開後になる
- 本番 domain（`ito-games.vercel.app`）での smoke・実ブラウザ確認は cutover 後に実施
