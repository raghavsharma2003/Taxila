// Builds the SHIPPED studio-v2 engine gallery (src/studio-v2/gallery, not play code) for the play stream's before/after
// harness (docs/design/round3/play/harness/shots.mjs): the "before" is a studio-v2 engine at the tray box it got in
// production (181 × 113 CSS px on a 360 × 800 phone, live-tech §1.1). Never part of the app build.
import { defineConfig } from "vite";
export default defineConfig({
  root: new URL("../../..", import.meta.url).pathname, publicDir: false, logLevel: "error",
  build: { outDir: process.env.PLAY_OUT, emptyOutDir: true, rollupOptions: { input: { gallery: new URL("../../studio-v2/gallery/index.html", import.meta.url).pathname } } },
});
