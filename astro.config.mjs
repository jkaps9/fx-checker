// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://jkaps9.github.io",
  base: "/fx-checker",
  integrations: [icon()],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      weights: [400, 500, 700],
    },
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "/src/styles/_variables.scss" as *;
          @use "/src/styles/_mixins.scss" as *;
          @use "/src/styles/_functions.scss" as *;
          `,
        },
      },
    },
  },
});
