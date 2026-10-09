// Build of the forge3 visual-QA harness page (server/forge3/qa/harness). Its own config so the product build
// (vite.config.ts, a shared file) is untouched: `npx vite build --config server/forge3/qa/vite.config.mjs`.
// Output: FORGE3_QA_OUT (default <os tmp>/forge3-qa-harness). publicDir is off (the 100 MB of product art is not copied);
// the QA static server serves /fonts/* straight from the repo's public/ so the harness uses the product's fonts.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const here = fileURLToPath(new URL(".", import.meta.url));
export const HARNESS_OUT = process.env.FORGE3_QA_OUT || join(tmpdir(), "forge3-qa-harness");

export default defineConfig({
  root: join(here, "harness"),
  base: "./",
  publicDir: false,
  plugins: [react()],
  logLevel: "warn",
  build: { outDir: HARNESS_OUT, emptyOutDir: true, sourcemap: false, target: "es2022", chunkSizeWarningLimit: 4000 },
});
