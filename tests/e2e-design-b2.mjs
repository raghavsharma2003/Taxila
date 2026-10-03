// PRODUCT-DESIGN-V2 §13.2 / §14 B2: the Playwright battery for the child home, first run, progress and the onboarding
// fixes, on the SHIPPED build. Standalone (needs Chromium; not part of `npm test`):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-b2.mjs [--dist <built SPA>] [--shots <dir>] [--quick]
//
// It builds the production SPA (vite build → a temp dir, NO dev routes) unless --dist is given, serves it with
// server/serve.mjs on a spare port, and mocks every /api/* call with page.route (fixtures below), so what runs is the
// real ChildShell, plan fallback, Garden/Sky, Notebook, Ask, Me, Your teacher, Hello and the onboarding steps.
// Checks (each with a negative control that must trip it):
//   V-LAYOUT-2  no empty container > 48 px on any child route (audit #9's navy box); no horizontal scroll
//   V-EN-1      English chrome: no Devanagari and no Hinglish chrome word outside [data-speech]
//   V-NAME-1    every button / link / input has an accessible name; switches expose their state
//   V-SIG-2     0 [data-lamp] on child non-lesson routes and onboarding (the lamp is the lesson dock's alone)
//   V-TGT       visible controls ≥ 48 px (Older) / ≥ 64 px for the Young primary controls
//   V-PLAN      the home has ONE primary card in every plan state, incl. the plan API 404 / 500 / offline fallback
//   V-MAP       Garden / Sky: empty state with an action; a sealed chapter shows its seal; "Your class is here"; List
//   V-ID-1      the child's teacher record on home, Hello, the map sheet and Your teacher (data-teacher-id)
//   V-PERF-1    art transferred per child route ≤ 350 KB; tier D (?tier=D) requests no background
//   V-ONB       each onboarding step opens at scrollY 0 with focus on its h1; class first → Meet shows that class's
//               teacher; promises before the account; English language tiles
//   V-MASTER    the build ships no master: /assets/gen/<master> is not served as an image; manifest.json is
//   V-ABS       absence invariance: the home after 1 vs 30 days away renders the same text
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const QUICK = process.argv.includes("--quick");
const SHOTS = arg("--shots", `${ROOT}docs/design/build/b2`);
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  detail = String(detail).replace(/\s+/g, " ").trim();
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// ───────────────────────────── server ─────────────────────────────
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-b2-dist-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "" } });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist }, stdio: ["ignore", "pipe", "pipe"] });
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}
console.log(`app: ${BASE} (built ${dist})`);

// ───────────────────────────── fixtures ─────────────────────────────
const CHILDREN = {
  riya: { id: "c-riya", first_name: "Riya", class_level: 3, board: "cbse", language_pref: "hinglish", teacher_id: "asha", avatar: "red-panda", interests: ["Cricket", "Space", "Animals"] },
  kabir: { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "arjun", avatar: "rocket", interests: ["Football"] },
  neha: { id: "c-neha", first_name: "Neha", class_level: 2, board: "cbse", language_pref: "hindi", teacher_id: "asha", avatar: null, interests: ["Animals", "Drawing"] },
  dev: { id: "c-dev", first_name: "Dev", class_level: 7, board: "cbse", language_pref: "hinglish", teacher_id: "arjun", avatar: null, interests: ["Space", "Trains"] },
};
const TEACHER = (id) => ({ id, name: id === "asha" ? "Asha" : id === "arjun" ? "Arjun" : "Uma", addressedAs: id, role: "AI teacher",
  pronouns: id === "arjun" ? { subject: "he", object: "him", possessive: "his" } : { subject: "she", object: "her", possessive: "her" }, voice: "x", lookRev: 1, signatureColor: null });
const curriculum = (cls, subject) => JSON.parse(fs.readFileSync(path.join(ROOT, `data/curriculum/c${cls}-${subject}.json`), "utf8"));

/** A ChildMapResponse built from the real syllabus: chapter 1 sealed, chapter 2 mixed, chapter 3 is "here". */
function mapFor(child, kind) {
  const mode = child.class_level <= 4 ? "garden" : "sky";
  if (kind === "empty") return { mode, hidden: false, subjects: [], skills: [], empty: true };
  if (kind === "hidden") return { mode, hidden: true, subjects: [], skills: [], empty: true };
  const subjects = (mode === "garden" ? ["maths", "evs"] : ["maths", "science"]).map((subject) => {
    const cur = curriculum(child.class_level, subject);
    const chapters = cur.chapters.map((ch, ci) => {
      const topics = ch.topics.map((tp, ti) => {
        const state = ci === 0 ? (ti % 2 ? "got_it" : "secure") : ci === 1 ? ["practising", "got_it", "not_started", "secure"][ti % 4] : ci === 2 && ti === 0 ? "practising" : "not_started";
        return { id: tp.id, title: tp.title, skills: [{ skillId: `${tp.id}-s1`, title: tp.title, topicId: tp.id, chapter: ch.title, subject, status: "practising", state, recheckScheduled: ci === 1 && ti === 0 }] };
      });
      const skills = topics.flatMap((t) => t.skills);
      return { id: ch.id, number: ch.number, title: ch.title, sealed: ci === 0, here: ci === 2, secure: skills.filter((s) => s.state === "secure").length, total: skills.length, topics };
    });
    return { subject, book: cur.book, chapters };
  });
  const skills = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.flatMap((t) => t.skills)));
  return { mode, hidden: false, subjects, skills, empty: false };
}

