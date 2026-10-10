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
//   V-TGT       every visible control ≥ 48 px (Older, adult) / ≥ 64 px (Young; the 48 dp Grown-ups door excepted, §5.2)
//   V-PLAN      the home has ONE primary card in every plan state, incl. the plan API 404 / 500 / offline fallback;
//               no Start while the plan read is in flight; no "Continue" that starts a new lesson; offline makes no
//               offline-practice promise without a pack
//   V-MAP       Garden / Sky: empty state with an action; a sealed chapter shows its seal; "Your class is here"; List
//   V-ID-1      the child's teacher record on home, Hello, the map sheet and Your teacher (data-teacher-id)
//   V-PERF-1    art transferred per child route ≤ 350 KB; tier D (?tier=D) requests no background
//   V-ONB       each onboarding step opens at scrollY 0 with focus on its h1; class first → Meet shows that class's
//               teacher; promises before the account; English language tiles
//   V-MASTER    the build ships no master: /assets/gen/<master> is not served as an image; manifest.json is
//   V-ABS       absence invariance: the home after 1 vs 30 days away (clock AND last-visit device state) renders the
//               same text and the same primary-card pixels
//   V-CON       text contrast against the pixels under it (painted grounds included), ≥ 4.5 / 3 (large)
//   V-MOTION    with prefers-reduced-motion nothing loops; text follows the browser font size to 200 %; Bigger text grows
//   V-SHOT-B2   each shot vs its approved baseline (tests/visual/baselines/b2/, in-browser YIQ diff); SKIPPED, not
//               passed, while no human-approved baseline exists (`--update-baselines` writes them)
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
  kabir: { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", avatar: "rocket", interests: ["Football"] },
  neha: { id: "c-neha", first_name: "Neha", class_level: 2, board: "cbse", language_pref: "hindi", teacher_id: "asha", avatar: null, interests: ["Animals", "Drawing"] },
  dev: { id: "c-dev", first_name: "Dev", class_level: 7, board: "cbse", language_pref: "hinglish", teacher_id: "asha", avatar: null, interests: ["Space", "Trains"] },
};
const TEACHER = (id) => ({ id, name: "Asha", addressedAs: "Asha didi", role: "AI teacher",
  pronouns: { subject: "she", object: "her", possessive: "her" }, voice: "x", lookRev: 1, signatureColor: null });
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
      if (fx.planDelay) await new Promise((r) => setTimeout(r, fx.planDelay));
      if (fx.plan === 404 || fx.plan === 500) return json(fx.plan, { error: "not found" });
      return json(200, { ...planFor(child, fx.plan ?? "start"), ...(fx.hideSurfaces ? { surfaces: { map: false, notebook: false, resume: false } } : {}) });
    }
    if (p === "/api/child/map") return json(200, mapFor(child, fx.map ?? "mid"));
    if (p === "/api/tutors" && req.method() === "GET") {
      return json(200, { current: child.teacher_id, chosen: !!fx.chosen, mode: "single", band: "b3", tutors: ["asha"], live: !!fx.live });
    }
    if (p === "/api/tutors/choose") return json(200, { ok: true });
    if (p === "/api/lesson/summary") return json(200, { lessonId: url.searchParams.get("lessonId"), ended: true, did: { ...DID, title: `Lesson ${url.searchParams.get("lessonId")}` } });
    if (p === "/api/child/teacher") {
      const cl = Number(url.searchParams.get("classLevel"));
      return json(200, { teacher: TEACHER("asha"), eligible: [TEACHER("asha")] }); // one teacher for every class
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
  // the emulated device width (a mobile page that overflows zooms out, so innerWidth itself can grow to fit the overflow)
  const vw = page.viewportSize()?.width ?? 0;
  return page.evaluate(({ HINGLISH, young, vw }) => {
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
      // V-TGT (§11.5): every visible control ≥ 48 css px (Older, adult) / ≥ 64 (Young) on both sides. Exempt: inline
      // links inside running text, and the Young "Grown-ups" door, which §5.2 fixes at 48 dp on purpose (it must not
      // invite a child's tap).
      const r = el.getBoundingClientRect();
      const min = young && !el.matches(".cs-grownups") ? 64 : 48;
      if (!el.closest("p, li.me-hint, .t-note, summary") && (r.width < min - 0.5 || r.height < min - 0.5) && el.tagName !== "INPUT")
        out.tgt.push(`<${min} ${Math.round(r.width)}x${Math.round(r.height)} ${(el.innerText || el.getAttribute("aria-label") || el.tagName).slice(0, 30)}`);
    }
    // V-LAYOUT-2: an empty container taller than 48 px inside main
    const main = document.querySelector("main") ?? document.body;
    for (const el of main.querySelectorAll("div, section, aside, article, li")) {
      if (!visible(el) || el.closest("[aria-hidden='true'], .scene, [aria-busy='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 48) continue;
      const hasContent = (el.innerText ?? "").trim() || el.querySelector("img, svg, canvas, picture, video, input, textarea, button, a, [role=img]");
      if (!hasContent) out.dead.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.height)}px`);
      // …and a box > 120 px whose ONLY content is a placeholder (art fallback) with no words and no control: a
      // generic tile in an empty panel is still an empty panel (the B2 Garden finding)
      else if (r.height > 120 && !el.closest("[data-art-fallback]") && !(el.innerText ?? "").trim()) {
        const real = [...el.querySelectorAll("img, svg, canvas, picture, video, input, textarea, button, a, [role=img]")].filter((c) => !c.closest("[data-art-fallback]"));
        if (!real.length) out.dead.push(`fallback-only ${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.height)}px`);
      }
    }
    // …and nothing pushed off the side of the screen (a page with overflow hidden never scrolls, it just clips):
    // a visible text or control box that leaves the viewport, unless it sits in a sideways scroller (the Garden)
    for (const el of main.querySelectorAll("h1, h2, p, a, button, label, li, .hpc, .otile, .ptile")) {
      if (!visible(el) || el.closest("[aria-hidden='true'], .scene")) continue;
      let sc = el.parentElement, inScroller = false;
      for (; sc && sc !== document.body; sc = sc.parentElement) { const o = getComputedStyle(sc).overflowX; if (o === "auto" || o === "scroll") { inScroller = true; break; } }
      if (inScroller) continue;
      const r = el.getBoundingClientRect();
      if (r.right > Math.min(window.innerWidth, vw || window.innerWidth) + 1 || r.left < -1) out.dead.push(`offscreen ${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.left)}..${Math.round(r.right)}`.slice(0, 90));
    }
    out.lamps = document.querySelectorAll("[data-lamp]").length;
    out.hscroll = document.scrollingElement.scrollWidth > Math.min(window.innerWidth, vw || window.innerWidth) + 1;
    return out;
  }, { HINGLISH, young, vw });
}

function report(tag, a) {
  check(`V-EN-1 ${tag}`, a.en.length === 0, a.en.slice(0, 3).join(" | "));
  check(`V-NAME-1 ${tag}`, a.names.length === 0, a.names.slice(0, 2).join(" | "));
  check(`V-LAYOUT-2 ${tag}`, a.dead.length === 0 && !a.hscroll, [...a.dead.slice(0, 3), a.hscroll ? "horizontal scroll" : ""].filter(Boolean).join(" | "));
  check(`V-SIG-2 ${tag}`, a.lamps === 0, `${a.lamps} lamp(s)`);
  check(`V-TGT ${tag}`, a.tgt.length === 0, a.tgt.slice(0, 4).join(" | "));
}

// V-CON (WCAG 1.4.3 on the painted grounds): every visible text element against the pixels actually under it. The
// page is screenshotted with all text made transparent, so semi-transparent cards over a painting are measured as
// composited; per element the 20th-percentile contrast of its text colour against the pixels in its box must be ≥ 4.5
// (≥ 3 for large text: ≥ 24 px, or ≥ 18.66 px bold). Disabled controls are exempt (WCAG).
async function contrast(page) {
  const els = await page.evaluate(() => {
    const out = [];
    const all = document.querySelectorAll("body *");
    let k = 0;
    for (const el of all) {
      if (el.closest("svg, .scene, [aria-hidden='true'] .scene, script, style")) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      if (el.closest("[disabled], [aria-disabled='true'], .tx-sr")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
      el.setAttribute("data-con", String(k));
      out.push({ k: k++, color: cs.color, large: size >= 24 || (size >= 18.66 && weight >= 700), text: el.textContent.trim().slice(0, 30),
        x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top) });
    }
    return out;
  });
  if (!els.length) return [];
  const style = await page.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}" });
  await page.waitForTimeout(60);
  const png = (await page.screenshot({ fullPage: false })).toString("base64");
  await style.evaluate((n) => n.remove());
  return page.evaluate(async ({ png, els }) => {
    const parse = (c) => {
      let m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c);
      if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
      m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?/.exec(c);
      if (m) return [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255, m[4] === undefined ? 1 : Number(m[4])];
      return null;
    };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
    const bmp = await createImageBitmap(blob);
    const cv = new OffscreenCanvas(bmp.width, bmp.height);
    const cx = cv.getContext("2d");
    cx.drawImage(bmp, 0, 0);
    const dpr = bmp.width / innerWidth;
    const bad = [];
    for (const e of els) {
      const fg = parse(e.color);
      if (!fg || fg[3] < 0.05) continue;
      const x = Math.floor(e.x * dpr), y = Math.floor(e.y * dpr), w = Math.max(1, Math.floor(e.w * dpr)), h = Math.max(1, Math.floor(e.h * dpr));
      const d = cx.getImageData(x, y, Math.min(w, bmp.width - x), Math.min(h, bmp.height - y)).data;
      const step = Math.max(1, Math.floor(d.length / 4 / 600));
      const rs = [];
      for (let i = 0; i < d.length / 4; i += step) {
        const bg = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
        // the text colour composited over this pixel (a translucent ink-2 is lighter than its token)
        const c = [0, 1, 2].map((j) => fg[j] * fg[3] + bg[j] * (1 - fg[3]));
        rs.push(ratio(c, bg));
      }
      rs.sort((a, b) => a - b);
      const p20 = rs[Math.floor(rs.length * 0.2)] ?? 21;
      const need = e.large ? 3 : 4.5;
      if (p20 < need) bad.push(`${p20.toFixed(2)} < ${need} "${e.text}"`);
    }
    document.querySelectorAll("[data-con]").forEach((n) => n.removeAttribute("data-con"));
    return bad;
  }, { png, els });
}

// V-MOTION (§11, §9.1): with prefers-reduced-motion, no CSS animation or transition is left running on the page
async function runningMotion(page) {
  return page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().duration ?? 0) > 0 &&
    a.effect.getTiming().iterations === Infinity).map((a) => `${a.animationName ?? a.transitionProperty ?? "anim"} on ${a.effect?.target?.className ?? "?"}`.slice(0, 80)));
}

// V-SHOT-B2 (§13.2): each shot against its approved baseline in tests/visual/baselines/b2/, compared IN THE BROWSER
// (OffscreenCanvas, no new dependency): per-pixel YIQ ΔE ≤ 0.1, mismatch ≤ 0.5 %. The first baselines are approved by
// a human (`--update-baselines` copies the current shots there); until then each comparison is SKIPPED, never passed.
const BASELINES = `${ROOT}tests/visual/baselines/b2`;
const UPDATE_BASELINES = process.argv.includes("--update-baselines");
const shotDiffs = [];
async function diffShot(page, name) {
  const cur = path.join(SHOTS, `${name}.png`);
  const base = path.join(BASELINES, `${name}.png`);
  if (UPDATE_BASELINES) { fs.mkdirSync(BASELINES, { recursive: true }); fs.copyFileSync(cur, base); return; }
  if (!fs.existsSync(base)) { shotDiffs.push({ name, status: "no-baseline" }); return; }
  const r = await page.evaluate(async ({ a, b }) => {
    const load = async (s) => createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
    const [A, B] = await Promise.all([load(a), load(b)]);
    if (A.width !== B.width || A.height !== B.height) return { ratio: 1, size: true };
    const px = (bm) => { const c = new OffscreenCanvas(bm.width, bm.height).getContext("2d"); c.drawImage(bm, 0, 0); return c.getImageData(0, 0, bm.width, bm.height).data; };
    const da = px(A), db = px(B);
    const yiq = (r, g, bb) => [0.29889531 * r + 0.58662247 * g + 0.11448223 * bb, 0.59597799 * r - 0.2741761 * g - 0.32180189 * bb, 0.21147017 * r - 0.52261711 * g + 0.31114694 * bb];
    let bad = 0;
    const MAX = 35215; // the YIQ ΔE² range (pixelmatch's normalisation)
    for (let i = 0; i < da.length; i += 4) {
      const [y1, i1, q1] = yiq(da[i], da[i + 1], da[i + 2]), [y2, i2, q2] = yiq(db[i], db[i + 1], db[i + 2]);
      const d = 0.5053 * (y1 - y2) ** 2 + 0.299 * (i1 - i2) ** 2 + 0.1957 * (q1 - q2) ** 2;
      if (d / MAX > 0.1 * 0.1) bad++;
    }
    return { ratio: bad / (da.length / 4) };
  }, { a: fs.readFileSync(cur).toString("base64"), b: fs.readFileSync(base).toString("base64") });
  shotDiffs.push({ name, status: r.ratio <= 0.005 ? "pass" : "fail", ratio: r.ratio });
  check(`V-SHOT-B2 ${name}`, r.ratio <= 0.005, `${(r.ratio * 100).toFixed(2)} % of pixels differ${r.size ? " (size)" : ""}`);
}

// ───────────────────────────── run ─────────────────────────────
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const VIEWS = QUICK ? [{ w: 360, h: 640 }] : [{ w: 360, h: 640 }, { w: 1280, h: 800 }];

async function open(fx, url, { w, h, theme = "light", offline = false, motion = "no-preference", wait = 900 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: w < 720 ? 2 : 1, hasTouch: w < 720, isMobile: w < 720, colorScheme: theme,
    serviceWorkers: "block", reducedMotion: motion,
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
  // seed storage once per context (not on every navigation: a reload must see what the page itself wrote)
  if (fx.storage) await page.addInitScript((s) => { if (sessionStorage.getItem("__seeded")) return; sessionStorage.setItem("__seeded", "1"); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, fx.storage);
  // the browser / OS font size (what a 200 % accessibility setting does): the root font size, applied as the page loads
  if (fx.fontScale) await page.addInitScript((f) => { const set = () => document.documentElement?.style.setProperty("font-size", `${f * 100}%`); set(); document.addEventListener("DOMContentLoaded", set); }, fx.fontScale);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(wait);
  // offline: the app is up (the cached shell) and the link drops; the home re-reads on the `offline` event
  if (offline) { await ctx.setOffline(true).catch(() => {}); await page.waitForTimeout(700); }
  return { ctx, page, art, calls };
}
const shot = async (page, name) => { await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }); await diffShot(page, name); };

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
    // "resume" is shown as "start" until the lesson route can resume by id (src/child/plan.ts RESUME_BY_ID)
    const expect = typeof st === "number" || st === "resume" ? "start" : st;
    const needsAction = ["start", "first", "done", "offline"].includes(expect);
    check(`V-PLAN ${tag}`, info.cards === 1 && info.state === expect && info.text.length > 3 && (!needsAction || info.action), `${info.state}/${info.source} "${info.text.slice(0, 50)}"`);
    if (typeof st === "number") check(`V-PLAN fallback start link ${tag}`, await page.locator("[data-testid=start-lesson]").count() === 1);
    if (st === "resume") check(`V-PLAN no "Continue" that would start a new lesson ${tag}`, (await page.locator("[data-testid=continue-lesson]").count()) === 0 && !/Continue/.test(info.text), info.text.slice(0, 40));
    if (st === "offline") {
      // no offline pack exists (packReady null): no "Practice works offline" promise, no Practice / Ask tile to fail
      check(`V-PLAN offline makes no offline-practice promise ${tag}`, !/works offline/i.test(info.text), info.text);
      check(`V-PLAN offline offers no Practice / Ask ${tag}`, (await page.locator("[data-testid=tile-practice], [data-testid=tile-ask]").count()) === 0);
    }
    const aria = await page.evaluate(() => { const c = document.querySelector("[data-testid=primary-card]"); const id = c?.getAttribute("aria-labelledby"); return { id, name: id ? document.getElementById(id)?.textContent : null, label: c?.getAttribute("aria-label") }; });
    check(`card region named by its own heading ${tag}`, !!aria.name && !aria.label && info.text.startsWith(aria.name.slice(0, 8)), JSON.stringify(aria));
    if (["start", "done", "offline", 404].includes(st)) { const bad = await contrast(page); check(`V-CON ${tag}`, bad.length === 0, bad.slice(0, 3).join(" | ")); }
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
  // V-ABS (B2-A6, absence invariance): the SAME server plan, but a device whose last visit was 1 vs 30 days ago: the
  // clock differs AND the device state the home can read differs (the cached plan's day, yesterday's finished-lesson
  // marker vs a month-old one, the Notebook's last artefact date). The home's text and its pixels must match.
  // Limits, said plainly: her greeting line (the one thing allowed to differ) is not built, and the server plan is
  // mocked, so this proves the CLIENT adds no absence signal; the server half is B2-A1's API test.
  const texts = [];
  const pngs = [];
  for (const days of [1, 30]) {
    const c2 = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const p2 = await c2.newPage();
    const now = Date.UTC(2026, 9, 3 + days, 4, 0);
    const last = new Date(now - days * 86400e3).toISOString().slice(0, 10);
    await p2.clock.setFixedTime(new Date(now));
    await mockApi(p2, { children: [child], plan: "start" });
    await p2.addInitScript(({ s, cid, last, at }) => {
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
      localStorage.setItem(`taxila.child.${cid}.plan`, JSON.stringify({ topic: null, surfaces: { map: true, notebook: true, resume: true }, day: last }));
      localStorage.setItem(`taxila.child.${cid}.day`, JSON.stringify({ day: last, done: true, lessonId: "L-last" }));
      localStorage.setItem(`taxila.child.${cid}.artefacts`, JSON.stringify([{ lessonId: "L-last", topic: "Fractions", chips: [], at }]));
    }, { s: helloDone(child.id), cid: child.id, last, at: now - days * 86400e3 });
    await p2.goto(`${BASE}/c/${child.id}`);
    await p2.waitForFunction(() => document.querySelector("[data-plan-source]")?.getAttribute("data-plan-source") === "server", null, { timeout: 8000 }).catch(() => {});
    await p2.waitForTimeout(400);
    texts.push(await p2.locator("main").innerText());
    pngs.push((await p2.locator("[data-testid=primary-card]").screenshot()).toString("base64"));
    await c2.close();
  }
  check("V-ABS home text after 1 vs 30 days away is the same", texts[0] === texts[1], texts[0] === texts[1] ? "" : `${texts[0].slice(0, 60)} ≠ ${texts[1].slice(0, 60)}`);
  check("V-ABS primary card pixels after 1 vs 30 days away are the same", pngs[0] === pngs[1]);
  // negative control: the comparator must see a one-word difference ("We missed you" is exactly what is banned)
  check("negative control V-ABS trips on an absence line", texts[0] !== `${texts[0]}\nWe missed you`);
  const { ctx: c3, page: p3 } = await open({ children: [CHILDREN.dev], plan: "first" }, `/c/${CHILDREN.dev.id}`, VIEWS[0]);
  await p3.waitForSelector("[data-testid=hello]", { timeout: 8000 }).catch(() => {});
  check("Later never skips Hello: a never-met child lands on Hello", p3.url().endsWith("/hello"), p3.url());
  await c3.close();
  const { ctx: c4, page: p4 } = await open({ children: [CHILDREN.riya], plan: "start", hideSurfaces: true, storage: helloDone(CHILDREN.riya.id) }, `/c/${CHILDREN.riya.id}`, VIEWS[0]);
  await p4.waitForTimeout(500);
  check("Only this session: no Garden / Notebook tiles", await p4.locator("[data-testid=tile-garden], [data-testid=tile-notebook]").count() === 0);
  await c4.close();
}

// HOME first paint: while the plan read is in flight there is NO Start (the server may answer capped / resting / done)
for (const who of ["riya", "kabir"]) {
  const child = CHILDREN[who];
  for (const st of ["capped", "resting", "done"]) {
    const { ctx, page } = await open({ children: [child], plan: st, planDelay: 3000, storage: helloDone(child.id) }, `/c/${child.id}`, { ...VIEWS[0], wait: 1200 });
    const tag = `${who} ${st}`;
    const early = await page.evaluate(() => ({ starts: document.querySelectorAll("[data-testid=start-lesson], [data-testid=continue-lesson]").length,
      practice: document.querySelectorAll("[data-testid=tile-practice]").length, busy: document.querySelector("[data-testid=primary-card]")?.getAttribute("aria-busy"),
      state: document.querySelector("[data-plan-state]")?.getAttribute("data-plan-state"), text: document.querySelector("[data-testid=primary-card]")?.innerText ?? "" }));
    check(`V-PLAN loading: no Start before the plan answers ${tag}`, early.starts === 0 && early.practice === 0 && early.busy === "true" && early.state === "loading", JSON.stringify(early));
    if (st === "capped") await shot(page, `home__loading__${child.class_level <= 4 ? "b2" : "b3"}__360__light`);
    await page.waitForFunction((s) => document.querySelector("[data-plan-state]")?.getAttribute("data-plan-state") === s, st, { timeout: 8000 }).catch(() => {});
    check(`V-PLAN after the answer ${tag}`, (await page.locator("[data-testid=start-lesson]").count()) === 0 && (await page.getAttribute("[data-plan-state]", "data-plan-state")) === st);
    if (who === "kabir" && st === "capped") {
      // negative control: a Start link inside the loading card must trip the loading check
      const { ctx: c2, page: p2 } = await open({ children: [child], plan: st, planDelay: 3000, storage: helloDone(child.id) }, `/c/${child.id}`, { ...VIEWS[0], wait: 1200 });
      await p2.evaluate(() => { const a = document.createElement("a"); a.href = "#"; a.setAttribute("data-testid", "start-lesson"); a.textContent = "Start"; document.querySelector("[data-testid=primary-card]")?.appendChild(a); });
      check("negative control V-PLAN loading trips on a Start link", (await p2.locator("[data-testid=start-lesson]").count()) > 0);
      await c2.close();
    }
    await ctx.close();
  }
}

// TEXT SIZE (§11.7: to 200 % outside the lesson; Me → Bigger text) and REDUCED MOTION
{
  const child = CHILDREN.kabir;
  const size = async (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }, sel);
  const base = await open({ children: [child], plan: "start", storage: helloDone(child.id) }, `/c/${child.id}`, VIEWS[0]);
  await base.page.waitForSelector(".hpc-head", { timeout: 8000 }).catch(() => {});
  const head0 = await size(base.page, ".hpc-head"), tile0 = await size(base.page, ".otile");
  await base.ctx.close();
  const big = await open({ children: [child], plan: "start", storage: { [`taxila.child.${child.id}.prefs`]: JSON.stringify({ hello: true, largeText: true }) } }, `/c/${child.id}`, VIEWS[0]);
  await big.page.waitForSelector(".hpc-head", { timeout: 8000 }).catch(() => {});
  const head1 = await size(big.page, ".hpc-head"), tile1 = await size(big.page, ".otile");
  check("Bigger text makes home text BIGGER (no custom-property cycle)", head1 > head0 + 2 && tile1 > tile0 + 2, `title ${head0}→${head1} px, tile ${tile0}→${tile1} px`);
  report("home kabir bigger-text 360", await audit(big.page, { young: false }));
  await shot(big.page, "home__bigger-text__b3__360__light");
  await big.ctx.close();
  // Me: the switch itself changes the computed size of Me's own rows
  const me = await open({ children: [child], plan: "start", storage: helloDone(child.id) }, `/c/${child.id}/me`, VIEWS[0]);
  await me.page.waitForSelector("[data-testid=me]", { timeout: 8000 }).catch(() => {});
  const lab0 = await size(me.page, ".me-label");
  await me.page.locator("[data-testid=switch-bigtext]").click().catch(() => {});
  await me.page.waitForTimeout(200);
  const lab1 = await size(me.page, ".me-label");
  check("Me → Bigger text grows Me's rows", lab1 > lab0 + 2, `${lab0}→${lab1} px`);
  await me.ctx.close();
  for (const who of ["kabir", "riya"]) {
    const c = CHILDREN[who];
    for (const route of ["", "/map", "/notebook", "/me"]) {
      const r200 = await open({ children: [c], plan: "start", fontScale: 2, storage: helloDone(c.id) }, `/c/${c.id}${route}`, VIEWS[0]);
      await r200.page.waitForTimeout(400);
      const tag = `${who} ${route || "/"} 200%`;
      if (!route) {
        const h = await size(r200.page, ".hpc-head");
        const ref = who === "kabir" ? head0 : 24;
        check(`text follows the browser font size to 200 % ${tag}`, h >= ref * 1.9, `${h} px vs ${ref} px at 100 %`);
      }
      const a = await audit(r200.page, { young: c.class_level <= 4 });
      check(`200 %: no horizontal scroll, nothing clipped off-screen ${tag}`, !a.hscroll && !a.dead.some((x) => x.startsWith("offscreen")), a.dead.filter((x) => x.startsWith("offscreen")).slice(0, 3).join(" | "));
      check(`200 %: top bar items do not overlap ${tag}`, await r200.page.evaluate(() => {
        const els = [...document.querySelectorAll(".cs-top > *")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
        return els.every((a, i) => els.every((b, j) => j <= i || a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1));
      }));
      check(`200 %: names intact ${tag}`, a.names.length === 0, a.names.slice(0, 2).join(" | "));
      await shot(r200.page, `${route ? route.slice(1) : "home"}__text-200__${c.class_level <= 4 ? "b2" : "b3"}__360__light`);
      await r200.ctx.close();
    }
    for (const route of ["", "/map", "/notebook"]) {
      const rm = await open({ children: [c], plan: "start", storage: helloDone(c.id) }, `/c/${c.id}${route}`, { ...VIEWS[0], motion: "reduce" });
      await rm.page.waitForTimeout(500);
      const run = await runningMotion(rm.page);
      const flag = await rm.page.evaluate(() => document.documentElement.getAttribute("data-motion"));
      check(`V-MOTION reduced motion: nothing loops ${who} ${route || "/"}`, run.length === 0 && flag === "reduce", `${flag} ${run.slice(0, 3).join(" | ")}`);
      await rm.ctx.close();
    }
  }
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
      check(`V-MAP garden marks the class's chapter ${tag}`, (await page.locator(".bed[data-here] [data-testid=garden-here]").count()) >= 1);
      // the first bed fills the panel: signboard → raised bed → bottom, no hollow band, seal not clipped by the edge
      const g = await page.evaluate(() => {
        const sc = document.querySelector(".garden-scroll").getBoundingClientRect();
        const bed = document.querySelector(".bed"), box = bed.querySelector(".bed-box").getBoundingClientRect(), head = bed.querySelector(".bed-head").getBoundingClientRect();
        const seal = bed.querySelector(".bed-seal")?.getBoundingClientRect();
        return { gap: box.top - head.bottom, bottom: sc.bottom - box.bottom, share: box.height / sc.height, sealIn: !seal || (seal.left >= sc.left && seal.right <= sc.right) };
      });
      check(`V-MAP garden bed fills the panel ${tag}`, g.gap <= 8 && g.bottom <= 24 && g.share >= 0.45 && g.sealIn, JSON.stringify(g));
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
    check(`top bar on one row at 100 % text ${tag}`, await page.evaluate(() => { const t = [...document.querySelectorAll(".cs-top > *")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0); return Math.max(...t.map((r) => r.top)) - Math.min(...t.map((r) => r.top)) < 24; }));
    if (kind === "mid") { const bad = await contrast(page); check(`V-CON ${tag}`, bad.length === 0, bad.slice(0, 3).join(" | ")); }
    await shot(page, `map__${kind}__${young ? "b2" : "b3"}__${v.w}__${theme}`);
    if (young && kind === "mid" && v.w === 360) {
      // the class's chapter, two beds along: its flag inside the visible bed
      await page.locator(".garden-arrow--right").click(); await page.waitForTimeout(450);
      await page.locator(".garden-arrow--right").click(); await page.waitForTimeout(450);
      const vis = await page.evaluate(() => { const f = document.querySelector("[data-testid=garden-here]")?.getBoundingClientRect(); const sc = document.querySelector(".garden-scroll").getBoundingClientRect(); return !!f && f.left >= sc.left && f.right <= sc.right; });
      check(`V-MAP garden: the class flag is in view on its bed ${tag}`, vis);
      await shot(page, `map__mid-here__b2__360__light`);
      await page.locator(".garden-arrow--left").click(); await page.locator(".garden-arrow--left").click(); await page.waitForTimeout(450);
    }
    if (kind === "mid") {
      // tap a plant / star → the sheet (phone) or the side panel (1280 Older)
      await page.locator(young ? ".plant-btn" : ".sky-star").first().click().catch(() => {});
      await page.waitForTimeout(500);
      const sheet = page.locator("[data-testid=skill-sheet]");
      check(`V-MAP tapped sheet ${tag}`, await sheet.count() >= 1);
      const ids = await page.locator("[data-testid=skill-sheet] [data-teacher-id], [data-testid=skill-sheet] [data-art^='teacher/']").evaluateAll((els) => els.map((e) => e.getAttribute("data-teacher-id") ?? e.getAttribute("data-art")));
      check(`V-ID-1 map sheet ${tag}`, ids.some((x) => x?.includes(child.teacher_id)), ids.join(","));
      const lab = await page.locator("[data-testid=skill-sheet] .teacher-label").first();
      check(`map sheet shows the visible "{T} · AI teacher" label ${tag}`, (await lab.isVisible().catch(() => false)) && /· AI teacher$/.test(await lab.innerText().catch(() => "")));
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
        const { ctx, page, calls } = await open({ children: [child], plan: "start", storage }, `/c/${child.id}/notebook`, { ...v, theme });
        await page.waitForSelector(pages ? "[data-testid=notebook-page]" : "[data-testid=notebook-empty]", { timeout: 8000 }).catch(() => {});
        const tag = `notebook ${who} ${pages} ${v.w} ${theme}`;
        check(`notebook ${pages ? "pages" : "empty"} ${tag}`, pages ? (await page.locator("[data-testid=notebook-page]").count()) === 3 : (await page.locator("[data-testid=notebook-empty]").count()) === 1);
        if (!pages) check(`notebook empty line is true on any device (plan is not "first") ${tag}`, !/after your first lesson/.test(await page.locator("[data-testid=notebook-empty]").innerText()));
        if (pages && v.w === 360 && theme === "light") {
          const n0 = calls.filter((c) => c.includes("/api/lesson/summary")).length;
          await page.reload(); await page.waitForSelector("[data-testid=notebook-page]", { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(500);
          const n1 = calls.filter((c) => c.includes("/api/lesson/summary")).length - n0;
          check(`notebook summaries fetched once, not on every open ${tag}`, n0 === 3 && n1 === 0 && (await page.locator("[data-testid=notebook-page]").count()) === 3, `first open ${n0}, reopen ${n1}`);
          const bad = await contrast(page); check(`V-CON ${tag}`, bad.length === 0, bad.slice(0, 3).join(" | "));
        }
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
      {
        // ONE teacher (dc-r4-single-teacher-asha): her card only, nothing to choose, for every child
        const { ctx, page } = await open({ children: [child], plan: "start", tutors: 1, storage: helloDone(child.id) }, `/c/${child.id}/teacher`, { ...v, theme });
        await page.waitForSelector(".tc-one", { timeout: 8000 }).catch(() => {});
        const tag = `teacher ${who} ${v.w} ${theme}`;
        const ids = await page.locator("[data-teacher-id]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("data-teacher-id")))]);
        check(`V-ID-1 your teacher ${tag}`, ids.length === 1 && ids[0] === "asha", ids.join(","));
        check(`no choice ${tag}`, (await page.locator("[data-testid^=choose-], [data-testid=name-change], .tc-grid").count()) === 0);
        report(tag, await audit(page, { young }));
        await shot(page, `teacher__one__${b}__${v.w}__${theme}`);
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
    // Asha's greeting clip exists in every family language: every child gets "Tap to hear" (one teacher, round 4)
    check(`hello card 1 audio ${tag}`, (await page.locator("[data-testid=hello-hear]").innerText()).startsWith("Tap to hear"));
    report(`${tag} c1`, await audit(page, { young }));
    await shot(page, `hello__1-greeting__${b}__${v.w}__light`);
    await page.locator("[data-testid=hello-hear]").click();
    await page.locator("text=Next").first().click({ timeout: 2500 }).catch(() => {});
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
    // ONE teacher (round 4): no teacher card and no naming card; "That's right" goes straight into lesson 1
    await page.locator("[data-testid=hello-right]").click();
    await page.waitForURL(/\/lesson\/new/, { timeout: 5000 }).catch(() => {});
    check(`hello: no teacher or naming card, straight into lesson 1 ${tag}`, /\/lesson\/new/.test(page.url()), page.url());
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
  check(`V-ONB meet shows the class's teacher (class 6 → Asha, the one teacher) ${tag}`, st.teacher === "asha" && /Asha/.test(st.h1 ?? ""), `${st.teacher} "${st.h1}"`);
  check(`V-ONB page title follows the step ${tag}`, /Asha/.test(st.title), st.title);
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
  check(`V-ONB promises name the teacher ${tag}`, /Asha is an AI and says so/.test(await page.locator("main").innerText()));
  check(`V-ONB promise pronoun agrees (she tells … she's) ${tag}`, /She tells your child she's a computer teacher/.test(await page.locator("main").innerText()));
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
  await page.evaluate(() => {
    const m = document.querySelector("main");
    const b = document.createElement("button"); b.textContent = "x"; b.className = "neg-46"; b.style.cssText = "width:120px;height:46px;min-height:0"; m.appendChild(b);
    const f = document.createElement("div"); f.style.cssText = "height:200px"; f.innerHTML = '<span data-art-fallback=""><svg width="60" height="60"></svg></span>'; m.appendChild(f);
    const c = document.createElement("p"); c.textContent = "Faint words"; c.style.cssText = "color:#d8d8d8;background:#ffffff;font-size:16px;position:relative;z-index:9"; m.prepend(c);
  });
  const a2 = await audit(page, { young: false });
  check("negative control V-TGT trips on a 46 px button (Older bar 48)", a2.tgt.some((x) => x.includes("x46")));
  check("negative control V-LAYOUT-2 trips on a box holding only a placeholder", a2.dead.some((x) => x.startsWith("fallback-only")));
  const con = await contrast(page);
  check("negative control V-CON trips on light-grey text on white", con.some((x) => x.includes("Faint words")));
  check("negative control V-EN-1 trips on 'Abhyaas'", a.en.length > 0);
  check("negative control V-LAYOUT-2 trips on an empty 120 px box", a.dead.length > 0);
  check("negative control V-NAME-1 trips on a nameless button", a.names.length > 0);
  check("negative control V-SIG-2 trips on a stray [data-lamp]", a.lamps > 0);
  check("negative control horizontal scroll trips", a.hscroll);
  await ctx.close();
  // Young bar 64: a 60 px tile must trip
  const y = await open({ children: [CHILDREN.riya], plan: "start", storage: helloDone(CHILDREN.riya.id) }, `/c/${CHILDREN.riya.id}`, VIEWS[0]);
  await y.page.waitForSelector("[data-testid=primary-card]", { timeout: 8000 }).catch(() => {});
  await y.page.evaluate(() => { const b = document.createElement("button"); b.textContent = "y"; b.style.cssText = "width:120px;height:60px;min-height:0"; document.querySelector("main").appendChild(b); });
  check("negative control V-TGT trips on a 60 px Young control (bar 64)", (await audit(y.page, { young: true })).tgt.some((x) => x.includes("x60")));
  // a paragraph pushed past the right edge (what overflow-hidden large text did before the fix) must trip
  await y.page.evaluate(() => { const o = document.createElement("p"); o.textContent = "off the edge"; o.style.cssText = "position:relative;left:300px;width:200px"; document.querySelector("main").appendChild(o); });
  check("negative control off-screen clip trips", (await audit(y.page, { young: true })).dead.some((x) => x.startsWith("offscreen")));
  await y.ctx.close();
}

await browser.close();
srv.kill();
const failed = results.filter((r) => !r.ok);
const noBase = shotDiffs.filter((d) => d.status === "no-baseline").length;
if (!UPDATE_BASELINES) console.log(noBase ? `V-SHOT-B2: SKIPPED for ${noBase} shot(s): no approved baseline in tests/visual/baselines/b2/ (a human approves the first set with --update-baselines)` : "V-SHOT-B2: every shot compared against its baseline");
fs.writeFileSync(path.join(SHOTS, "checks.json"), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed: failed.length,
  shotBaselines: { compared: shotDiffs.filter((d) => d.status !== "no-baseline").length, skippedNoBaseline: noBase }, results }, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `; FAILED: ${failed.map((f) => f.name).slice(0, 20).join("; ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
