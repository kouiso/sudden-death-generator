import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // src/core は DOM に触れない純粋関数のみなので、デフォルトの node 環境で足りる。
    globals: true,
  },
});