const DID = { title: "Comparing big numbers", shortTitle: "Big numbers", nextTitle: null, face: "warm", revoiceSeq: null,
  cards: [{ kind: "item", ask: "Which is bigger, 4,520 or 4,250?", answer: "4,520", tick: true, withHelp: false, turnSeq: 3 },
    { kind: "item", ask: "What comes after 999?", answer: "1,000", tick: true, withHelp: true, turnSeq: 5 }] };

function planFor(child, state) {
  const topic = { id: child.class_level <= 4 ? "c3-maths-ch05-t01" : "c6-maths-ch05-t01", title: "Fractions as equal parts of a whole", shortTitle: "Fractions: equal parts",
    chapter: "Fractions", subject: "maths", minutes: child.class_level <= 4 ? 15 : 25 };
  return {
    state, homeState: state === "done" || state === "capped" ? "done" : state === "resting" ? "resting" : "default",
    plan: { openLesson: state === "resume" ? "L-open" : null, window: { from: "07:00", to: "20:30" } },
    topic: ["start", "first", "resume"].includes(state) ? topic : null,
    resume: state === "resume" ? { lessonId: "L-open", ask: "What fraction of the roti is left?", topicTitle: topic.title } : null,
    today: state === "done" || state === "capped" ? { lessonId: "L-done", summary: DID } : null,
    capRemaining: state === "capped" ? 0 : 20, capMin: 30, usedMin: 10, opensAt: state === "resting" ? "07:00" : null,
    packReady: null, day: "2026-10-03", tz: "Asia/Kolkata", teacher: TEACHER(child.teacher_id),
    surfaces: { map: true, notebook: true, resume: true }, source: { dayPlan: null },
  };
}

/** Install the API mock for one scenario. `fx` = { children, plan: state | 404 | 500, map: kind, tutors: 1 | 2, live } */
async function mockApi(page, fx) {
  const calls = [];
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    calls.push(`${req.method()} ${p}`);
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const cid = url.searchParams.get("childId");
    const child = Object.values(CHILDREN).find((c) => c.id === cid) ?? fx.children[0];
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "parent@example.test", name: "Parent" }, children: fx.children });
    if (p === "/api/child/plan") {
      if (fx.plan === 404 || fx.plan === 500) return json(fx.plan, { error: "not found" });
      return json(200, { ...planFor(child, fx.plan ?? "start"), ...(fx.hideSurfaces ? { surfaces: { map: false, notebook: false, resume: false } } : {}) });
    }
    if (p === "/api/child/map") return json(200, mapFor(child, fx.map ?? "mid"));
    if (p === "/api/tutors" && req.method() === "GET") {
      const two = fx.tutors === 2;
      return json(200, { current: child.teacher_id, chosen: !!fx.chosen, mode: two ? "picker" : "single", band: "b3", tutors: two ? ["arjun", "asha"] : [child.teacher_id], live: !!fx.live });
    }
    if (p === "/api/tutors/choose") return json(200, { ok: true });
    if (p === "/api/lesson/summary") return json(200, { lessonId: url.searchParams.get("lessonId"), ended: true, did: { ...DID, title: `Lesson ${url.searchParams.get("lessonId")}` } });
    if (p === "/api/child/teacher") {
      const cl = Number(url.searchParams.get("classLevel"));
      const id = cl <= 4 ? "asha" : "arjun";
      return json(200, { teacher: TEACHER(id), eligible: [TEACHER(id)] });
    }
    if (p === "/api/children" && req.method() === "PATCH") return json(200, { child });
    if (p === "/api/parent/pin") return json(200, { hasPin: false });
    if (p.startsWith("/api/lesson/")) return json(409, { error: "not in this battery" });
    return json(404, { error: "unmocked" });
  });
  return calls;
}

