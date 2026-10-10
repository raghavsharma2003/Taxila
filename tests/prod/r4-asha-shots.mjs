// Round 4 stream 5: the SHOT BATTERY of every face surface (BUILD-PLAN §3.5 gates), on a production build with the
// dev routes on (the /dev/desk lesson fixtures), every /api/* mocked in the page (no server, no model, no database):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-asha-shots.mjs [--look r8|lamp1] [--dist <dir>] [--shots <dir>]
//
// Surfaces × 360x800, 412x915, 1366x768 × young (class 3) / older (class 6):
//   lesson Face layout (speaking, your_turn), Work layout (work-speaking, the play/board slot), Summary, Trouble (T1),
//   Help sheet; Hello; Home; the Map skill sheet; Your teacher; onboarding Meet (class 3 and class 7); the landing.
// The look comes from GET /api/face/config (mocked `look`), the way production picks it.
// Checks on every page:
//   ONE    every drawn teacher is Asha (data-teacher-id / data-tutor), and every puppet host paints the requested look
//   NAMES  no visible text or accessible name says Arjun or Uma
//   CHOICE no teacher choice: no choose / pick / change-teacher control, no naming card
//   FIT    0 horizontal overflow at the emulated width; visible text ≥ 14 px (captions in the face excepted: none)
//   ERR    0 page errors
// Writes shots (WebP) + results.json to docs/design/round4/build/asha/shots/<look>/.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const LOOK = arg("--look", "r8");
const SHOTS = arg("--shots", `${ROOT}docs/design/round4/build/asha/shots/${LOOK}`);
fs.mkdirSync(SHOTS, { recursive: true });
const VIEWS = [{ w: 360, h: 800 }, { w: 412, h: 915 }, { w: 1366, h: 768 }];

const results = [];
const check = (name, ok, detail = "") => {
  detail = String(detail).replace(/\s+/g, " ").trim().slice(0, 300);
  results.push({ name, ok: !!ok, detail });
  if (!ok) console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
};

// ───────── the app: a production build WITH dev routes (the lesson fixtures), served by server/serve.mjs ─────────
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r4-asha-dist-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}
console.log(`app ${BASE} (dist ${dist}) · look ${LOOK}`);

// ───────── fixtures: the server sends the SERVED teacher (Asha) for every child ─────────
const KIDS = {
  young: { id: "c-riya", first_name: "Riya", class_level: 3, board: "cbse", language_pref: "hinglish", teacher_id: "asha", teacher_name: null, avatar: "red-panda", interests: ["Cricket"] },
  older: { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", teacher_name: null, avatar: "rocket", interests: ["Football"] },
};
const TEACHER = { id: "asha", name: "Asha", characterName: "Asha", addressedAs: "Asha didi", role: "AI teacher", pronouns: { subject: "she", object: "her", possessive: "her" }, voice: "x", lookRev: 1, signatureColor: null };
const curriculum = (cls, subject) => JSON.parse(fs.readFileSync(path.join(ROOT, `data/curriculum/c${cls}-${subject}.json`), "utf8"));
function mapFor(child) {
  const mode = child.class_level <= 4 ? "garden" : "sky";
  const subjects = ["maths"].map((subject) => {
    const cur = curriculum(child.class_level, subject);
    const chapters = cur.chapters.slice(0, 4).map((ch, ci) => {
      const topics = ch.topics.map((tp, ti) => ({ id: tp.id, title: tp.title, skills: [{ skillId: `${tp.id}-s1`, title: tp.title, topicId: tp.id, chapter: ch.title, subject, status: "practising", state: ci === 0 ? "secure" : ti % 2 ? "got_it" : "practising", recheckScheduled: false }] }));
      const skills = topics.flatMap((t) => t.skills);
      return { id: ch.id, number: ch.number, title: ch.title, sealed: ci === 0, here: ci === 1, secure: skills.filter((s) => s.state === "secure").length, total: skills.length, topics };
    });
    return { subject, book: cur.book, chapters };
  });
  return { mode, hidden: false, subjects, skills: subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.flatMap((t) => t.skills))), empty: false };
}
const plan = (child) => ({
  state: "start", homeState: "default", plan: { openLesson: null, window: { from: "07:00", to: "20:30" } },
  topic: { id: child.class_level <= 4 ? "c3-maths-ch05-t01" : "c6-maths-ch05-t01", title: "Fractions as equal parts of a whole", shortTitle: "Fractions", chapter: "Fractions", subject: "maths", minutes: 15 },
  resume: null, today: null, capRemaining: 20, capMin: 30, usedMin: 10, opensAt: null, packReady: null, day: "2026-10-10", tz: "Asia/Kolkata",
  teacher: TEACHER, surfaces: { map: true, notebook: true, resume: true }, source: { dayPlan: null },
});

