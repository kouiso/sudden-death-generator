// vercel.json → Build Output API の翻訳が SPA の配信契約を保つことを固定する。
// routes の形は `vercel build` が生成した config.json と一致させる
// （vercel.json を変えた場合はこのテストごと更新する）
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { toOutputConfig } from "./build-vercel-output.mjs";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const vercelJson = JSON.parse(readFileSync(resolve(repoRoot, "vercel.json"), "utf8"));

describe("toOutputConfig", () => {
  it("現行 vercel.json を vercel build と同じ routes に翻訳する", () => {
    const { routes } = toOutputConfig(vercelJson);

    expect(routes[0]).toEqual({
      src: "^/assets(?:/(.*))$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    });

    // 全パスへのセキュリティ header は rewrite 先の index.html にも効くよう
    // filesystem より前に continue:true で置く
    expect(routes[1].src).toBe("^(?:/(.*))$");
    expect(routes[1].continue).toBe(true);
    expect(routes[1].headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(routes[1].headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(routes[1].headers["X-Frame-Options"]).toBe("DENY");
    expect(routes[1].headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(routes[1].headers["Permissions-Policy"]).toContain("camera=()");

    // SPA fallback: 実ファイルが先、無ければ index.html へ
    expect(routes[2]).toEqual({ handle: "filesystem" });
    expect(routes[3]).toEqual({ src: "^(?:/(.*))$", dest: "/index.html", check: true });

    // 末尾は vercel build と同じ 404 系
    expect(routes[4]).toEqual({ handle: "error" });
    expect(routes[5]).toEqual({ status: 404, src: "^(?!/api).*$", dest: "/404.html" });
    expect(routes).toHaveLength(6);
  });

  it("version 3 の config を返す", () => {
    expect(toOutputConfig(vercelJson).version).toBe(3);
  });

  it("翻訳できない routing キーは黙って落とさず失敗する", () => {
    expect(() => toOutputConfig({ ...vercelJson, cleanUrls: true })).toThrow(/cleanUrls/);
    expect(() => toOutputConfig({ ...vercelJson, trailingSlash: true })).toThrow(/trailingSlash/);
    expect(() => toOutputConfig({ ...vercelJson, routes: [] })).toThrow(/routes/);
  });

  it("変換不能な source パターンは失敗する", () => {
    expect(() =>
      toOutputConfig({ rewrites: [{ source: "/users/:id", destination: "/index.html" }] }),
    ).toThrow(/未対応の source/);
  });

  it("redirect は filesystem より前で status 付きになる", () => {
    const { routes } = toOutputConfig({
      redirects: [{ source: "/old/(.*)", destination: "/", permanent: true }],
      rewrites: [{ source: "/(.*)", destination: "/index.html" }],
    });
    expect(routes[0]).toMatchObject({ src: "^/old(?:/(.*))$", dest: "/", status: 301 });
    expect(routes.findIndex((r) => r.handle === "filesystem")).toBeGreaterThan(0);
  });
});