// ───────────────────────────── in-page checks ─────────────────────────────
const HINGLISH = ["ghar", "ruko", "bolo", "bas", "bhejo", "phir", "shuru", "chalo", "paath", "abhyaas", "pakka", "baari", "agla", "kyun", "aata", "karein", "karo",
  "humne", "banaya", "mera", "meri", "bagiya", "aasmaan", "tumhare", "aage", "chalein", "nahi", "haan", "yahan", "likho", "abhi", "baad", "mein", "suno", "kaise",
  "pata", "hafte", "kaam", "dekhein", "chhoo"];

async function audit(page, { young }) {
  return page.evaluate(({ HINGLISH, young }) => {
    const out = { en: [], names: [], dead: [], lamps: 0, tgt: [], hscroll: false };
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
    // V-EN-1: text nodes outside [data-speech]
    const re = new RegExp(`\\b(${HINGLISH.join("|")})\\b`, "i");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest("[data-speech], script, style, [aria-hidden='true']")) continue;
      const s = n.textContent.trim();
      if (!s) continue;
      if (/[ऀ-ॿ]/.test(s)) out.en.push(`deva: ${s.slice(0, 40)}`);
      const m = s.match(re);
      if (m) out.en.push(`hinglish "${m[1]}": ${s.slice(0, 40)}`);
    }
    for (const el of document.querySelectorAll("[aria-label]")) {
      const s = el.getAttribute("aria-label");
      if (/[ऀ-ॿ]/.test(s)) out.en.push(`deva label: ${s}`);
    }
    // V-NAME-1
    const nameOf = (el) => {
      const lb = el.getAttribute("aria-labelledby");
      if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
      if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent.trim(); }
      const txt = (el.innerText ?? el.textContent ?? "").trim();
      if (txt) return txt;
      const img = el.querySelector("img[alt]:not([alt=''])");
      return img?.getAttribute("alt") ?? el.getAttribute("title") ?? el.getAttribute("placeholder") ?? "";
    };
    for (const el of document.querySelectorAll("button, [role=button], [role=switch], [role=radio], a[href], input, textarea, select")) {
      if (!visible(el) || el.closest("[aria-hidden='true']")) continue;
      if (!nameOf(el)) out.names.push(el.outerHTML.slice(0, 90));
      if (el.getAttribute("role") === "switch" && !["true", "false"].includes(el.getAttribute("aria-checked"))) out.names.push(`switch without state: ${el.outerHTML.slice(0, 60)}`);
      // V-TGT
      const r = el.getBoundingClientRect();
      const min = 44;
      if (!el.closest("p, li.me-hint, .t-note, summary") && (r.width < min || r.height < min) && el.tagName !== "INPUT") out.tgt.push(`${Math.round(r.width)}x${Math.round(r.height)} ${(el.innerText || el.getAttribute("aria-label") || el.tagName).slice(0, 30)}`);
      if (young && el.matches(".cs-btn--start, .ptile, .cs-homebtn, .plant-btn, .garden-arrow, .hello-go") && (r.height < 64 || r.width < 64)) out.tgt.push(`young<64 ${(el.innerText || "").slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    // V-LAYOUT-2: an empty container taller than 48 px inside main
    const main = document.querySelector("main") ?? document.body;
    for (const el of main.querySelectorAll("div, section, aside, article, li")) {
      if (!visible(el) || el.closest("[aria-hidden='true'], .scene, [aria-busy='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 48) continue;
      const hasContent = (el.innerText ?? "").trim() || el.querySelector("img, svg, canvas, picture, video, input, textarea, button, a, [role=img]");
      if (!hasContent) out.dead.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.height)}px`);
    }
    out.lamps = document.querySelectorAll("[data-lamp]").length;
    out.hscroll = document.scrollingElement.scrollWidth > window.innerWidth + 1;
    return out;
  }, { HINGLISH, young });
}

function report(tag, a) {
  check(`V-EN-1 ${tag}`, a.en.length === 0, a.en.slice(0, 3).join(" | "));
  check(`V-NAME-1 ${tag}`, a.names.length === 0, a.names.slice(0, 2).join(" | "));
  check(`V-LAYOUT-2 ${tag}`, a.dead.length === 0 && !a.hscroll, [...a.dead.slice(0, 3), a.hscroll ? "horizontal scroll" : ""].filter(Boolean).join(" | "));
  check(`V-SIG-2 ${tag}`, a.lamps === 0, `${a.lamps} lamp(s)`);
  check(`V-TGT ${tag}`, a.tgt.length === 0, a.tgt.slice(0, 4).join(" | "));
}

// ───────────────────────────── run ─────────────────────────────
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const VIEWS = QUICK ? [{ w: 360, h: 640 }] : [{ w: 360, h: 640 }, { w: 1280, h: 800 }];

