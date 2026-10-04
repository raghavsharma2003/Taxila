import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, readdirSync, rmSync } from "fs";
import { isAbsolute, join } from "path";

const page = (file: string) => fileURLToPath(new URL(file, import.meta.url));

/**
 * The module frame's Content-Security-Policy. Engines, Director params and (planned) model-written scene
 * DSL render in that frame, so nothing may leave it: no fetch, no remote script, style, image, font or
 * media, no forms, frames or workers. 'self' is the app origin (a sandboxed document still matches 'self'
 * against its URL), which is what lets the frame's own hashed bundles load. Measured in Chromium under the
 * old connect-src-only policy: a remote <script>, an Image beacon (?leak=childdata), a CSS url() and
 * self-navigation all reached a foreign origin; under this one the first three are refused.
 */
const FRAME_CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self'", "media-src 'self' blob:", "connect-src 'none'", "frame-src 'none'", "worker-src 'none'",
  "form-action 'none'", "base-uri 'none'", "object-src 'none'",
].join("; ");
/** Dev server only: Vite serves the React refresh preamble as an inline module script. HMR stays refused. */
const FRAME_CSP_DEV = FRAME_CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");

/** Injects the frame CSP as the first element of modules.html's <head>, so it governs everything after it. */
function moduleFrameCsp(): Plugin {
  return {
    name: "taxila:module-frame-csp",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        if (!ctx.filename.endsWith("/modules.html")) return;
        const content = ctx.server ? FRAME_CSP_DEV : FRAME_CSP;
        return [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content }, injectTo: "head-prepend" }];
      },
    },
  };
}

/**
 * Dev server only. The sandboxed frame's document has an opaque origin, so every module script it loads is
 * a CORS request with `Origin: null`. Answer exactly those — script or style destinations in the frame's
 * module graph. Allowing origin "null" on every response let any website read this dev server's source
 * through a sandboxed iframe of its own (the cross-site read Vite closed by default after CVE-2025-24010).
 */
const FRAME_GRAPH = /^\/(?:src\/modules\/|shared\/whiteboard\.js|@vite\/|@react-refresh|@id\/|node_modules\/\.vite\/|node_modules\/vite\/dist\/client\/)/;
function devFrameCors(): Plugin {
  return {
    name: "taxila:dev-frame-cors",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const dest = req.headers["sec-fetch-dest"];
        if (req.headers.origin === "null" && (dest === "script" || dest === "style") && FRAME_GRAPH.test(req.url ?? "")) {
          res.setHeader("Access-Control-Allow-Origin", "null");
        }
        next();
      });
    },
  };
}

/**
 * The image pack's masters never ship (PRODUCT-DESIGN-V2 §12). Codex writes full-size masters to public/assets/gen/**
 * (PNG / WebP, ~400 KB per scene); scripts/gen-assets.mjs converts them to the budgeted 1x/2x WebP under
 * public/assets/art/** and writes public/assets/gen/manifest.json. Vite copies all of public/ into the build, so after
 * the bundle is written this deletes dist/assets/gen/** except manifest.json. It also warns when a master has landed
 * that the manifest does not ship yet (run `node scripts/gen-assets.mjs`), so a stale manifest is visible in the log.
 */
function artMasters(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "taxila:art-masters",
    apply: "build",
    configResolved(c) {
      root = c.root;
      outDir = isAbsolute(c.build.outDir) ? c.build.outDir : join(c.root, c.build.outDir);
    },
    closeBundle() {
      const gen = join(outDir, "assets", "gen");
      if (!existsSync(gen)) return;
      let removed = 0;
      for (const e of readdirSync(gen, { withFileTypes: true })) {
        if (e.isFile() && e.name === "manifest.json") continue;
        rmSync(join(gen, e.name), { recursive: true, force: true });
        removed++;
      }
      try {
        const index = JSON.parse(readFileSync(join(root, "public/assets/gen/INDEX.json"), "utf8")) as { items?: Record<string, { status?: string }> };
        const man = JSON.parse(readFileSync(join(root, "public/assets/gen/manifest.json"), "utf8")) as { assets?: { id: string }[] };
        const shipped = new Set((man.assets ?? []).map((a) => a.id));
        const stale = Object.entries(index.items ?? {}).filter(([id, it]) => it.status === "done" && !shipped.has(id) && !id.startsWith("teacher-ref/"));
        if (stale.length) this.warn(`${stale.length} landed image(s) not in public/assets/gen/manifest.json (e.g. ${stale[0][0]}): run node scripts/gen-assets.mjs`);
      } catch {
        /* no INDEX or manifest yet: every screen renders its flat fallback */
      }
      if (removed) this.info?.(`dropped ${removed} master entr${removed === 1 ? "y" : "ies"} from ${gen}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), moduleFrameCsp(), devFrameCors(), artMasters()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8790" },
  },
  build: {
    target: "es2022",
    // No public source maps in the shipped image (serve.mjs serves all of dist/). TX_SOURCEMAP=1 for a local
    // debugging build: "hidden" writes the .map files without the sourceMappingURL comment.
    sourcemap: process.env.TX_SOURCEMAP ? "hidden" : false,
    // Two pages: the app, and the sandboxed module frame.
    rolldownOptions: { input: { main: page("./index.html"), modules: page("./modules.html") } },
  },
});
