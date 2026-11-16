// KILL SWITCH for the Taxila service worker (see PWA.md). Copied over public/sw.js, it is the next script every installed
// copy fetches (the browser checks sw.js against the network on each open, bypassing the worker; serve.mjs sends it no-cache).
// It installs at once, deletes every cache, unregisters itself and reloads each open window onto the plain network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
  })());
});
