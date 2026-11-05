// Taxila service worker (r7 app-pwa-install). It makes the installed app open like an app: an offline-safe SHELL, never
// data. What it caches:
//   - Vite's content-hashed build bundles (/assets/<name>-<hash>.<ext>): immutable, so cache-first is exact;
//   - the app's fonts (/fonts/*) and the install icons (/site/app/*);
//   - the last good index.html, used ONLY as the offline fallback for a page navigation.
// What it never touches (no respondWith, the network as if there were no worker): every /api/* request (lessons, plans,
// children's data, speech), generated content (/assets/gen/*), audio, the parent corner's reads, anything cross-origin,
// and anything that is not a GET. Nothing a child says, sees or makes is stored here.
const VERSION = "taxila-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/site/app/icon-192.png", "/site/app/icon-512.png"];
const HASHED = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (p.startsWith("/api/") || p.startsWith("/assets/gen/") || p.startsWith("/audio/")) return;
  // a page navigation: the network first (always the fresh app); offline, the last good shell
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put("/", copy));
      }
      return res;
    }).catch(() => caches.match("/").then((hit) => hit || Response.error())));
    return;
  }
  // immutable bundles, fonts and the icons: the cache first, then the network (and keep it)
  if (HASHED.test(p) || p.startsWith("/fonts/") || p.startsWith("/site/app/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
