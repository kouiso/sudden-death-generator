import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .github は issue・PR 本文の検査の写し（#61）のテスト。CI では npm test でまとめて回る。
    include: ["src/**/*.test.ts", ".github/**/*.test.mjs"],
    // src/core は DOM に触れない純粋関数のみなので、デフォルトの node 環境で足りる。
    globals: true,
  },
});
