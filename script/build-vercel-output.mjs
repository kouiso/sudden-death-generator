#!/usr/bin/env node
// vercel.json の配信契約（rewrites / redirects / headers）を
// Build Output API v3 の .vercel/output/ に変換するスクリプト。
//
// 背景: このアプリは GHA で `npm run build` した dist を、Vercel に再ビルドさせず
// `vercel deploy --prebuilt` で配信する。prebuilt は .vercel/output/ をそのまま
// アップロードするため、vercel.json の SPA fallback や header を失わないよう
// このスクリプトが routes へ翻訳する。
// 翻訳結果は `vercel build` の出力と同じ形に揃えてある
// （headers → continue:true、filesystem の後に rewrite → /index.html、末尾に 404 系）。
//
// 使い方:
//   node script/build-vercel-output.mjs [distDir] [outDir]
//     distDir: 省略時 dist
//     outDir:  省略時 .vercel/output

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = resolve(repoRoot, process.argv[2] ?? "dist");
const outDir = resolve(repoRoot, process.argv[3] ?? ".vercel/output");
const vercelJsonPath = join(repoRoot, "vercel.json");

// routes 以外のルーティング系キーは翻訳できないため、黙って落とすと
// 配信契約が壊れる。検出した時点で失敗させてスクリプト側の対応を迫る。
const UNSUPPORTED_KEYS = [
  "routes",
  "cleanUrls",
  "trailingSlash",
  "images",
  "functions",
  "crons",
  "services",
];

// vercel.json の source は path-to-regexp 記法。Build Output API の src は
// PCRE 正規表現で、両者が一致する書き方だけをここで変換する。
// 変換不能なパターン（:param 等）が来たら例外で止める。
function sourceToSrc(source) {
  // "/(.*)" は vercel.json では「全パス」の wildcard 表現
  if (source === "/(.*)") return "^(?:/(.*))$";
  const suffix = "/(.*)";
  if (source.endsWith(suffix)) {
    const literal = source.slice(0, -suffix.length);
    // プレフィックスは静的パスのみ許容。regex メタはエスケープして一致を保つ
    if (!/^\/[\w\-./]+$/.test(literal)) {
      throw new Error(`未対応の source パターン: ${source}（プレフィックスは静的パスのみ対応）`);
    }
    const escaped = literal.replace(/[-[\]{}()*+?.^$|]/g, "\\$&");
    return `^${escaped}(?:/(.*))$`;
  }
  // 静的パス単体は完全一致に翻訳する
  if (/^\/[\w\-./]+$/.test(source)) {
    const escaped = source.replace(/[-[\]{}()*+?.^$|]/g, "\\$&");
    return `^${escaped}$`;
  }
  throw new Error(`未対応の source パターン: ${source}（必要なら sourceToSrc を拡張すること）`);
}

function passThroughConditions(entry) {
  const extra = {};
  for (const key of ["has", "missing", "locale"]) {
    if (entry[key] !== undefined) extra[key] = entry[key];
  }
  return extra;
}

// vercel.json → Build Output API v3 の config 相当オブジェクトを返す。
// テストからも使えるよう fs に触れない純粋関数にしてある。
export function toOutputConfig(vercelJson) {
  for (const key of UNSUPPORTED_KEYS) {
    if (vercelJson[key] !== undefined) {
      throw new Error(
        `vercel.json の "${key}" は prebuilt 出力へ自動翻訳できない。script/build-vercel-output.mjs を更新すること`,
      );
    }
  }

  const routes = [];

  // header は rewrite 後の応答にも効く必要があるため、filesystem より前に
  // continue:true で敷く（vercel build が出す順序と同じ）
  for (const entry of vercelJson.headers ?? []) {
    const headers = {};
    for (const h of entry.headers) headers[h.key] = h.value;
    routes.push({ src: sourceToSrc(entry.source), headers, continue: true, ...passThroughConditions(entry) });
  }

  // redirect は filesystem より前に評価される（vercel.json 側の仕様）
  for (const entry of vercelJson.redirects ?? []) {
    const status = entry.statusCode ?? (entry.permanent === false ? 307 : 301);
    routes.push({ src: sourceToSrc(entry.source), dest: entry.destination, status, ...passThroughConditions(entry) });
  }

  // vercel.json の rewrite は「filesystem に無いパス」へだけ効く SPA fallback。
  // routes 表現では handle:filesystem の後ろに置くことで同じ意味になる。
  const rewrites = vercelJson.rewrites ?? [];
  if (rewrites.length > 0) {
    routes.push({ handle: "filesystem" });
    for (const entry of rewrites) {
      // check:true で dest の実ファイルを再確認する（無ければ 404 系へ流す）。
      // vercel build の出力と同じ形
      routes.push({ src: sourceToSrc(entry.source), dest: entry.destination, check: true, ...passThroughConditions(entry) });
    }
  }

  // vercel build が常に末尾に置く 404 系。SPA の fallback より後で
  // 実在しないパスは index.html ではなく 404 応答になるよう残す
  routes.push({ handle: "error" }, { status: 404, src: "^(?!/api).*$", dest: "/404.html" });

  return { version: 3, routes };
}

function countFiles(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

export function buildOutput({ distDirPath = distDir, outDirPath = outDir } = {}) {
  if (!existsSync(vercelJsonPath)) {
    throw new Error(`vercel.json が見つからない: ${vercelJsonPath}`);
  }
  const vercelJson = JSON.parse(readFileSync(vercelJsonPath, "utf8"));

  if (!existsSync(distDirPath)) {
    throw new Error(`ビルド成果物が見つからない: ${distDirPath}（先に npm run build）`);
  }
  // rewrite 先が実在しないと Vercel 側で全パスが 404 になるため、
  // SPA 用の index.html の存在だけはここで保証する
  if (!existsSync(join(distDirPath, "index.html"))) {
    throw new Error(`${distDirPath}/index.html が無い。SPA fallback 先が欠けている`);
  }

  const config = toOutputConfig(vercelJson);

  rmSync(outDirPath, { recursive: true, force: true });
  mkdirSync(outDirPath, { recursive: true });
  cpSync(distDirPath, join(outDirPath, "static"), { recursive: true });
  writeFileSync(join(outDirPath, "config.json"), `${JSON.stringify(config, null, 2)}\n`);

  return { config, fileCount: countFiles(join(outDirPath, "static")) };
}

// import された時は実行しない（テスト用）
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { config, fileCount } = buildOutput();
    console.log(
      `.vercel/output を生成した: routes=${config.routes.length} static=${fileCount} files (dist: ${distDir})`,
    );
  } catch (err) {
    console.error(`build-vercel-output: ${err.message}`);
    process.exit(1);
  }
}
