// Whole-project audit 2026-11-09, platform (PLAT-01, PLAT-02).
// PLAT-01: one request whose path holds a malformed percent-escape ("/%") threw URIError inside server/serve.mjs's
// request listener, which is an uncaught exception: the web process exited, taking every lesson on it down.
// PLAT-02: parseCookies threw on any cookie value with a bare "%", so every signed-in route answered 500.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { parseCookies } from "../server/http.js";

const freePort = () => new Promise((ok) => { const s = createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });

test("serve.mjs answers a malformed percent-escape with 400 and keeps serving", { timeout: 60_000 }, async () => {
  const port = await freePort();
  const env = { ...process.env, PORT: String(port), DATABASE_URL: "", TAXILA_PREWARM_BR: "0", TAXILA_ROLE: "d5relay" };
  const ch = spawn(process.execPath, [new URL("../server/serve.mjs", import.meta.url).pathname], { env, stdio: ["ignore", "pipe", "pipe"] });
  let exited = null;
  ch.on("exit", (code, sig) => { exited = code ?? sig; });
  try {
    await new Promise((ok, no) => {
      ch.stdout.on("data", (d) => String(d).includes("taxila on") && ok());
      ch.on("exit", (c) => no(new Error(`serve.mjs exited before listening (${c})`)));
    });
    const base = `http://127.0.0.1:${port}`;
    for (const bad of ["/%", "/%E0%A4", "/api/%zz"]) {
      const r = await fetch(base + bad);
      assert.equal(r.status, 400, `${bad} → 400`);
      await r.arrayBuffer();
    }
    const h = await fetch(base + "/api/health");
    assert.equal(h.status, 200, "the process is still serving after the bad requests");
    assert.equal(exited, null, "the process did not exit");
  } finally { ch.kill("SIGKILL"); }
});

test("parseCookies keeps a cookie whose value is not valid percent-encoding instead of throwing", () => {
  const c = parseCookies({ headers: { cookie: "promo=100%; tx_session=abc%20d; bare" } });
  assert.equal(c.promo, "100%");
  assert.equal(c.tx_session, "abc d");
  assert.equal("bare" in c, false);
});

test("app audit (routed): no hero preload on /, static media is cached, .webm has its type", { timeout: 60_000 }, async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dist = mkdtempSync(join(tmpdir(), "serve-dist-"));
  mkdirSync(join(dist, "fonts")); mkdirSync(join(dist, "site")); mkdirSync(join(dist, "assets/gen"), { recursive: true });
  writeFileSync(join(dist, "index.html"), "<!doctype html><html><head><title>t</title></head><body></body></html>");
  writeFileSync(join(dist, "assets/gen/manifest.json"), JSON.stringify({ assets: [{ id: "bg/landing-hero", url: "/assets/gen/hero-abcdef12.webp" }] }));
  writeFileSync(join(dist, "fonts/body.woff2"), "x"); writeFileSync(join(dist, "site/loop.webm"), "x"); writeFileSync(join(dist, "site/still.webp"), "x");
  const port = await freePort();
  const ch = spawn(process.execPath, [new URL("../server/serve.mjs", import.meta.url).pathname],
    { env: { ...process.env, PORT: String(port), DATABASE_URL: "", TAXILA_DIST: dist, TAXILA_BOOT_WARM: "0", TAXILA_PREWARM_BR: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  try {
    await new Promise((ok, no) => { ch.stdout.on("data", (d) => String(d).includes("taxila on") && ok()); ch.on("exit", (c) => no(new Error(`exited ${c}`))); });
    const base = `http://127.0.0.1:${port}`;
    const home = await fetch(base + "/");
    assert.doesNotMatch(await home.text(), /rel="preload"|landing-hero/, "no preload of a painting the page does not draw");
    const font = await fetch(base + "/fonts/body.woff2"); await font.arrayBuffer();
    assert.equal(font.headers.get("content-type"), "font/woff2");
    assert.match(font.headers.get("cache-control"), /max-age=86400/);
    const vid = await fetch(base + "/site/loop.webm"); await vid.arrayBuffer();
    assert.equal(vid.headers.get("content-type"), "video/webm");
    assert.match(vid.headers.get("cache-control"), /max-age=3600/);
    const pic = await fetch(base + "/site/still.webp"); await pic.arrayBuffer();
    assert.match(pic.headers.get("cache-control"), /max-age=3600/);
    assert.equal((await fetch(base + "/index.html")).headers.get("cache-control"), "no-cache", "html still revalidates");
  } finally { ch.kill("SIGKILL"); rmSync(dist, { recursive: true, force: true }); }
});
