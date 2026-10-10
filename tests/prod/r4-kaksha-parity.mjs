// Kaksha integration parity (merge order 2026-10-10, step 3: "ui.kaksha ON for the owner's account only"). Two LOCAL
// production builds on this stream's Neon TEST branch, side by side:
//   BASE  = base 0c90ebb (today's app, no Kaksha)            TAXILA_BASE_A, default http://127.0.0.1:5192
//   BRANCH= claude/r4-app-design (K0-K3 + K-P2/K-P8/K-P10/K-P12 applied), started with TAXILA_UI_KAKSHA=<the cohort email>
//                                                             TAXILA_BASE, default http://127.0.0.1:5190
// N  a NON-cohort account (with and without ?ui=kaksha typed) sees the same page on both builds: the body DOM equal after
//    normalising asset hashes (and the Desk's inert data-zone attributes, K-P2), the picture one the base itself draws, no Kaksha
//    chunk requested by the branch. Home (first visit → /hello, and after one lesson), map, ask, notebook, me, teacher, the
//    lesson's first screen (its /api/lesson/start answer recorded once and replayed to both builds).
// C  the COHORT account gets Kaksha on the branch with no URL step; ?ui=classic turns it off on that device.
// Run (servers as tests/prod/r4-timeline/README.md; the BRANCH server with TAXILA_UI_KAKSHA=r4k-parity-owner@taxila.test):
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r4-kaksha-parity.mjs
// Writes docs/design/round4/build/kaksha/parity-k.json (+ shots-parity/ on any difference).
import fs from "node:fs";
import path from "node:path";
import { apiClient, ok, done, warn } from "./lib.mjs";
import { driveLesson } from "./_w1c.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const A = (process.env.TAXILA_BASE_A || "http://127.0.0.1:5192").replace(/\/+$/, "");
const B = (process.env.TAXILA_BASE || "http://127.0.0.1:5190").replace(/\/+$/, "");
const COHORT = "r4k-parity-owner@taxila.test";
for (const u of [A, B]) if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u)) { console.log(`refusing: ${u} is not local`); process.exit(1); }
const OUT = path.join(ROOT, "docs/design/round4/build/kaksha");
const SHOTS = path.join(OUT, "shots-parity");

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("playwright");
const browser = await chromium.launch();

/** An account on the shared test DB (the session cookie is valid on both servers: same DB, same secret). */
async function account(email) {
  const api = apiClient(B);
  const password = `r4k-parity-${Date.now()}`;
  await api("POST", "/api/auth/signup", { email, password, name: "Parity Test", isGuardianAdult: true });
  const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] });
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  return { api, child, email, password, drop: () => api("DELETE", "/api/account", { password, confirm: true }) };
}

/** Open `route` on `base` signed in as `acct`; returns the normalised DOM, a screenshot and the Kaksha chunk requests. */
async function snap(base, acct, route, { search = "", fresh = true, lessonStart = null, ctx: given = null, hello = false } = {}) {
  const ctx = given ?? await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: "reduce", timezoneId: "Asia/Kolkata" });
  const c = acct.api.cookie(); const i = c.indexOf("=");
  await ctx.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: base }]);
  const p = await ctx.newPage();
  const kchunks = [];
  p.on("request", (r) => { if (/\/assets\/Kaksha[A-Za-z]*-/.test(r.url())) kchunks.push(new URL(r.url()).pathname.replace(/-[\w-]{8}\./, ".")); });
  if (lessonStart) {
    await p.route("**/api/lesson/start", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lessonStart) }));
    await p.route(/\/api\/(lesson\/(turn|stream|ack|tts|end|event)|duplex|speech|realtime)/, (r) => r.abort());
  }
  if (fresh) await p.addInitScript(([cid, met]) => {
    try { localStorage.clear(); if (met) localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch {}
  }, [acct.child.id, hello]);
  await p.goto(`${base}/c/${acct.child.id}${route}${search}`, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(2500);
  // the living face (canvas / video, idle motion) moves between any two captures, even of the same build: hide it in
  // the picture; the DOM comparison still covers it
  await p.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} canvas,video{visibility:hidden!important}" });
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p.waitForTimeout(500);
  const html = await p.evaluate(() => document.body.innerHTML);
  const url = new URL(p.url()).pathname.replace(/\/c\/[0-9a-f-]{36}/, "/c/:cid");
  const png = await p.screenshot({ animations: "disabled" });
  const kx = await p.evaluate(() => !!document.querySelector(".kx"));
  await p.close(); if (!given) await ctx.close();
  return { html: norm(html), url, png, kchunks, kx };
}
const norm = (h) => h
  .replace(/-[\w-]{8}\.(js|css|webp|png|woff2|svg|avif|jpg)/g, ".$1")
  .replace(/ data-zone="[a-z]+"/g, "")
  .replace(/ data-wb-t="\d+"/g, "") // the whiteboard's own draw clock (ms since mount): differs between any two captures
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, ":uuid");