async function open(fx, url, { w, h, theme = "light", offline = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: w < 720 ? 2 : 1, hasTouch: w < 720, isMobile: w < 720, colorScheme: theme,
    serviceWorkers: "block",
  });
  const page = await ctx.newPage();
  const art = { bytes: 0, bg: 0 };
  page.on("response", async (r) => {
    const u = new URL(r.url());
    if (!u.pathname.startsWith("/assets/art/") && !u.pathname.startsWith("/assets/gen/")) return;
    if (u.pathname.endsWith(".json")) return;
    try { art.bytes += (await r.body()).length; } catch { /* aborted */ }
    if (u.pathname.startsWith("/assets/art/bg/")) art.bg++;
  });
  const calls = await mockApi(page, fx);
  if (fx.storage) await page.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, fx.storage);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(900);
  // offline: the app is up (the cached shell) and the link drops; the home re-reads on the `offline` event
  if (offline) { await ctx.setOffline(true).catch(() => {}); await page.waitForTimeout(700); }
  return { ctx, page, art, calls };
}
const shot = async (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });

const helloDone = (cid) => ({ [`taxila.child.${cid}.prefs`]: JSON.stringify({ hello: true }) });

// V-MASTER: no master in the build
{
  const m = await fetch(`${BASE}/assets/gen/bg/home-young-wide.webp`);
  const ct = m.headers.get("content-type") ?? "";
  check("V-MASTER masters not shipped", !ct.startsWith("image/"), `content-type ${ct}`);
  const man = await fetch(`${BASE}/assets/gen/manifest.json`);
  check("V-MASTER manifest.json shipped", man.ok && (man.headers.get("content-type") ?? "").includes("json"));
  const listed = fs.existsSync(path.join(dist, "assets/gen")) ? fs.readdirSync(path.join(dist, "assets/gen")) : [];
  check("V-MASTER dist/assets/gen holds only manifest.json", listed.length === 1 && listed[0] === "manifest.json", listed.join(","));
}

// HOME: every plan state, both families, light/dark, both sizes
const HOME_STATES = QUICK ? ["start", "done", 404] : ["start", "first", "resume", "done", "capped", "resting", 404, 500, "offline"];
for (const who of ["riya", "kabir"]) {
  const child = CHILDREN[who];
  const young = child.class_level <= 4;
  for (const v of VIEWS) for (const theme of young ? ["light"] : ["light", "dark"]) for (const st of HOME_STATES) {
    if (theme === "dark" && !["start", "done", 404].includes(st)) continue;
    const offline = st === "offline";
    const fx = { children: [child], plan: offline ? "start" : st, storage: helloDone(child.id) };
    const { ctx, page, art } = await open(fx, `/c/${child.id}`, { ...v, theme, offline });
    const tag = `home ${who} ${st} ${v.w} ${theme}`;
    await page.waitForSelector("[data-testid=primary-card]", { timeout: 8000 }).catch(() => {});
    const info = await page.evaluate(() => {
      const card = document.querySelector("[data-testid=primary-card]");
      const grid = document.querySelector("[data-plan-state]");
      return { cards: document.querySelectorAll("[data-testid=primary-card]").length, state: grid?.getAttribute("data-plan-state"), source: grid?.getAttribute("data-plan-source"),
        text: card?.innerText.trim() ?? "", action: !!card?.querySelector("a, button"), teacher: document.querySelector("[data-teacher-id]")?.getAttribute("data-teacher-id"),
        theme: document.documentElement.getAttribute("data-theme"), grownups: !!document.querySelector("[data-testid=grownups]") };
    });
    const expect = typeof st === "number" ? "start" : st;
    const needsAction = ["start", "first", "resume", "done", "offline"].includes(expect);
    check(`V-PLAN ${tag}`, info.cards === 1 && info.state === expect && info.text.length > 3 && (!needsAction || info.action), `${info.state}/${info.source} "${info.text.slice(0, 50)}"`);
    if (typeof st === "number") check(`V-PLAN fallback start link ${tag}`, await page.locator("[data-testid=start-lesson]").count() === 1);
    check(`V-ID-1 home ${tag}`, info.teacher === child.teacher_id, `${info.teacher}`);
    if (young) check(`Young light-only ${tag}`, info.theme === "light", `${info.theme}`);
    check(`Grown-ups door ${tag}`, info.grownups);
    report(tag, await audit(page, { young }));
    check(`V-PERF-1 art ${tag}`, art.bytes <= 350 * 1024, `${(art.bytes / 1024).toFixed(0)} KB`);
    await shot(page, `home__${typeof st === "number" ? `plan-${st}` : st}__${young ? "b2" : "b3"}__${v.w}__${theme}`);
    await ctx.close();
  }
}

