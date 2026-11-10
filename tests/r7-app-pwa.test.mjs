// r7 stream E app-pwa-install: the installable app (Volt icons, the night-void splash, an offline-safe SHELL worker that
// never stores API responses or children's data).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the manifest's icons exist at their declared sizes and are the Volt set", () => {
  const mf = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(mf.display, "standalone");
  assert.ok(mf.icons.some((i) => i.purpose === "maskable"));
  for (const ic of mf.icons) {
    assert.match(ic.src, /^\/site\/app\//, ic.src);
    const buf = fs.readFileSync(new URL(`../public${ic.src}`, import.meta.url));
    if (ic.type === "image/png") assert.equal(`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`, ic.sizes, ic.src);
    else assert.match(buf.toString(), /<svg/);
  }
  assert.match(read("index.html"), /<link rel="apple-touch-icon" href="\/site\/app\/apple-touch-180\.png" \/>/);
});

test("the worker caches the shell only: never /api, generated content, audio, non-GET or cross-origin", () => {
  const sw = read("public/sw.js");
  assert.match(sw, /if \(req\.method !== "GET"\) return;/);
  assert.match(sw, /if \(url\.origin !== self\.location\.origin\) return;/);
  assert.match(sw, /if \(p\.startsWith\("\/api\/"\) \|\| p\.startsWith\("\/assets\/gen\/"\) \|\| p\.startsWith\("\/audio\/"\)\) return;/);
  // the only cached things: the shell list, hashed bundles, fonts, the icons, and index.html as the offline navigation
  assert.match(sw, /const HASHED = \/\^\\\/assets\\\/\[\^\/\]\+-\[A-Za-z0-9_-\]\{8,\}\\\.\(js\|css\|woff2\?\)\$\/;/);
  assert.doesNotMatch(sw, /indexedDB|localStorage/);
});

test("the worker registers in production only; the install offer is held for a tap, never a pop-up", () => {
  const i = read("src/app/install.ts");
  assert.match(i, /if \(!prod \|\| !\("serviceWorker" in navigator\)\) return;/);
  assert.match(i, /e\.preventDefault\(\); held = e as InstallPrompt;/);
  assert.match(read("src/main.tsx"), /installApp\(import\.meta\.env\.PROD\);/);
  assert.match(read("src/child/screens/Me.tsx"), /installOffer && <LinkRow/);
});

// A worker run in a sandbox: fake self, caches and clients; returns what it did on install and activate.
import vm from "node:vm";
async function runWorker(file, href, existing) {
  const store = new Map(existing.map((k) => [k, new Map()]));
  const log = { opened: [], deleted: [], unregistered: false, navigated: 0, skipWaiting: false, claimed: false };
  const handlers = {};
  const caches = {
    open: async (k) => { log.opened.push(k); if (!store.has(k)) store.set(k, new Map()); return { addAll: async () => {}, put: async () => {} }; },
    keys: async () => [...store.keys()],
    delete: async (k) => { log.deleted.push(k); return store.delete(k); },
    match: async () => undefined,
  };
  const self = {
    location: new URL(href), addEventListener: (t, f) => { handlers[t] = f; },
    skipWaiting: async () => { log.skipWaiting = true; },
    clients: { claim: async () => { log.claimed = true; }, matchAll: async () => [{ url: "/", navigate: () => { log.navigated++; } }] },
    registration: { unregister: async () => { log.unregistered = true; return true; } },
  };
  vm.runInNewContext(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { self, caches, URL, fetch: async () => { throw new Error("no network in test"); }, Response, Promise });
  const wait = async (t) => { let p = Promise.resolve(); handlers[t]?.({ waitUntil: (x) => { p = x; } }); await p; };
  await wait("install");
  await wait("activate");
  return { log, left: [...store.keys()] };
}

test("one cache per build: the worker's cache is named by ?v=, and activate deletes every other cache", async () => {
  const { log, left } = await runWorker("public/sw.js", "https://taxila.test/sw.js?v=abc123def", ["taxila-shell-old1", "taxila-shell-old2"]);
  assert.deepEqual(log.opened.slice(0, 1), ["taxila-shell-abc123def"]);
  assert.deepEqual(left, ["taxila-shell-abc123def"]);
  assert.ok(log.skipWaiting && log.claimed, "the new worker takes over at once");
  assert.match(fs.readFileSync(new URL("../src/app/install.ts", import.meta.url), "utf8"), /register\(`\/sw\.js\?v=\$\{encodeURIComponent\(buildId\(\)\)\}`/);
});

test("buildId: the deploy's commit, else the entry bundle's content hash", async () => {
  const { buildId } = await import("../src/app/install.ts");
  assert.equal(buildId("0123456789abcdef", "https://x/assets/index-Zz9.js"), "0123456789ab");
  assert.equal(buildId(undefined, "https://taxila.test/assets/index-BqX3k9aL.js"), "BqX3k9aL");
  assert.equal(buildId(undefined, "http://localhost:5173/src/main.tsx"), "dev");
});

test("the kill switch: deletes every cache, unregisters, reloads open windows (a copy of docs/design/round7/app/sw-kill.js, the file PWA.md tells an operator to copy to public/sw.js)", async () => {
  const { log, left } = await runWorker("tests/fixtures/sw-kill.js", "https://taxila.test/sw.js", ["taxila-shell-a", "taxila-shell-b"]);
  assert.deepEqual(left, []);
  assert.ok(log.unregistered);
  assert.equal(log.navigated, 1);
});

test("navigations are network-first: the cached shell is only the offline fallback", () => {
  const sw = read("public/sw.js");
  assert.match(sw, /if \(req\.mode === "navigate"\) \{\s*e\.respondWith\(fetch\(req\)\.then\(/);
  assert.match(sw, /\.catch\(\(\) => caches\.match\("\/"\)/);
});
