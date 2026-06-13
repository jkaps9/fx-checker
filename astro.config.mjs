// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com", //TODO: update me
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
          `,
        },
      },
    },
  },
});