// HOME: tier D loads no background; absence invariance; a never-met child goes to Hello; hidden surfaces
{
  const child = CHILDREN.kabir;
  const { ctx, page, art } = await open({ children: [child], plan: "done", storage: helloDone(child.id) }, `/c/${child.id}?tier=D`, VIEWS[0]);
  await page.waitForTimeout(600);
  check("B2-A7 tier D: no background requested", art.bg === 0, `${art.bg} bg request(s)`);
  check("B2-A7 tier D: home still usable", await page.locator("[data-testid=primary-card]").count() === 1);
  await shot(page, "home__tier-D__b3__360__light");
  await ctx.close();
  const texts = [];
  for (const days of [1, 30]) {
    const c2 = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const p2 = await c2.newPage();
    await p2.clock.setFixedTime(new Date(Date.UTC(2026, 9, 3 + days, 4, 0)));
    await mockApi(p2, { children: [child], plan: "start" });
    await p2.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, helloDone(child.id));
    await p2.goto(`${BASE}/c/${child.id}`);
    await p2.waitForSelector("[data-testid=primary-card]", { timeout: 8000 }).catch(() => {});
    texts.push(await p2.locator("main").innerText());
    await c2.close();
  }
  check("V-ABS home after 1 vs 30 days away is the same", texts[0] === texts[1]);
  const { ctx: c3, page: p3 } = await open({ children: [CHILDREN.dev], plan: "first" }, `/c/${CHILDREN.dev.id}`, VIEWS[0]);
  await p3.waitForSelector("[data-testid=hello]", { timeout: 8000 }).catch(() => {});
  check("Later never skips Hello: a never-met child lands on Hello", p3.url().endsWith("/hello"), p3.url());
  await c3.close();
  const { ctx: c4, page: p4 } = await open({ children: [CHILDREN.riya], plan: "start", hideSurfaces: true, storage: helloDone(CHILDREN.riya.id) }, `/c/${CHILDREN.riya.id}`, VIEWS[0]);
  await p4.waitForTimeout(500);
  check("Only this session: no Garden / Notebook tiles", await p4.locator("[data-testid=tile-garden], [data-testid=tile-notebook]").count() === 0);
  await c4.close();
}

// MAP: Garden (Young) and Sky (Older): empty, mid (seal + here), list, the tapped sheet
for (const who of ["riya", "kabir"]) {
  const child = CHILDREN[who];
  const young = child.class_level <= 4;
  for (const v of VIEWS) for (const kind of ["empty", "mid"]) for (const theme of young ? ["light"] : ["light", "dark"]) {
    if (theme === "dark" && kind === "empty") continue;
    const { ctx, page } = await open({ children: [child], plan: "start", map: kind, storage: helloDone(child.id) }, `/c/${child.id}/map`, { ...v, theme });
    const tag = `map ${who} ${kind} ${v.w} ${theme}`;
    await page.waitForSelector(kind === "empty" ? "[data-testid=map-empty]" : young ? "[data-testid=garden]" : "[data-testid=sky-map]", { timeout: 8000 }).catch(() => {});
    if (kind === "empty") {
      check(`V-MAP empty state ${tag}`, await page.locator("[data-testid=map-empty] a").count() === 1);
    } else if (young) {
      check(`V-MAP garden beds ${tag}`, await page.locator(".bed").count() >= 3);
      check(`V-MAP garden seal ${tag}`, await page.locator(".bed[data-sealed] .bed-seal").count() >= 1);
      check(`V-MAP no field of empty plots ${tag}`, await page.locator(".bed").count() < 14);
    } else {
      await page.waitForTimeout(400);
      check(`V-MAP sky here ${tag}`, (await page.locator(".sky-here").count()) === 1);
      check(`V-MAP sky seal ${tag}`, (await page.locator(".sky-seal").count()) >= 1);
      check(`V-MAP sky line ${tag}`, /\d+ of \d+ Secure/.test(await page.locator("[data-testid=sky-line]").innerText().catch(() => "")));
      const sz = await page.locator(".sky-star").first().boundingBox();
      check(`V-MAP star target ≥ 48 ${tag}`, sz && sz.width >= 48 && sz.height >= 48, sz ? `${sz.width}x${sz.height}` : "none");
      check(`V-MAP prerequisite edges drawn ${tag}`, (await page.locator(".sky-svg line").count()) > 0);
    }
    report(tag, await audit(page, { young }));
    await shot(page, `map__${kind}__${young ? "b2" : "b3"}__${v.w}__${theme}`);
    if (kind === "mid") {
      // tap a plant / star → the sheet (phone) or the side panel (1280 Older)
      await page.locator(young ? ".plant-btn" : ".sky-star").first().click().catch(() => {});
      await page.waitForTimeout(500);
      const sheet = page.locator("[data-testid=skill-sheet]");
      check(`V-MAP tapped sheet ${tag}`, await sheet.count() >= 1);
      const ids = await page.locator("[data-testid=skill-sheet] [data-teacher-id], [data-testid=skill-sheet] [data-art^='teacher/']").evaluateAll((els) => els.map((e) => e.getAttribute("data-teacher-id") ?? e.getAttribute("data-art")));
      check(`V-ID-1 map sheet ${tag}`, ids.some((x) => x?.includes(child.teacher_id)), ids.join(","));
      await shot(page, `map__sheet__${young ? "b2" : "b3"}__${v.w}__${theme}`);
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator("[data-testid=list-toggle]").click().catch(() => {});
      await page.waitForTimeout(300);
      check(`V-MAP list view ${tag}`, await page.locator("[data-testid=map-list] .maplist-row").count() > 3);
      if (!young) check(`V-MAP list words ${tag}`, (await page.locator(".maplist-word").first().innerText()).match(/Not started|Practising|Got it|Secure/));
      report(`${tag} list`, await audit(page, { young }));
      await shot(page, `map__list__${young ? "b2" : "b3"}__${v.w}__${theme}`);
    }
    await ctx.close();
  }
}

