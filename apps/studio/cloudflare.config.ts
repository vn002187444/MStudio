import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: process.env.CLOUDFLARE_WORKER_NAME || process.env.WORKER_NAME || "mstudio-cms",
    entrypoint: "vinext/server/fetch-handler",
    // Pinned below generator default (today): bundled workerd supports max 2026-10-07.
    compatibilityDate: "2026-10-07",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
