import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// 純粋なクライアント完結の静的サイトとしてビルドする。SSR/サーバーは持たない。
export default defineConfig({
  plugins: [preact()],
  build: {
    // CSS 側で color-mix() / light-dark() を既に使っており legacy ブラウザは対象外。
    // トランスパイル段を下げるとバンドルが太るだけなので esnext のまま出す。
    target: "esnext",
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
});
