// A production build of the Kaksha Briefing dev page (tests/prod/r4-kaksha-briefing.mjs): the launch → first-frame bar is
// measured on bundled code, as a child would load it, not on the dev server's unbundled modules. Output: node_modules/.cache (gitignored).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], build: { outDir: "node_modules/.cache/r4-kaksha-briefing", emptyOutDir: true, rollupOptions: { input: { briefing: "src/ui-v3/kaksha/dev/briefing.html" } } } });
