// Builds ONLY the play dev harness (src/play/dev/index.html) for the stream's shot and frame-rate harness. Never part of
// the app build (the repo's vite.config.ts does not list this page). Output goes wherever --outDir points (scratch).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export default defineConfig({
  root,
  plugins: [react()],
  publicDir: process.env.PLAY_PUBLIC || false,
  build: {
    outDir: process.env.PLAY_OUT || "/tmp/play-devbuild",
    emptyOutDir: true,
    rollupOptions: { input: { play: fileURLToPath(new URL("./index.html", import.meta.url)) } },
    sourcemap: false,
  },
  logLevel: "warn",
});
