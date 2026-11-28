import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // script/ の .mjs テストは Vercel prebuilt 出力の翻訳を固定するためのもの
    include: ["src/**/*.test.ts", "script/**/*.test.mjs"],
    // src/core は DOM に触れない純粋関数のみなので、デフォルトの node 環境で足りる。
    globals: true,
  },
});
