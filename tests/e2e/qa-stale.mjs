// QA repro: a tab left open across a deploy. The page loads build A; then build A's lazy chunks vanish from the server
// (as when a new container replaces the files); then the child/parent navigates in-app to a lazy route.
// QA_STALE_DIST = the directory the QA server on QA_BASE serves (its assets are deleted mid-test).
import fs from "fs";
import { launch, open, PHONE, shot, dump, BASE, sleep } from "./qa-lib.mjs";
const DIST = process.env.QA_STALE_DIST;
const browser = await launch();
const { page, log } = await open(browser, PHONE);
await page.goto(`${BASE}/help`); await sleep(2500);
// the deploy: every lazy chunk but the entry is gone
const entry = (fs.readFileSync(`${DIST}/index.html`, "utf8").match(/assets\/(index-[^"']+\.js)/) || [])[1];
let gone = 0;
for (const f of fs.readdirSync(`${DIST}/assets`)) if (f.endsWith(".js") && f !== entry && !/^(Public|Shell|routes)/.test(f)) { fs.renameSync(`${DIST}/assets/${f}`, `${DIST}/assets/${f}.old`); gone++; }
console.log("chunks removed:", gone, "entry kept:", entry);
// a reload must find a coherent build: the first 404 puts the files back (the "new build" is now what the server has)
const restore = () => { for (const f of fs.readdirSync(`${DIST}/assets`)) if (f.endsWith(".old")) fs.renameSync(`${DIST}/assets/${f}`, `${DIST}/assets/${f.slice(0, -4)}`); };
page.on("response", (r) => { if (r.status() === 404 && /\/assets\/.*\.js$/.test(r.url())) setTimeout(restore, 50); });
const navs = []; page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs.push(new URL(f.url()).pathname); });
// in-app navigation to the landing (lazy Landing chunk), like tapping the brand link
await page.evaluate(() => { history.pushState({}, "", "/"); dispatchEvent(new PopStateEvent("popstate")); });
await sleep(4000);
await shot(page, "stale-after-nav");
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
console.log("after nav:", new URL(page.url()).pathname, "::", body);
restore();
await sleep(4000);
console.log("document loads after the nav:", navs.length, navs.join(" "));
const dead = /Something went wrong/.test(body);
console.log(dead ? "FAIL: the stale tab shows the error page" : "PASS: the stale tab recovered by itself");
const body2 = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200);
console.log("4 s later:", new URL(page.url()).pathname, "::", body2);
console.log(JSON.stringify({ pageerror: log.pageerror, http: log.http.slice(0, 5), trace: log.trace.filter((e) => /^err\./.test(e.kind)).map((e) => `${e.kind} ${JSON.stringify(e.data).slice(0, 160)}`) }, null, 1));
await browser.close();
