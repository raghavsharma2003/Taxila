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