async function mockApi(page, kid) {
  await page.route("**/api/**", async (route) => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/face/config") return json(200, { puppet2d: true, visemes: true, rev: "r8", look: LOOK });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "parent@example.test", name: "Parent" }, children: kid ? [kid] : [] });
    if (p === "/api/child/plan") return json(200, plan(kid));
    if (p === "/api/child/map") return json(200, mapFor(kid));
    if (p === "/api/child/teacher") return json(200, { teacher: TEACHER, eligible: [TEACHER] });
    if (p === "/api/tutors" && req.method() === "GET") return json(200, { current: "asha", chosen: false, mode: "single", band: "b3", tutors: ["asha"], live: false, name: "Asha", characterName: "Asha", custom: false, suggestions: ["Asha"] });
    if (p === "/api/children" && req.method() === "PATCH") return json(200, { child: kid });
    if (p === "/api/parent/pin") return json(200, { hasPin: false });
    return json(404, { error: "unmocked" });
  });
}

// ───────── the page audit ─────────
async function audit(page) {
  const vw = page.viewportSize()?.width ?? 0;
  return page.evaluate(({ vw }) => {
    const out = { teachers: [], looks: [], names: [], choice: [], small: [], hscroll: 0 };
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    for (const el of document.querySelectorAll("[data-teacher-id], [data-tutor]")) out.teachers.push(el.getAttribute("data-teacher-id") ?? el.getAttribute("data-tutor"));
    for (const el of document.querySelectorAll(".fp-host")) out.looks.push(el.getAttribute("data-look"));
    const bad = /\b(arjun|uma)\b/i;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement, s = n.textContent.trim();
      if (!el || !s || el.closest("script, style")) continue;
      if (bad.test(s)) out.names.push(s.slice(0, 60));
      if (visible(el) && !el.closest("[aria-hidden='true']") && parseFloat(getComputedStyle(el).fontSize) < 14) out.small.push(`${Math.round(parseFloat(getComputedStyle(el).fontSize))}px "${s.slice(0, 30)}"`);
    }
    for (const el of document.querySelectorAll("[aria-label], [title], img[alt]")) {
      const s = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""} ${el.getAttribute("alt") ?? ""}`;
      if (bad.test(s)) out.names.push(`label: ${s.trim().slice(0, 60)}`);
    }
    for (const el of document.querySelectorAll("button, a[href], [role=button], [role=radio]")) {
      if (!visible(el)) continue;
      const s = `${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("data-testid") ?? ""}`;
      if (/choose|pick (a|your) teacher|change (the |your )?teacher|switch teacher|name your teacher|teacher-name|name-change|choose-/i.test(s)) out.choice.push(s.trim().slice(0, 60));
    }
    if (document.querySelector("[data-testid=teacher-namer]")) out.choice.push("the naming card is mounted");
    const el = document.scrollingElement;
    out.hscroll = Math.max(0, Math.max(el.scrollWidth, document.body.scrollWidth) - vw);
    return out;
  }, { vw });
}

const browser = await chromium.launch();
const pageErrors = [];
async function open(url, { w, h, kid = null, storage = {}, wait = 1600 }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 720 ? 2 : 1, hasTouch: w < 720, isMobile: w < 720, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(`${url}: ${e.message}`));
  await mockApi(page, kid);
  await page.addInitScript((s) => { if (sessionStorage.getItem("__seeded")) return; sessionStorage.setItem("__seeded", "1"); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(wait);
  return { ctx, page };
}

async function surface(name, url, opts, act) {
  for (const v of VIEWS) {
    const tag = `${name} ${v.w}x${v.h}`;
    const errs = pageErrors.length;
    const { ctx, page } = await open(url, { ...v, ...opts });
    if (act) await act(page).catch((e) => check(`${tag} reached the state`, false, e.message));
    await page.waitForTimeout(400);
    const a = await audit(page);
    const faces = a.teachers.filter(Boolean);
    check(`ONE ${tag}: a teacher is drawn and she is Asha`, (opts.faceless || faces.length > 0) && faces.every((id) => id === "asha"), faces.join(","));
    check(`ONE ${tag}: every puppet paints the ${LOOK} look`, a.looks.every((l) => l === LOOK), a.looks.join(","));
    check(`NAMES ${tag}: no Arjun or Uma`, a.names.length === 0, a.names.join(" | "));
    check(`CHOICE ${tag}: no teacher choice`, a.choice.length === 0, a.choice.join(" | "));
    check(`FIT ${tag}: no horizontal overflow`, a.hscroll <= 1, `${a.hscroll}px`);
    check(`FIT ${tag}: text ≥ 14 px`, a.small.length === 0, a.small.slice(0, 4).join(" | "));
    check(`ERR ${tag}: no page errors`, pageErrors.length === errs, pageErrors.slice(errs).join(" | "));
    // WebP (the repo keeps every shot): a PNG to a temp file, then ffmpeg → <name>.webp
    const png = path.join(os.tmpdir(), `r4-asha-shot-${process.pid}.png`);
    await page.screenshot({ path: png });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-c:v", "libwebp", "-quality", "80", path.join(SHOTS, `${name.replace(/[^\w-]+/g, "_")}__${v.w}x${v.h}.webp`)]);
    await ctx.close();
  }
}

const helloDone = (cid) => ({ [`taxila.child.${cid}.prefs`]: JSON.stringify({ hello: true }) });
try {
  // lesson surfaces: the Desk's own fixtures (face=live: the real puppet stage; the teacher is Asha for every band)
  for (const band of ["b2", "b3"]) {
    for (const fx of ["speaking", "your_turn", "work-speaking", "work-your_turn", "summary", "T1", "help"]) {
      await surface(`lesson-${fx}-${band}`, `/dev/desk?fixture=${fx}&band=${band}&face=live`, { wait: 2500 });
    }
  }
  for (const [fam, kid] of Object.entries(KIDS)) {
    await surface(`hello-${fam}`, `/c/${kid.id}/hello`, { kid });
    await surface(`home-${fam}`, `/c/${kid.id}`, { kid, storage: helloDone(kid.id) });
    await surface(`teacher-${fam}`, `/c/${kid.id}/teacher`, { kid, storage: helloDone(kid.id) });
    await surface(`map-sheet-${fam}`, `/c/${kid.id}/map`, { kid, storage: helloDone(kid.id) }, async (page) => {
      await page.locator("[data-testid=list-toggle]").click({ timeout: 4000 });
      await page.locator("[data-testid=map-list] .maplist-row").first().click({ timeout: 4000 });
      await page.waitForSelector("[data-testid=skill-sheet]", { timeout: 4000 });
    });
  }
  for (const cls of [3, 7]) {
    await surface(`onboarding-meet-c${cls}`, "/start/meet", { storage: { "tx.onboarding": JSON.stringify({ lang: "en", child: { classLevel: cls, board: "cbse" } }) } });
  }
  await surface("landing", "/", { wait: 2500 });
} finally {
  await browser.close();
  srv.kill();
}

const fail = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(SHOTS, "results.json"), JSON.stringify({ date: new Date().toISOString(), look: LOOK, pass: results.length - fail.length, fail: fail.length, results }, null, 2));
console.log(`\n${results.length - fail.length}/${results.length} checks passed (look ${LOOK}); shots in ${path.relative(ROOT, SHOTS)}`);
process.exit(fail.length ? 1 : 0);
