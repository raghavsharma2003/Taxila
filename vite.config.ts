import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

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
const FRAME_GRAPH = /^\/(?:src\/modules\/|@vite\/|@react-refresh|@id\/|node_modules\/\.vite\/)/;
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

export default defineConfig({
  plugins: [react(), moduleFrameCsp(), devFrameCors()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8790" },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // Two pages: the app, and the sandboxed module frame.
    rolldownOptions: { input: { main: page("./index.html"), modules: page("./modules.html") } },
  },
});
