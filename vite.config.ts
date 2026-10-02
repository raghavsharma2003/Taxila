import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const page = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8790" },
    // modules.html runs in <iframe sandbox="allow-scripts"> (no allow-same-origin), so its document has an
    // opaque origin and every module script it loads is a CORS request with `Origin: null`. Allow that
    // origin next to Vite's default localhost set.
    cors: { origin: [/^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/, "null"] },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // Two pages: the app, and the sandboxed module frame.
    rolldownOptions: { input: { main: page("./index.html"), modules: page("./modules.html") } },
  },
});