/** Count differing pixels between two PNGs, in the page (no image dependency). */
async function pixelDiff(a, b) {
  if (a.equals(b)) return 0;
  const p = await browser.newPage();
  const n = await p.evaluate(async ([x, y]) => {
    const load = (s) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = `data:image/png;base64,${s}`; });
    const [ia, ib] = await Promise.all([load(x), load(y)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return -1;
    const data = (im) => { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const da = data(ia), db = data(ib); let d = 0;
    for (let k = 0; k < da.length; k += 4) if (da[k] !== db[k] || da[k + 1] !== db[k + 1] || da[k + 2] !== db[k + 2]) d++;
    return d;
  }, [a.toString("base64"), b.toString("base64")]);
  await p.close();
  return n;
}

function firstDiff(a, b) {
  let k = 0; while (k < a.length && a[k] === b[k]) k++;
  return { at: k, base: a.slice(Math.max(0, k - 80), k + 120), branch: b.slice(Math.max(0, k - 80), k + 120) };
}

const rows = [];
// Pixel bar, per route: three captures of the base and two of the branch. The page's own moving parts (the child's avatar
// at the top left renders in one of a few states per capture: probe 2026-10-10, every difference inside a 44 x 44 px box;
// the whiteboard's strokes) make two captures of the SAME build differ by up to a few hundred px. The route passes when the
// closest branch/base pair differs by no more than two base captures differ from each other (floor 64 px), i.e. the branch
// picture is one the base itself draws. The DOM comparison (every capture) is the exact check.
async function compare(name, acct, route, opts = {}) {
  const xs = [await snap(A, acct, route, opts), await snap(A, acct, route, opts), await snap(A, acct, route, opts)];
  const ys = [await snap(B, acct, route, opts), await snap(B, acct, route, opts)];
  const x = xs[0], y = ys[0];
  const within = [await pixelDiff(xs[0].png, xs[1].png), await pixelDiff(xs[0].png, xs[2].png), await pixelDiff(xs[1].png, xs[2].png)];
  const cross = [];
  for (const a of xs) for (const b of ys) cross.push(await pixelDiff(a.png, b.png));
  const px = Math.min(...cross), ctl = Math.max(...within), bar = Math.max(64, ctl);
  // every branch capture must be a DOM the base itself produced (a page that animates, e.g. the notebook's whiteboard
  // replaying its strokes, differs between two captures of the SAME build: controlDom false)
  const domEqual = ys.every((b) => xs.some((a) => a.html === b.html));
  const row = { name, route, search: opts.search ?? "", url: [x.url, y.url], domEqual, controlDom: xs.every((a) => a.html === x.html), pixels: px, pixelsCross: cross, controlPixels: within, kakshaChunks: [...new Set(ys.flatMap((b) => b.kchunks))], kakshaRoot: ys.some((b) => b.kx) };
  if (!domEqual) row.diff = firstDiff(x.html, ys.find((b) => b.html !== x.html)?.html ?? y.html);
  if (!domEqual || px > bar) {
    fs.mkdirSync(SHOTS, { recursive: true });
    const f = name.replace(/[^\w]+/g, "-");
    fs.writeFileSync(path.join(SHOTS, `${f}-base.png`), x.png); fs.writeFileSync(path.join(SHOTS, `${f}-branch.png`), y.png);
  }
  rows.push(row);
  ok(xs.every((a) => a.url === x.url) && ys.every((b) => b.url === x.url), `N ${name}: same URL on both builds (${x.url})`);
  ok(domEqual, `N ${name}: every branch DOM is one the base produced (base self-agreement ${row.controlDom})${domEqual ? "" : ` (first difference at ${row.diff.at})`}`);
  ok(px <= bar, `N ${name}: the branch draws a picture the base draws (closest pair ${px} px; base vs base up to ${ctl} px)`);
  ok(!row.kakshaChunks.length && !row.kakshaRoot, `N ${name}: no Kaksha chunk or root on the branch (${row.kakshaChunks.join(",") || "none"})`);
  return row;
}

const made = [];
try {
  // ── N: a non-cohort account ──
  const n = await account(`r4k-parity-n+${Date.now()}@taxila.test`); made.push(n);
  const me = await n.api("GET", "/api/me");
  ok(me.ui?.kaksha === false, "N /api/me answers ui.kaksha false outside the cohort");
  const [s1, s2] = [await snap(A, n, ""), await snap(A, n, "")];
  const noise = { dom: s1.html === s2.html, pixels: await pixelDiff(s1.png, s2.png) };
  rows.push({ name: "noise control: base vs base", ...noise });
  console.log(`control: two captures of the base build: DOM equal ${noise.dom}, ${noise.pixels} px differ`);
  for (const search of ["", "?ui=kaksha"]) await compare(`first visit home ${search || "plain"}`, n, "", { search });
  // one real lesson so Home has a past (the only model calls in this harness: one short scripted lesson)
  const KIT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits/c5-maths.json"), "utf8"));
  // the lesson's first-screen answer is recorded from this real start and replayed to both builds
  const recorded = {};
  const rec = async (m, u, ...rest) => { const r = await n.api(m, u, ...rest); if (u === "/api/lesson/start" && !recorded.start) recorded.start = r; return r; };
  rec.cookie = n.api.cookie;
  await driveLesson(rec, n.child.id, { topicId: KIT.topics.find((t) => (t.items ?? []).length >= 4).topicId, maxTurns: 6 });
  const { status: _s, ms: _m, ...startBody } = recorded.start;
  for (const search of ["", "?ui=kaksha"]) {
    for (const r of ["", "/map", "/ask", "/notebook", "/me", "/teacher"]) await compare(`after a lesson ${r || "/"} ${search || "plain"}`, n, r, { search, hello: true });
    await compare(`lesson first screen ${search || "plain"}`, n, "/lesson/new", { search, lessonStart: startBody });
  }
  // the one route that is new on the branch: /hangar sends a non-cohort child home (base has no such route)
  const h = await snap(B, n, "/hangar", { search: "?ui=kaksha", hello: true });
  rows.push({ name: "hangar (branch only)", url: h.url, kakshaChunks: h.kchunks, kakshaRoot: h.kx });
  ok(h.url === "/c/:cid" && !h.kx, `N /hangar on the branch redirects to today's Home (${h.url})`);

  // ── C: the cohort account ──
  const c = await account(COHORT); made.push(c);
  const cme = await c.api("GET", "/api/me");
  ok(cme.ui?.kaksha === true, "C /api/me answers ui.kaksha true for the cohort account");
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: "reduce" });
  const on = await snap(B, c, "", { ctx, hello: true });
  ok(on.kx && on.kchunks.length > 0, `C the cohort account gets Kaksha with no URL step (${on.kchunks.join(",")})`);
  const off = await snap(B, c, "", { ctx, search: "?ui=classic", fresh: false });
  ok(!off.kx, "C ?ui=classic turns it off on that device");
  const still = await snap(B, c, "", { ctx, fresh: false });
  ok(!still.kx, "C ... and it stays off on that device afterwards");
  const back = await snap(B, c, "", { ctx, search: "?ui=default", fresh: false });
  ok(back.kx, "C ?ui=default gives the account's answer back (Kaksha)");
  const base = await snap(A, c, "", { hello: true });
  ok(!base.kx, "C the base build shows the cohort account today's app");
  rows.push({ name: "cohort", on: on.kx, classic: off.kx, after: still.kx, reset: back.kx, baseBuild: base.kx });
  await ctx.close();
} catch (e) {
  ok(false, `harness threw: ${e?.stack ?? e}`);
} finally {
  for (const m of made) await m.drop().then(() => console.log(`cleanup: ${m.email.replace(/\+.*@/, "+…@")} deleted`), (e) => ok(false, `cleanup failed: ${e.message}`));
  await browser.close();
}
fs.writeFileSync(path.join(OUT, "parity-k.json"), JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  method: "local production builds, base 0c90ebb vs claude/r4-app-design, Neon TEST branch, Chromium 412x915 reduced motion, animations off",
  rows: rows.map(({ diff, ...r }) => ({ ...r, ...(diff ? { diff } : {}) })),
}, null, 2) + "\n");
if (!rows.length) warn("no rows");
done();