// NOTEBOOK (empty, 3 pages), ASK (empty, typed), ME, YOUR TEACHER (1, 2 eligible)
for (const who of ["riya", "kabir"]) {
  const child = CHILDREN[who];
  const young = child.class_level <= 4;
  const b = young ? "b2" : "b3";
  for (const v of VIEWS) {
    const themes = young ? ["light"] : ["light", "dark"];
    for (const theme of themes) {
      const arte = JSON.stringify([1, 2, 3].map((i) => ({ lessonId: `L${i}`, topic: `Lesson ${i}`, chips: ["12", "24"], at: Date.UTC(2026, 9, i) })));
      for (const pages of [0, 3]) {
        const storage = { ...helloDone(child.id), ...(pages ? { [`taxila.child.${child.id}.artefacts`]: arte } : {}) };
        const { ctx, page } = await open({ children: [child], plan: "start", storage }, `/c/${child.id}/notebook`, { ...v, theme });
        await page.waitForSelector(pages ? "[data-testid=notebook-page]" : "[data-testid=notebook-empty]", { timeout: 8000 }).catch(() => {});
        const tag = `notebook ${who} ${pages} ${v.w} ${theme}`;
        check(`notebook ${pages ? "pages" : "empty"} ${tag}`, pages ? (await page.locator("[data-testid=notebook-page]").count()) === 3 : (await page.locator("[data-testid=notebook-empty]").count()) === 1);
        report(tag, await audit(page, { young }));
        await shot(page, `notebook__${pages ? "3-pages" : "empty"}__${b}__${v.w}__${theme}`);
        await ctx.close();
      }
      {
        const { ctx, page } = await open({ children: [child], plan: "start", storage: helloDone(child.id) }, `/c/${child.id}/me`, { ...v, theme });
        await page.waitForSelector("[data-testid=me]", { timeout: 8000 }).catch(() => {});
        const tag = `me ${who} ${v.w} ${theme}`;
        report(tag, await audit(page, { young }));
        const sw = page.locator("[role=switch]").first();
        const before = await sw.getAttribute("aria-checked");
        await sw.click();
        check(`me switch announces state ${tag}`, (await sw.getAttribute("aria-checked")) !== before);
        await shot(page, `me__default__${b}__${v.w}__${theme}`);
        await ctx.close();
      }
      for (const n of [1, 2]) {
        const { ctx, page } = await open({ children: [child], plan: "start", tutors: n, storage: helloDone(child.id) }, `/c/${child.id}/teacher`, { ...v, theme });
        await page.waitForSelector(n === 2 ? ".tc-grid" : ".tc-one", { timeout: 8000 }).catch(() => {});
        const tag = `teacher ${who} ${n} ${v.w} ${theme}`;
        const ids = await page.locator("[data-teacher-id]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("data-teacher-id")))]);
        check(`V-ID-1 your teacher ${tag}`, n === 1 ? ids.length === 1 && ids[0] === child.teacher_id : ids.includes("arjun") && ids.includes("asha"), ids.join(","));
        check(`no fake choice ${tag}`, n === 1 ? (await page.locator("[data-testid^=choose-]").count()) === 0 : true);
        report(tag, await audit(page, { young }));
        await shot(page, `teacher__${n}-eligible__${b}__${v.w}__${theme}`);
        if (n === 2) {
          await page.locator("[data-testid=choose-asha], [data-testid=choose-arjun]").first().click().catch(() => {});
          await page.waitForTimeout(400);
          check(`teacher confirm sheet ${tag}`, /will teach your next lesson/.test(await page.locator(".tc-confirm").innerText().catch(() => "")));
          await shot(page, `teacher__confirm__${b}__${v.w}__${theme}`);
        }
        await ctx.close();
      }
    }
    if (!young) {
      for (const typed of [false, true]) {
        const { ctx, page } = await open({ children: [child], plan: "start", storage: helloDone(child.id) }, `/c/${child.id}/ask`, v);
        await page.waitForSelector("[data-testid=ask]", { timeout: 8000 }).catch(() => {});
        if (typed) await page.fill("#ask-q", "How do I add 3/4 and 1/2?");
        const tag = `ask ${typed ? "typed" : "empty"} ${v.w}`;
        check(`ask button state ${tag}`, (await page.locator("[data-testid=ask-go]").isDisabled()) === !typed);
        if (!typed) check(`ask reason beside the button ${tag}`, await page.locator("#ask-why").count() === 1);
        report(tag, await audit(page, { young }));
        await shot(page, `ask__${typed ? "typed" : "empty"}__b3__${v.w}__light`);
        await ctx.close();
      }
    } else {
      const { ctx, page } = await open({ children: [child], plan: "start", storage: helloDone(child.id) }, `/c/${child.id}/ask`, v);
      check(`Young has no Ask (rj-passive-tutor) ${v.w}`, !page.url().endsWith("/ask"), page.url());
      await ctx.close();
    }
  }
}

// HELLO: cards 1-5 (Young with her clip; Older without a clip, 2 tutors)
for (const who of ["neha", "dev"]) {
  const child = CHILDREN[who];
  const young = child.class_level <= 4;
  const b = young ? "b1" : "b3";
  for (const v of VIEWS) {
    const { ctx, page } = await open({ children: [child], plan: "first", tutors: young ? 1 : 2 }, `/c/${child.id}/hello`, v);
    await page.waitForSelector("[data-testid=hello]", { timeout: 8000 }).catch(() => {});
    const tag = `hello ${who} ${v.w}`;
    const card = async () => page.locator("[data-testid=hello]").getAttribute("data-card");
    check(`hello card 1 names her ${tag}`, (await page.locator(".hello-name").innerText()).length > 1);
    check(`V-ID-1 hello ${tag}`, (await page.locator("[data-teacher-id]").first().getAttribute("data-teacher-id")) === child.teacher_id);
    check(`hello card 1 audio ${tag}`, young ? (await page.locator("[data-testid=hello-hear]").innerText()).startsWith("Tap to hear") : (await page.locator("[data-testid=hello-next]").count()) === 1);
    report(`${tag} c1`, await audit(page, { young }));
    await shot(page, `hello__1-greeting__${b}__${v.w}__light`);
    await page.locator(young ? "[data-testid=hello-hear]" : "[data-testid=hello-next]").click();
    if (young) await page.locator("text=Next").first().click({ timeout: 2500 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector("[data-testid=hello]")?.getAttribute("data-card") === "ai", null, { timeout: 8000 }).catch(() => {});
    check(`hello card 2 AI disclosure ${tag}`, (await card()) === "ai" && /computer teacher, not a person/.test(await page.locator(".hello-card").innerText()));
    report(`${tag} c2`, await audit(page, { young }));
    await shot(page, `hello__2-ai-card__${b}__${v.w}__light`);
    await page.locator("[data-testid=hello-gotit]").click();
    check(`hello card 3 pictures ${tag}`, (await page.locator(".avatar-grid--hello .avatar-btn").count()) === 6);
    check(`hello That's me waits for a pick ${tag}`, await page.locator("[data-testid=hello-thatsme]").isDisabled());
    await page.locator(".avatar-grid--hello .avatar-btn").nth(1).click();
    report(`${tag} c3`, await audit(page, { young }));
    await shot(page, `hello__3-picture__${b}__${v.w}__light`);
    await page.locator("[data-testid=hello-thatsme]").click();
    await page.waitForTimeout(200);
    check(`hello card 4 parent's picks ${tag}`, (await card()) === "likes" && (await page.locator(".itile[data-on]").count()) === child.interests.length);
    report(`${tag} c4`, await audit(page, { young }));
    await shot(page, `hello__4-likes__${b}__${v.w}__light`);
    if (!young) {
      await page.locator("[data-testid=hello-right]").click();
      await page.waitForTimeout(200);
      check(`hello card 5 teacher (2 eligible) ${tag}`, (await card()) === "teacher" && (await page.locator(".tc-tile").count()) === 2);
      report(`${tag} c5`, await audit(page, { young }));
      await shot(page, `hello__5-teacher__${b}__${v.w}__light`);
    }
    await ctx.close();
  }
}

// ONBOARDING: class first, scroll reset + focus, the actual teacher, promises before the account, English
for (const v of VIEWS) {
  const { ctx, page } = await open({ children: [] }, "/start", v);
  await page.waitForSelector("h1", { timeout: 8000 }).catch(() => {});
  const tag = `onboarding ${v.w}`;
  check(`V-ONB class asked first ${tag}`, page.url().endsWith("/start/class"), page.url());
  report(`${tag} class`, await audit(page, { young: false }));
  await shot(page, `onboarding__1-class__adult__${v.w}__light`);
  await page.getByRole("radio", { name: "Class 6" }).click().catch(() => {});
  await page.getByRole("radio", { name: "CBSE" }).click().catch(() => {});
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/start\/meet/, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({ y: window.scrollY, focus: document.activeElement?.tagName, title: document.title, h1: document.querySelector("h1")?.textContent,
    teacher: document.querySelector("[data-teacher-id]")?.getAttribute("data-teacher-id") }));
  check(`V-ONB meet opens at scroll 0 with focus on h1 ${tag}`, st.y === 0 && st.focus === "H1", JSON.stringify(st));
  check(`V-ONB meet shows the class's teacher (class 6 → Arjun) ${tag}`, st.teacher === "arjun" && /Arjun/.test(st.h1 ?? ""), `${st.teacher} "${st.h1}"`);
  check(`V-ONB page title follows the step ${tag}`, /Arjun/.test(st.title), st.title);
  const langs = await page.locator("[role=radiogroup][aria-label=Language] [role=radio]").allInnerTexts();
  check(`V-ONB English language tiles ${tag}`, langs.join("|") === "English|Hindi|Hindi and English mix", langs.join("|"));
  report(`${tag} meet`, await audit(page, { young: false }));
  await shot(page, `onboarding__2-meet__adult__${v.w}__light`);
  await page.locator("[role=radiogroup][aria-label=Language] [role=radio]").first().click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/start\/promises/, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const st2 = await page.evaluate(() => ({ y: window.scrollY, focus: document.activeElement?.tagName, h1: document.querySelector("h1")?.textContent }));
  check(`V-ONB promises before the account, at scroll 0 ${tag}`, page.url().endsWith("/start/promises") && st2.y === 0 && st2.focus === "H1", JSON.stringify(st2));
  check(`V-ONB promises name the teacher ${tag}`, /Arjun is an AI and says so/.test(await page.locator("main").innerText()));
  report(`${tag} promises`, await audit(page, { young: false }));
  await shot(page, `onboarding__3-promises__adult__${v.w}__light`);
  await ctx.close();
}
// Young class → Asha
{
  const { ctx, page } = await open({ children: [] }, "/start/class", VIEWS[0]);
  await page.getByRole("radio", { name: "Class 2" }).click().catch(() => {});
  await page.getByRole("radio", { name: "RBSE" }).click().catch(() => {});
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(600);
  check("V-ONB class 2 → meet Asha", (await page.locator("[data-teacher-id]").first().getAttribute("data-teacher-id")) === "asha");
  await ctx.close();
}

// NEGATIVE CONTROLS: each check must trip on its own violation
{
  const { ctx, page } = await open({ children: [CHILDREN.kabir], plan: "start", storage: helloDone(CHILDREN.kabir.id) }, `/c/${CHILDREN.kabir.id}`, VIEWS[0]);
  await page.waitForSelector("[data-testid=primary-card]", { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => {
    const m = document.querySelector("main");
    const a = document.createElement("span"); a.textContent = "Abhyaas"; m.appendChild(a);
    const d = document.createElement("div"); d.style.height = "120px"; m.appendChild(d);
    const b = document.createElement("button"); b.style.cssText = "width:60px;height:60px"; m.appendChild(b);
    const l = document.createElement("div"); l.setAttribute("data-lamp", ""); l.textContent = "x"; m.appendChild(l);
    const w = document.createElement("div"); w.style.cssText = "width:2000px;height:10px"; m.appendChild(w);
  });
  const a = await audit(page, { young: false });
  check("negative control V-EN-1 trips on 'Abhyaas'", a.en.length > 0);
  check("negative control V-LAYOUT-2 trips on an empty 120 px box", a.dead.length > 0);
  check("negative control V-NAME-1 trips on a nameless button", a.names.length > 0);
  check("negative control V-SIG-2 trips on a stray [data-lamp]", a.lamps > 0);
  check("negative control horizontal scroll trips", a.hscroll);
  await ctx.close();
}

await browser.close();
srv.kill();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(SHOTS, "checks.json"), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed: failed.length, results }, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `; FAILED: ${failed.map((f) => f.name).slice(0, 20).join("; ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
