import { defineConfig } from "@farmfe/core";

// Farm は素の静的サイト向けにビルドする。SSR/サーバーは不要（旧実装からの反省）。
export default defineConfig({
  compilation: {
    input: {
      index: "./index.html",
    },
    output: {
      path: "dist",
      publicPath: "/",
      // モダンブラウザのみを対象にする（CSS 側で color-mix() 等を既に使っており legacy 対応は不要）。
      // 既定の "browser" は legacy polyfill を注入し index.html が肥大化するため esnext に絞る。
      targetEnv: "browser-esnext",
    },
    persistentCache: false,
  },
  server: {
    port: 5173,
  },
  plugins: [
    ["@farmfe/plugin-react", { runtime: "automatic", importSource: "preact" }],
  ],
});
