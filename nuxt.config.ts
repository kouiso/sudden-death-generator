import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass"],

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },

  compatibilityDate: "2024-08-19",
});
