# The installed app: service worker safety and rollback (r7 app-pwa-install, stream E)

`public/sw.js` keeps the app's SHELL so the installed app opens fast and survives a dead signal. It never stores API
responses, generated content, audio or anything a child says, sees or makes (`tests/r7-app-pwa.test.mjs`).

## Why a deploy can never strand a phone on an old build
1. **Navigations are network-first.** A page load always asks the network; `index.html` comes from the cache only when
   the network fails. The next open after a deploy runs the new build, even before the new worker takes over.
2. **One cache per build.** The page registers `/sw.js?v=<build id>` (`src/app/install.ts buildId()`: the deploy's commit,
   else the entry bundle's content hash). A new build is a new script URL, so the browser installs the new worker; it
   `skipWaiting()`s, `clients.claim()`s, and `activate` deletes every cache that is not its own.
3. **The browser re-checks `sw.js` itself on every open**, bypassing the worker (and `server/serve.mjs` sends it with
   `cache-control: no-cache`), so whatever is at `/sw.js` reaches every installed copy on its next open.

## Kill switch (one command)
If the worker ever misbehaves, replace it with the self-unregistering stub and deploy:

```sh
cp docs/design/round7/app/sw-kill.js public/sw.js && git commit -am "sw: kill switch" && git push && node scripts/deploy-azure.mjs
```

On its next open each installed copy fetches the stub, which installs at once, deletes every cache, unregisters itself
and reloads the open windows onto the plain network. The app then runs with no worker (the install icon still works).
To bring the worker back, restore `public/sw.js` from git and deploy again.

## What to check on a phone (live)
Install from Chrome's menu (or Me → "Put Taxila on this phone"), open from the icon (splash on the night void, then the
app with no flash), open once more online, then turn on airplane mode and open again: the shell loads and the app shows
its own offline screen. After a deploy, the next open shows the new build.
