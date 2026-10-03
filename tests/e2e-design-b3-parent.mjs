// PRODUCT-DESIGN-V2 §14 B3 (workstream b3-parent): the Playwright battery for the parent corner, on the SHIPPED build.
// Standalone (needs Chromium; not part of `npm test`):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-b3-parent.mjs [--dist <built SPA>] [--shots <dir>] [--quick]
//
// It builds the production SPA (vite build → a temp dir, NO dev routes) unless --dist is given, serves it with
// server/serve.mjs on a spare port, and mocks every /api/* call with page.route (fixtures below), so what runs is the
// real Gate, Shell, Home, evidence sheet, Progress, Lessons, Lesson card, Notes, Controls, Children, Data and privacy,
// Help and safety, Change PIN, and the sign-in step's ?next=. Checks (each with a negative control that must trip it):
//   V-SIG-2   0 [data-lamp] and no lamp colour on any parent route (the parent never sees turn colour)
//   V-EN-1    English chrome: no Devanagari and no Hinglish chrome word outside [data-speech]
//   V-NAME-1  every button / link / input has an accessible name
//   V-LAYOUT-2 no empty container > 48 px, nothing off screen, no horizontal scroll; no entry to an unbuilt page
//   V-TGT     every visible control ≥ 48 px (inline links in running text exempt)
//   V-CLAIM   G-PARENT-1 on screen: a "Still practising" the rows do not support is NOT rendered (the audit case); the
//             headline's state equals the evidence sheet's state
//   V-ERR     raw server strings never reach a parent; field errors sit on their field (aria-describedby)
//   V-PIN     at 360 nothing overlays the PinPad (gate, Change PIN, the conversation re-check): every key is hit-testable
//   V-FOOT    no floating save bar; the bottom bar never covers content (Controls with a changed group)
//   V-GATE    wrong PIN (shake + words), cool-off, reset pending, re-lock wording
//   V-DEL     account deletion: password → confirmation → 2 s hold → receipt; the request carries confirm + password
//   V-NEXT    sign-in ?next=: sign-in is the default, field errors in sentences, and it returns to ?next=; a fresh SIGNUP
//             with ?next= goes to consent first
//   V-SAFE    (fixer) the alert card shows only for a released notice; a held child shows nothing; Help never promises
//             a message the product does not send; a deferred deletion is a sentence and nothing is deleted
//   V-ONE     (fixer) one state and one name per skill on a page: Try at home never says "practising" of the
//             headline's can_now skill; headline label == sheet title == Progress / Lesson card label
//   V-HONEST  (fixer) the receipt says what is kept; the Lesson card never shows the model-written parent_note;
//             Progress makes no /api/parent/overview call
// This battery MOCKS /api/*: it proves layout and what the screen does with a payload. Whether the payload itself is
// right (headline vs evidence state, alert release, erasure deferral) is proven against real Postgres through the
// router in tests/account-delete-db.run.mjs.
//   V-TIME    times in local 12-hour form ("6:42 pm"), never UTC ISO
//   V-FOCUS   each screen opens at scrollY 0 with focus on its h1
//   V-CON     text contrast against the pixels under it, light and dark
// Shots: 360x640 (DPR 2, touch) and 1280x800, light and dark, into docs/design/build/b3-parent/.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const QUICK = process.argv.includes("--quick");
const SHOTS = arg("--shots", `${ROOT}docs/design/build/b3-parent`);
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
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-b3p-dist-"));
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
const NOW = Date.now();
const ago = (d) => new Date(NOW - d * 86400_000).toISOString();
const RIYA = { id: "c-riya", first_name: "Riya", class_level: 5, board: "cbse", school_medium: "english", language_pref: "hinglish", teacher_id: "arjun", avatar: "red-panda", interests: ["Cricket"] };
const KABIR = { id: "c-kabir", first_name: "Kabir", class_level: 8, board: "cbse", school_medium: "english", language_pref: "english", teacher_id: "arjun", avatar: "rocket", interests: [] };
const SK_CAN = "c5-maths-ch01-t01-s1", SK_PRACT = "c5-maths-ch02-t01-s1";
const ROW = (d, outcome, hints = 0) => ({ at: ago(d), outcome, hintsUsed: hints });
const claim = (kind, skillId, level, rows, extra = {}) => ({ kind, skillId, title: kind === "can_now" ? "Read and write 5- and 6-digit numbers" : "Fractions of a group",
  label: kind === "can_now" ? "read and write 5- and 6-digit numbers" : "fractions of a group", level, key: ["unseen", "practising", "learned_today", "mastered"][level],
  recheck: false, nextReview: level >= 2 ? ago(-3) : null, lastSeen: ago(1), misconception: null, rows, ...extra });
const CAN = claim("can_now", SK_CAN, 2, [ROW(1, "correct"), ROW(1.1, "correct"), ROW(4, "incorrect")]);
const PRACT = claim("practising", SK_PRACT, 1, [ROW(1, "incorrect"), ROW(2, "partial", 1), ROW(2.1, "correct")]);
/** The production audit case: the server (pre-B3) named a skill "still tricky" over one right-on-their-own answer. */
const AUDIT_PRACT = claim("practising", SK_PRACT, 1, [ROW(0.1, "correct")]);
const CONTROLS = { dailyMinutes: 30, hoursStart: "07:00", hoursEnd: "20:30", captionsAlways: false, comfortMode: false, address: "aap", reportChannel: "whatsapp", saved: true };

function overview(kind) {
  const base = {
    child: { id: RIYA.id, firstName: "Riya", classLevel: 5, board: "cbse", schoolMedium: "english", languagePref: "hinglish", avatar: "red-panda" },
    headline: { kind: "claims", canNow: CAN, practising: PRACT, firstTopic: { id: "c5-maths-ch01-t01", title: "Numbers in thousands and beyond" }, profileKept: true },
    // the letter's activity names the PRACTISING skill (same state as the headline). Naming the can_now skill is the
    // contradiction the server now replaces with the generic line (fixture "contradiction" = the pre-fix payload).
    tryAtHome: { text: "At home: Riya has been practising ‘fractions of a group’. With rotis, ask Riya to show you how it works, then name one step Riya did. If it goes wrong, ask what Riya tried and what to try next.",
      claimId: "home:home.skill:0123456789", skillId: SK_PRACT, cadence: "weekly", period: "2026-W40", pictures: ["home/roti"] },
    next: { state: "start", topic: { title: "Fractions as equal parts of a whole", shortTitle: "Fractions: equal parts" }, window: { from: "07:00", to: "20:30" }, minutes: 25 },
    alert: null, held: false, week: { lessons: 2, minutes: 38 },
    recent: [
      { id: "L1", topic: { id: "c5-maths-ch01-t01", title: "Numbers in thousands and beyond", shortTitle: "Big numbers" }, startedAt: ago(1), minutes: 22 },
      { id: "L2", topic: { id: "c5-maths-ch02-t01", title: "Fractions of a group", shortTitle: "Fractions of a group" }, startedAt: ago(2), minutes: 16 },
    ],
    skills: [CAN, PRACT].map(({ rows, kind, ...s }) => s), controls: CONTROLS, updatedAt: new Date(NOW).toISOString(),
  };
  const h = (o) => ({ ...base, headline: { ...base.headline, canNow: null, practising: null, ...o } });
  switch (kind) {
    case "none": return { ...h({ kind: "none" }), tryAtHome: null, recent: [], week: { lessons: 0, minutes: 0 } };
    case "first": return { ...h({ kind: "first" }), tryAtHome: null, week: { lessons: 1, minutes: 9 } };
    case "too_early": return { ...h({ kind: "too_early" }), tryAtHome: null };
    case "quiet": return h({ kind: "quiet" });
    case "audit": return h({ kind: "claims", practising: AUDIT_PRACT });
    // a notice the protocol released (outbox row sent): the hold is over, the card shows above the week
    case "alert": return { ...base, alert: { at: ago(0.2) } };
    // a safety hold with nothing released: the home says only "No new note right now." and shows no card
    case "held": return { ...h({ kind: "held" }), alert: null, held: true, tryAtHome: null };
    case "contradiction": return { ...base, tryAtHome: { ...base.tryAtHome, skillId: SK_CAN,
      text: "At home: Riya has been practising ‘read and write 5- and 6-digit numbers’. With coins, ask Riya to show you how it works." } };
    case "generic": return { ...base, tryAtHome: { text: "At home: ask Riya what they would like to learn about next, and listen to the answer.", claimId: null, skillId: null,
      generic: true, cadence: "weekly", period: "2026-W40", pictures: [] } };
    case "not_kept": return h({ kind: "claims", profileKept: false });
    default: return base;
  }
}
const EVIDENCE = (skill) => {
  const c = skill === SK_CAN ? CAN : PRACT;
  return { skill: { id: skill, title: c.title, label: c.label, outcomes: [], topic: { id: skill.replace(/-s1$/, ""), title: c.title, chapter: "Numbers" } },
    state: { level: c.level, key: c.key, recheck: false, nextReview: c.nextReview, attempts: c.rows.length },
    rows: c.rows.map((r, i) => ({ id: String(i + 1), at: r.at, kind: i === 0 ? "teachback" : "practice", probe: "P15", outcome: r.outcome, hintsUsed: r.hintsUsed, lessonId: "L1",
      words: i === 0 ? "first I look at the lakh place, then the thousands" : null, misconception: null })) };
};
const LESSONS = { lessons: [
  { id: "L1", topic: { id: "c5-maths-ch01-t01", title: "Numbers in thousands and beyond", shortTitle: "Big numbers", subject: "maths" }, kind: "live", startedAt: ago(1), endedAt: ago(0.98), minutes: 22, evidenceCount: 6, counted: true },
  { id: "L3", topic: { id: "c5-maths-ch01-t01", title: "Numbers in thousands and beyond", shortTitle: "Big numbers", subject: "maths" }, kind: "live", startedAt: ago(1.5), endedAt: ago(1.499), minutes: 1, evidenceCount: 0, counted: false },
  { id: "L2", topic: { id: "c5-maths-ch02-t01", title: "Fractions of a group", shortTitle: "Fractions of a group", subject: "maths" }, kind: "live", startedAt: ago(2), endedAt: ago(1.99), minutes: 16, evidenceCount: 4, counted: true },
] };
const CARD = (young) => ({
  lesson: { id: "L1", topic: { id: "c5-maths-ch01-t01", title: "Numbers in thousands and beyond", shortTitle: "Big numbers", chapter: "We the Travellers", subject: "maths" },
    startedAt: ago(1), endedAt: ago(0.98), minutes: 22, counted: true },
  did: { cards: [{ kind: "item", ask: "Which is bigger, 4,52,000 or 4,25,000?", answer: "4,52,000", tick: true, withHelp: false },
    { kind: "item", ask: "Write 3,05,040 in words", answer: "three lakh five thousand forty", tick: true, withHelp: true }], tried: null },
  skills: [{ ...CAN, attempts: 3, unaided: 2 }],
  nextCheck: ago(-3), quote: "first I look at the lakh place, then the thousands",
  transcript: young ? [{ seq: 1, speaker: "teacher", text: "Which is bigger?" }, { seq: 2, speaker: "child", text: "4,52,000" }] : null,
  transcriptPolicy: young ? "visible" : "on_request",
});
function syllabus() {
  const cur = JSON.parse(fs.readFileSync(path.join(ROOT, "data/curriculum/c5-maths.json"), "utf8"));
  const lv = (ci, ti) => (ci === 0 ? [3, 2, 1][ti % 3] : ci === 1 ? [1, 0][ti % 2] : 0);
  const chapters = cur.chapters.map((ch, ci) => ({ id: ch.id, number: ch.number ?? ci + 1, title: ch.title,
    topics: ch.topics.map((t, ti) => ({ id: t.id, title: t.title, level: lv(ci, ti), key: ["unseen", "practising", "learned_today", "mastered"][lv(ci, ti)],
      skills: [CAN, PRACT].filter((c) => c.skillId.replace(/-s\d+$/, "") === t.id).map((c) => ({ skillId: c.skillId, label: c.label, level: c.level, key: c.key, recheck: false })) })) }));
  const all = chapters.flatMap((c) => c.topics);
  return { classLevel: 5, board: "cbse", profileKept: true, subjects: [{ subject: "maths", book: cur.book, chapters }],
    here: { chapterId: chapters[1].id, topicId: chapters[1].topics[0].id }, bridge: null,
    header: { chaptersStarted: 2, secure: all.filter((t) => t.level === 3).length, topics: all.length } };
}
const REPORT = {
  id: "", cadence: "daily", period: "2026-10-03", window: { from: ago(1), to: ago(0) }, days: { first: "2026-10-03", last: "2026-10-03" }, k7: false, preview: true, createdAt: null,
  claims: [{ id: "strength:strength.right:0123456789", section: "strength", shapeId: "strength.right", facts: 3 }],
  renders: { en: { title: "Riya's day", voice: null, lines: [
    { key: "h", kind: "fixed", claimId: null, section: "header", text: "1 lesson · 22 min" },
    { key: "s", kind: "claim", claimId: "strength:strength.right:0123456789", section: "strength", text: "Riya got 3 questions on reading big numbers right on the first try, with no hint." },
    { key: "f", kind: "fixed", claimId: null, section: "footer", text: "Taxila is an AI teacher. This note comes from Riya's answers today." }] },
    hinglish: { title: "x", voice: null, lines: [] }, hi: { title: "x", voice: null, lines: [] } },
};
const REPORT_EV = { claim: { id: REPORT.claims[0].id, section: "strength", shapeId: "strength.right", how: { en: "Questions right on the first try with no hint.", hinglish: "", hi: "" } },
  window: REPORT.window, evidence: [{ id: "e1", at: ago(0.5), skill: "Read and write 5- and 6-digit numbers", kind: "practice", result: "right", help: "none", checkedBy: "code", game: false, session: "L1", matchesMixup: false }],
  lessons: [{ id: "L1", topic: "Numbers in thousands and beyond", startedAt: ago(0.5), minutes: 22 }], schedule: [] };

let FX = {};
const calls = [];
async function mockApi(page) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const m = req.method();
    calls.push({ m, p, body: req.postData() });
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return FX.signedOut ? json(401, { error: "not signed in" }) : json(200, { guardian: { id: "g1", email: "parent@example.test", name: "Parent", locale: "en-IN" },
      children: FX.kids ?? [RIYA, KABIR], consents: [{ child_id: null, purpose: "core_tutoring", granted: true, version: "v", created_at: ago(9) },
        { child_id: null, purpose: "learning_profile", granted: true, version: "v", created_at: ago(9) }, { child_id: null, purpose: "memory", granted: false, version: "v", created_at: ago(9) }] });
    if (p === "/api/auth/signup") { FX.signedOut = false; return json(201, { guardian: { id: "g2", email: "new@example.test", name: "New" } }); }
    if (p === "/api/auth/login") {
      const b = JSON.parse(req.postData() || "{}");
      if (b.password !== "right-password") return json(400, { error: "email or password is incorrect" });
      FX.signedOut = false;
      return json(200, { guardian: { id: "g1", email: b.email, name: "Parent" } });
    }
    if (p === "/api/parent/pin") return json(200, FX.gate ?? { hasPin: true, unlocked: true, unlockedUntil: ago(-0.01), lockedUntil: null, pendingResetAt: null });
    if (p === "/api/parent/unlock") {
      const b = JSON.parse(req.postData() || "{}");
      if (FX.unlock === "wait") return json(403, { error: "too many tries; wait", gate: "wait", lockedUntil: new Date(NOW + 15 * 60_000).toISOString() });
      if (b.pin !== "2580") return json(403, { error: "wrong PIN", gate: "locked", triesLeft: 3, code: "pin_wrong" });
      FX.gate = { hasPin: true, unlocked: true, unlockedUntil: ago(-0.01), lockedUntil: null };
      return json(200, FX.gate);
    }
    if (p === "/api/parent/lock") return json(200, { ok: true });
    if (p === "/api/parent/overview") return FX.overview === 500 ? json(500, { error: "internal error" }) : json(200, overview(FX.overview));
    if (p === "/api/parent/evidence") return json(200, EVIDENCE(url.searchParams.get("skill")));
    if (p === "/api/parent/lessons") return json(200, LESSONS);
    if (p === "/api/parent/lesson") return json(200, CARD(!!FX.young));
    if (p === "/api/parent/syllabus") return json(200, syllabus());
    if (p === "/api/parent/controls" && m === "GET") return json(200, { controls: CONTROLS });
    if (p === "/api/parent/controls" && m === "POST") return json(200, { controls: { ...CONTROLS, ...JSON.parse(req.postData() || "{}") } });
    if (p === "/api/parent/hometask") return json(200, { ok: true });
    if (p === "/api/parent/reports") return json(200, { reports: [{ id: "41", cadence: "daily", period: "2026-10-02", createdAt: ago(1) }, { id: "40", cadence: "weekly", period: "2026-W39", createdAt: ago(5) }], today: "2026-10-03", thisWeek: "2026-W40", lang: "hinglish", langs: ["en", "hinglish", "hi"], held: false });
    if (p === "/api/parent/report") return json(200, { report: url.searchParams.get("id") ? { ...REPORT, id: url.searchParams.get("id"), preview: false, createdAt: ago(1) } : REPORT });
    if (p === "/api/parent/report/evidence") return json(200, REPORT_EV);
    if (p === "/api/parent/speak") return route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(0) });
    if (p === "/api/consent") return json(200, { ok: true });
    if (p === "/api/parent/export") return json(200, { exportedAt: new Date().toISOString(), children: [] });
    if (p === "/api/account" && m === "DELETE") {
      const b = JSON.parse(req.postData() || "{}");
      if (b.password !== "right-password") return json(400, { error: "account password is incorrect", code: "password_wrong", field: "password", triesLeft: 4 });
      if (FX.erase === "review") return json(409, { error: "this deletion needs a safeguarding review first", code: "erase_review" });
      return json(200, { ok: true, receipt: { code: "TX-1A2B3C4D", at: new Date(NOW).toISOString(), children: 2, backupsGoneBy: new Date(NOW + 7 * 86400_000).toISOString() } });
    }
    if (p === "/api/children" && m === "DELETE") return json(200, { ok: true });
    if (p === "/api/child/teacher") return json(200, { teacher: { id: "arjun", name: "Arjun" }, eligible: [] });
    return json(404, { error: "unmocked" });
  });
}

// ───────────────────────────── in-page checks ─────────────────────────────
const HINGLISH = ["ghar", "ruko", "bolo", "bhejo", "phir", "shuru", "chalo", "paath", "abhyaas", "pakka", "baari", "agla", "kyun", "aata", "karein", "karo",
  "humne", "banaya", "mera", "meri", "bagiya", "aasmaan", "tumhare", "aage", "chalein", "nahi", "haan", "yahan", "likho", "abhi", "baad", "mein", "suno", "kaise",
  "pata", "hafte", "kaam", "dekhein", "chhoo", "tum", "aap"];

async function audit(page) {
  const vw = page.viewportSize()?.width ?? 0;
  return page.evaluate(({ HINGLISH, vw }) => {
    const out = { en: [], names: [], dead: [], lamps: 0, lampColour: [], tgt: [], hscroll: false, deadNav: [] };
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
    const re = new RegExp(`\\b(${HINGLISH.join("|")})\\b`, "i");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest("[data-speech], script, style, [aria-hidden='true']")) continue;
      const s = n.textContent.trim();
      if (!s || !visible(el)) continue;
      if (/[ऀ-ॿ]/.test(s)) out.en.push(`deva: ${s.slice(0, 40)}`);
      const m = s.match(re);
      if (m) out.en.push(`hinglish "${m[1]}": ${s.slice(0, 40)}`);
    }
    const nameOf = (el) => {
      const lb = el.getAttribute("aria-labelledby");
      if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
      if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent.trim(); }
      const wrap = el.closest("label"); if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
      const txt = (el.innerText ?? el.textContent ?? "").trim();
      if (txt) return txt;
      const img = el.querySelector("img[alt]:not([alt=''])");
      return img?.getAttribute("alt") ?? el.getAttribute("title") ?? el.getAttribute("placeholder") ?? "";
    };
    for (const el of document.querySelectorAll("button, [role=button], [role=radio], a[href], input, textarea, select")) {
      if (!visible(el) || el.closest("[aria-hidden='true']")) continue;
      if (!nameOf(el)) out.names.push(el.outerHTML.slice(0, 90));
      const r = el.getBoundingClientRect();
      if (!el.closest("p, .pa-meta, summary, .skip") && (r.width < 47.5 || r.height < 39.5) && el.tagName !== "INPUT" && el.tagName !== "SELECT")
        out.tgt.push(`${Math.round(r.width)}x${Math.round(r.height)} ${(el.innerText || el.getAttribute("aria-label") || el.tagName).slice(0, 30)}`);
      if (el.tagName === "A" && /\/parent\/(ptm|plan|family|saved)|\/teaching/.test(el.getAttribute("href") ?? "")) out.deadNav.push(el.getAttribute("href"));
    }
    const main = document.querySelector("main") ?? document.body;
    for (const el of main.querySelectorAll("div, section, aside, article, li")) {
      if (!visible(el) || el.closest("[aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 48) continue;
      const hasContent = (el.innerText ?? "").trim() || el.querySelector("img, svg, canvas, picture, input, textarea, button, a, [role=img]");
      if (!hasContent) out.dead.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.height)}px`);
    }
    for (const el of main.querySelectorAll("h1, h2, p, a, button, label, li")) {
      if (!visible(el) || el.closest("[aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.right > Math.min(window.innerWidth, vw || window.innerWidth) + 1 || r.left < -1) out.dead.push(`offscreen ${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.left)}..${Math.round(r.right)}`.slice(0, 90));
    }
    out.lamps = document.querySelectorAll("[data-lamp]").length;
    // G-LAMP-1 by colour: marigold #FFB21E (255,178,30), its wash and ring, on any painted box or text
    const LAMP = ["rgb(255, 178, 30)", "rgb(255, 243, 219)", "rgb(122, 72, 0)", "rgb(61, 44, 8)"];
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el) || el.closest("img, [data-art]")) continue;
      const cs = getComputedStyle(el);
      for (const prop of ["color", "backgroundColor", "borderLeftColor", "borderTopColor", "outlineColor"]) {
        if (prop.startsWith("border") && parseFloat(cs[prop.replace("Color", "Width")]) === 0) continue;
        if (prop === "outlineColor" && cs.outlineStyle === "none") continue;
        if (LAMP.includes(cs[prop])) { out.lampColour.push(`${el.tagName.toLowerCase()}.${el.className} ${prop}`.slice(0, 80)); break; }
      }
    }
    out.hscroll = document.scrollingElement.scrollWidth > Math.min(window.innerWidth, vw || window.innerWidth) + 1;
    return out;
  }, { HINGLISH, vw });
}
function report(tag, a) {
  check(`V-EN-1 ${tag}`, a.en.length === 0, a.en.slice(0, 3).join(" | "));
  check(`V-NAME-1 ${tag}`, a.names.length === 0, a.names.slice(0, 2).join(" | "));
  check(`V-LAYOUT-2 ${tag}`, a.dead.length === 0 && !a.hscroll && a.deadNav.length === 0, [...a.dead.slice(0, 3), a.hscroll ? "horizontal scroll" : "", ...a.deadNav].filter(Boolean).join(" | "));
  check(`V-SIG-2 ${tag}`, a.lamps === 0 && a.lampColour.length === 0, `${a.lamps} lamp(s) ${a.lampColour.slice(0, 2).join(" | ")}`);
  check(`V-TGT ${tag}`, a.tgt.length === 0, a.tgt.slice(0, 4).join(" | "));
}

async function contrast(page) {
  const els = await page.evaluate(() => {
    const out = []; let k = 0;
    const modal = document.querySelector("dialog[open]");
    for (const el of (modal ?? document.body).querySelectorAll("*")) {
      if (el.closest("svg, script, style, dialog:not([open])")) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0 || el.closest("[disabled], [aria-disabled='true'], .sr-only")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      // under another element (the bottom bar over scrolled content): not visible, so not measured
      const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
      if (hit && !(hit === el || el.contains(hit) || hit.contains(el))) continue;
      const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
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
    const parse = (c) => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c); return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
    const cv = new OffscreenCanvas(bmp.width, bmp.height); const cx = cv.getContext("2d"); cx.drawImage(bmp, 0, 0);
    const dpr = bmp.width / innerWidth; const bad = [];
    for (const e of els) {
      const fg = parse(e.color); if (!fg || fg[3] < 0.05) continue;
      const x = Math.floor(e.x * dpr), y = Math.floor(e.y * dpr), w = Math.max(1, Math.floor(e.w * dpr)), h = Math.max(1, Math.floor(e.h * dpr));
      const d = cx.getImageData(x, y, Math.min(w, bmp.width - x), Math.min(h, bmp.height - y)).data;
      const step = Math.max(1, Math.floor(d.length / 4 / 600)); const rs = [];
      for (let i = 0; i < d.length / 4; i += step) { const bg = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]; rs.push(ratio([0, 1, 2].map((j) => fg[j] * fg[3] + bg[j] * (1 - fg[3])), bg)); }
      rs.sort((a, b) => a - b);
      const p20 = rs[Math.floor(rs.length * 0.2)] ?? 21;
      if (p20 < (e.large ? 3 : 4.5)) bad.push(`${p20.toFixed(2)} "${e.text}"`);
    }
    return bad;
  }, { png, els });
}

/** V-PIN: every PinPad key is hit-testable at its centre (nothing sits over the pad). */
async function pinClear(page) {
  return page.evaluate(() => {
    const keys = [...document.querySelectorAll(".pin-key")];
    if (!keys.length) return ["no PinPad"];
    const bad = [];
    for (const k of keys) {
      k.scrollIntoView({ block: "nearest" });
      const r = k.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit || !(hit === k || k.contains(hit))) bad.push(`${k.textContent || k.getAttribute("aria-label")} under ${hit?.className ?? hit?.tagName}`);
      if (r.bottom > innerHeight + 0.5) bad.push(`${k.textContent} below the fold`);
    }
    return bad;
  });
}

// ───────────────────────────── run ─────────────────────────────
const browser = await chromium.launch();
const shots = [];
async function ctxFor(w, h, theme) {
  const mobile = w < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: theme, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await mockApi(page);
  return { ctx, page };
}
async function go(page, url) {
  // an in-page navigation still settling (a sheet closing calls history.back) can abort a goto: try once more
  try { await page.goto(BASE + url, { waitUntil: "networkidle" }); } catch { await page.waitForTimeout(300); await page.goto(BASE + url, { waitUntil: "networkidle" }); }
  await page.waitForTimeout(250);
}
async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  // a full-page capture paints a fixed bar at its viewport position mid-page; for the picture only, park it at the end
  const st = await page.addStyleTag({ content: ".pa-tabs{position:static!important}.pa-top{position:static!important}" });
  await page.screenshot({ path: file, fullPage: true });
  await st.evaluate((n) => n.remove());
  shots.push(name);
}

const ROUTES = [
  ["home", "/parent?c=c-riya", { overview: "normal" }],
  ["home-none", "/parent?c=c-riya", { overview: "none" }],
  ["home-first", "/parent?c=c-riya", { overview: "first" }],
  ["home-too-early", "/parent?c=c-riya", { overview: "too_early" }],
  ["home-quiet", "/parent?c=c-riya", { overview: "quiet" }],
  ["home-alert", "/parent?c=c-riya", { overview: "alert" }],
  ["home-held", "/parent?c=c-riya", { overview: "held" }],
  ["home-not-kept", "/parent?c=c-riya", { overview: "not_kept" }],
  ["evidence", `/parent/evidence/${SK_PRACT}?c=c-riya`, { overview: "normal" }],
  ["progress", "/parent/progress?c=c-riya", { overview: "normal" }],
  ["lessons", "/parent/lessons?c=c-riya", {}],
  ["lesson-card", "/parent/lessons/L1?c=c-riya", {}],
  ["notes", "/parent/notes?c=c-riya", {}],
  ["controls", "/parent/controls?c=c-riya", {}],
  ["children", "/parent/children?c=c-riya", {}],
  ["data", "/parent/data?c=c-riya", {}],
  ["help", "/parent/help?c=c-riya", {}],
  ["more", "/parent/more?c=c-riya", {}],
  ["change-pin", "/parent/pin?c=c-riya", {}],
  ["gate", "/parent?c=c-riya", { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null, pendingResetAt: null } }],
];
const SIZES = QUICK ? [[360, 640]] : [[360, 640], [1280, 800]];
const THEMES = QUICK ? ["light"] : ["light", "dark"];

try {
  // 1. every route × size × theme: audit (360 light: full; others: lamp + layout), focus, contrast, shot
  for (const [w, h] of SIZES) {
    for (const theme of THEMES) {
      const { ctx, page } = await ctxFor(w, h, theme);
      for (const [name, url, fx] of ROUTES) {
        FX = { ...fx };
        await go(page, url);
        const tag = `${name} ${w} ${theme}`;
        const a = await audit(page);
        if (w === 360 && theme === "light") report(tag, a);
        else {
          check(`V-SIG-2 ${tag}`, a.lamps === 0 && a.lampColour.length === 0, a.lampColour.slice(0, 2).join(" | "));
          check(`V-LAYOUT-2 ${tag}`, a.dead.length === 0 && !a.hscroll && a.deadNav.length === 0, [...a.dead.slice(0, 3), a.hscroll ? "horizontal scroll" : "", ...a.deadNav].filter(Boolean).join(" | "));
        }
        if (name !== "gate" && name !== "evidence") {
          const f = await page.evaluate(() => ({ y: scrollY, tag: document.activeElement?.tagName, txt: document.activeElement?.textContent?.slice(0, 40) }));
          check(`V-FOCUS ${tag}`, f.y === 0 && f.tag === "H1", JSON.stringify(f));
        }
        const bad = await contrast(page);
        check(`V-CON ${tag}`, bad.length === 0, bad.slice(0, 3).join(" | "));
        await shot(page, `${name}__${w}x${h}__${theme}`);
      }
      await ctx.close();
    }
  }

  const { ctx, page } = await ctxFor(360, 640, "light");

  // 2. V-CLAIM: the audit case is not rendered; the normal claims are, with the sheet's state
  FX = { overview: "audit" };
  await go(page, "/parent?c=c-riya");
  const auditText = await page.locator("main").innerText();
  check("V-CLAIM audit case: no 'Still practising' over a lone right-on-their-own row", !/Still practising/i.test(auditText) && /Nothing new to report/.test(auditText), auditText.slice(0, 120));
  FX = { overview: "normal" };
  await go(page, "/parent?c=c-riya");
  const normalText = await page.locator("main").innerText();
  check("V-CLAIM normal: 'can now' and 'Still practising' render when the rows support them", /Riya can now read and write/.test(normalText) && /Still practising: fractions of a group\./.test(normalText), normalText.slice(0, 160));
  check("V-CLAIM negative control: the same page with the audit fixture differs", auditText !== normalText);
  const headState = await page.getAttribute(`[data-claim="practising"]`, "data-claim-state");
  await page.click(`[data-claim="practising"] .pa-how`);
  await page.waitForSelector(".pa-ev[data-evidence-state]");
  const sheetState = await page.getAttribute(".pa-ev", "data-evidence-state");
  check("V-CLAIM headline state equals the evidence sheet's state", headState && headState === sheetState, `${headState} vs ${sheetState}`);
  const sheetText = await page.locator("dialog.sheet[open]").innerText();
  check("V-CLAIM sheet: kind words, verdict words, the child's own words, never 'wrong'", /Explained it in their own words/.test(sheetText) && /Not yet/.test(sheetText) && /lakh place/.test(sheetText) && !/wrong|incorrect/i.test(sheetText), sheetText.slice(0, 160));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 2b. V-ONE: one name per skill (headline label == sheet title), one state per skill (Try at home vs headline)
  const onePage = (t) => {
    // a skill the headline says "can now" must not appear in the same page as "has been practising"
    const can = /Riya can now (.+?)\./.exec(t)?.[1];
    return !can || !new RegExp(`practising\\W+${can.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(t);
  };
  check("V-ONE normal home: no skill named with two states", onePage(normalText), normalText.slice(0, 300));
  FX = { overview: "contradiction" };
  await go(page, "/parent?c=c-riya");
  const contraText = await page.locator("main").innerText();
  check("V-ONE negative control: the pre-fix payload (activity names the can_now skill as practising) is caught", !onePage(contraText), contraText.slice(0, 200));
  FX = { overview: "generic" };
  await go(page, "/parent?c=c-riya");
  const genText = await page.locator("main").innerText();
  check("V-ONE generic activity: renders, no How do we know? link under it, no pictures", onePage(genText) && /ask Riya what they would like to learn about next/.test(genText)
    && (await page.locator(".pa-try .pa-how").count()) === 0 && (await page.locator(".pa-try .pa-pics").count()) === 0, genText.slice(0, 200));
  FX = { overview: "normal" };
  await go(page, "/parent?c=c-riya");
  const headLabel = (await page.locator('[data-claim="can_now"] .pa-claim-text').innerText()).replace(/^Riya can now /, "").replace(/\.$/, "");
  await page.click(`[data-claim="can_now"] .pa-how`);
  await page.waitForSelector(".pa-ev .pa-ev-skill");
  const sheetLabel = await page.locator(".pa-ev .pa-ev-skill").innerText();
  check("V-ONE headline label == sheet title (one parent name per skill)", sheetLabel.toLowerCase() === headLabel.toLowerCase(), `${headLabel} vs ${sheetLabel}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 2c. V-SAFE: the alert card only for a released notice; a hold shows nothing; Help is honest
  FX = { overview: "held" };
  await go(page, "/parent?c=c-riya");
  const heldText = await page.locator("main").innerText();
  check("V-SAFE held: 'No new note right now.' and no alert card", /No new note right now\./.test(heldText) && (await page.locator(".pa-alert").count()) === 0 && !/check in with/i.test(heldText), heldText.slice(0, 160));
  FX = { overview: "alert" };
  await go(page, "/parent?c=c-riya");
  check("V-SAFE negative control: a released notice does show the card", (await page.locator(".pa-alert").count()) === 1);
  FX = {};
  await go(page, "/parent/help?c=c-riya");
  const helpText = await page.locator("main").innerText();
  check("V-SAFE Help never promises a message that is not sent", !/message at once|You get a message/i.test(helpText) && /safeguarding team/.test(helpText), helpText.slice(0, 300));
  // Progress groups skills from /api/parent/syllabus alone; its skill buttons use the same parent label
  calls.length = 0;
  await go(page, "/parent/progress?c=c-riya");
  const progSkills = await page.locator(".pa-skill > span:first-child").allInnerTexts();
  check("V-HONEST Progress makes no /api/parent/overview call", !calls.some((c) => c.p === "/api/parent/overview") && calls.some((c) => c.p === "/api/parent/syllabus"), calls.map((c) => c.p).join(" "));
  check("V-ONE Progress skill names are the parent labels", progSkills.some((t) => t.toLowerCase() === headLabel.toLowerCase()), progSkills.join(" | "));
  await go(page, "/parent/lessons/L1?c=c-riya");
  const cardText = await page.locator("main").innerText();
  check("V-HONEST Lesson card: no model-written 'Lesson summary'; skill named by its parent label", !/Lesson summary/.test(cardText) && cardText.toLowerCase().includes(headLabel.toLowerCase()), cardText.slice(0, 200));

  // 3. V-ERR: a 500 and a raw message never reach the parent
  FX = { overview: 500 };
  await go(page, "/parent?c=c-riya");
  const errText = await page.locator("main").innerText();
  check("V-ERR overview 500 → a sentence with Try again, no raw string", /Something went wrong\. Try again\./.test(errText) && !/internal error|failed \(/.test(errText), errText.slice(0, 100));

  // 4. V-TIME + offline: last good copy with local time
  FX = { overview: "normal" };
  await go(page, "/parent?c=c-riya");
  FX = { overview: 500 };
  await page.click(".pa-tabs a[href^='/parent/progress']");
  await page.waitForTimeout(300);
  await page.click(".pa-tabs a[href^='/parent?']");
  await page.waitForTimeout(400);
  const stale = await page.locator(".pa-stale").innerText().catch(() => "");
  check("V-TIME offline: the last good copy says 'Last updated h:mm am/pm' in local time", /Last updated \d{1,2}:\d{2} (am|pm)/.test(stale) && /can now/.test(await page.locator("main").innerText()), stale);

  // 5. V-FOOT: Controls with a changed group, inline Save not covered; no floating bar
  FX = {};
  await go(page, "/parent/controls?c=c-riya");
  await page.click('[data-group="time"] [role="radio"]:has-text("45 min")');
  const foot = await page.evaluate(() => {
    const save = document.querySelector('[data-group="time"] .pa-group-save button');
    if (!save) return { err: "no Save in the group" };
    save.scrollIntoView({ block: "end" });
    window.scrollBy(0, 0);
    const r = save.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const fixed = [...document.querySelectorAll("body *")].filter((el) => ["fixed", "sticky"].includes(getComputedStyle(el).position)).map((el) => el.className);
    window.scrollTo(0, document.scrollingElement.scrollHeight);
    const cards = [...document.querySelectorAll(".pa-card")];
    const last = cards.at(-1).getBoundingClientRect();
    const tabs = document.querySelector(".pa-tabs").getBoundingClientRect();
    return { covered: !(hit === save || save.contains(hit)), hit: hit?.className, fixed, lastBottom: last.bottom, tabsTop: tabs.top, inGroup: !!save.closest('[data-group="time"]') };
  });
  check("V-FOOT Save sits inline in the changed group and the bottom bar never covers it", foot.inGroup && !foot.covered, JSON.stringify(foot));
  check("V-FOOT the only fixed/sticky elements are the top and bottom bars (no floating save bar)", foot.fixed?.every((c) => /pa-tabs|pa-top/.test(c)), JSON.stringify(foot.fixed));
  check("V-FOOT scrolled to the end, the last card ends above the bottom bar", foot.lastBottom <= foot.tabsTop + 0.5, `${foot.lastBottom} vs ${foot.tabsTop}`);
  await shot(page, "controls-changed__360x640__light");

  // 6. V-PIN: gate, Change PIN, the conversation re-check (class 1-4) — and a negative control
  FX = { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null, pendingResetAt: null } };
  await go(page, "/parent?c=c-riya");
  let bad = await pinClear(page);
  check("V-PIN gate at 360: every key is hit-testable, none below the fold", bad.length === 0, bad.join(" | "));
  await page.addStyleTag({ content: "body::after{content:'';position:fixed;left:0;right:0;bottom:0;height:120px;background:var(--surface);z-index:99}" });
  bad = await pinClear(page);
  check("V-PIN negative control: a 120 px fixed footer over the pad is caught", bad.length > 0, bad.slice(0, 2).join(" | "));
  FX = {};
  await go(page, "/parent/pin?c=c-riya");
  bad = await pinClear(page);
  check("V-PIN Change PIN at 360 (bottom bar hidden): every key is hit-testable", bad.length === 0 && (await page.locator(".pa-tabs").count()) === 0, bad.join(" | "));
  FX = { young: true };
  await go(page, "/parent/lessons/L1?c=c-riya");
  await page.click("button:has-text('See the full conversation')");
  await page.waitForSelector(".pin");
  bad = await pinClear(page);
  check("V-PIN conversation re-check: every key is hit-testable", bad.length === 0, bad.join(" | "));
  for (const d of "2580") await page.click(`.pin-key:text-is("${d}")`);
  await page.click(".pin-key.btn-primary");
  await page.waitForSelector(".pa-transcript");
  check("V-PIN the PIN re-confirms, then the conversation shows", (await page.locator(".pa-transcript li").count()) === 2);

  // 7. V-GATE: wrong PIN, cool-off, reset pending, re-lock wording
  FX = { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null, pendingResetAt: null } };
  await go(page, "/parent?c=c-riya");
  for (const d of "1357") await page.click(`.pin-key:text-is("${d}")`);
  await page.click(".pin-key.btn-primary");
  await page.waitForTimeout(150);
  const wrong = await page.evaluate(() => ({ msg: document.querySelector(".pa-gate-msg")?.textContent, shake: !!document.querySelector(".pa-shake.is-wrong"), anim: document.getAnimations().some((a) => a.animationName === "pa-shake") }));
  check("V-GATE wrong PIN: 'That PIN isn't right.' and the dots shake", wrong.msg === "That PIN isn't right." && wrong.shake && wrong.anim, JSON.stringify(wrong));
  await shot(page, "gate-wrong__360x640__light");
  FX = { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: new Date(NOW + 15 * 60_000).toISOString() } };
  await go(page, "/parent?c=c-riya");
  const wait = await page.locator("main").innerText();
  check("V-GATE cool-off: 'Too many tries. Try again at h:mm am/pm.' and the grown-ups line", /Too many tries\. Try again at \d{1,2}:\d{2} (am|pm)\./.test(wait) && /This door is for grown-ups\./.test(wait), wait.slice(0, 120));
  await shot(page, "gate-cooloff__360x640__light");
  FX = { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null, pendingResetAt: new Date(NOW + 24 * 3600_000).toISOString() } };
  await go(page, "/parent?c=c-riya");
  const pend = await page.locator("main").innerText();
  check("V-GATE reset pending: 'Your new PIN works from …' with Cancel reset", /Your new PIN works from \d{1,2}:\d{2} (am|pm) tomorrow\./.test(pend) && /Cancel reset/.test(pend), pend.slice(0, 160));
  await shot(page, "gate-reset-pending__360x640__light");
  await page.evaluate(() => sessionStorage.setItem("tx.parentWasOpen", "true"));
  FX = { gate: { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null, pendingResetAt: null } };
  await go(page, "/parent?c=c-riya");
  const re = await page.locator("main").innerText();
  check("V-GATE re-lock: 'Locked to keep Riya out. Enter your PIN.'", /Locked to keep Riya out\. Enter your PIN\./.test(re), re.slice(0, 100));
  await shot(page, "gate-relock__360x640__light");
  for (const d of "2580") await page.click(`.pin-key:text-is("${d}")`);
  await page.click(".pin-key.btn-primary");
  await page.waitForSelector(".pa-home");
  check("V-GATE the right PIN opens the corner", true);

  // 8. V-DEL: account deletion with a wrong password (field error), then the real thing → receipt
  FX = {};
  await go(page, "/parent/data?c=c-riya");
  await page.click("#delete-account button:has-text('Delete my account')");
  await page.fill("#pw-account", "wrong-password");
  await page.click("#delete-account button:has-text('Continue')");
  await page.waitForSelector("#delete-account[data-step='confirm']");
  const hold = page.locator("#delete-account button.hold");
  const holdFor = async (ms) => { await hold.scrollIntoViewIfNeeded(); const b = await hold.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); };
  await holdFor(800);
  check("V-DEL letting go before 2 s cancels (no request)", !calls.some((c) => c.p === "/api/account"));
  await holdFor(2300);
  await page.waitForSelector("#pw-account");
  const fieldErr = await page.evaluate(() => {
    const inp = document.querySelector("#pw-account");
    const ids = (inp?.getAttribute("aria-describedby") ?? "").split(/\s+/);
    return { text: ids.map((i) => document.getElementById(i)?.textContent ?? "").join(" "), invalid: inp?.getAttribute("aria-invalid"), body: document.body.innerText };
  });
  check("V-ERR wrong password: the error sits on the password field (aria-describedby) in a sentence, no raw string",
    /That password isn't right\./.test(fieldErr.text) && fieldErr.invalid === "true" && !/account password is incorrect/.test(fieldErr.body), fieldErr.text);
  await shot(page, "data-delete-wrong-password__360x640__light");
  await page.fill("#pw-account", "right-password");
  await page.click("#delete-account button:has-text('Continue')");
  await page.waitForSelector("#delete-account[data-step='confirm']");
  await shot(page, "data-delete-confirm__360x640__light");
  // a safety matter is open: the server defers (409 erase_review) and the page says so in a sentence, no receipt
  FX = { erase: "review" };
  await holdFor(2300);
  await page.waitForSelector("#delete-account .pa-form-err");
  const deferred = await page.locator("#delete-account").innerText();
  check("V-SAFE deferred deletion: a sentence, 'Nothing has been deleted', no receipt, no raw string",
    /needs a check by our team first\. Nothing has been deleted\./.test(deferred) && (await page.locator("[data-receipt]").count()) === 0 && !/safeguarding review/.test(deferred), deferred.slice(0, 200));
  await shot(page, "data-delete-deferred__360x640__light");
  FX = {};
  await holdFor(2300);
  await page.waitForSelector("[data-receipt]");
  const del = calls.filter((c) => c.p === "/api/account" && c.m === "DELETE").map((c) => JSON.parse(c.body));
  const receipt = await page.locator("[data-receipt]").innerText();
  check("V-DEL the request carries the password and the confirm step", del.length === 3 && del.at(-1).password === "right-password" && del.at(-1).confirm === true, JSON.stringify(del));
  check("V-HONEST receipt says what is kept, points to no contact that does not exist", !/Nothing is kept/.test(receipt) && !/ask us/.test(receipt) && /record that this deletion happened/.test(receipt), receipt.slice(0, 300));
  check("V-DEL receipt: code, local time, the 7-day backup notice", /TX-1A2B3C4D/.test(receipt) && /\d{1,2}:\d{2} (am|pm)/.test(receipt) && /7 days/.test(receipt), receipt.slice(0, 200));
  await shot(page, "data-delete-receipt__360x640__light");

  // 9. V-NEXT: sign-in with ?next= (sign-in by default, sentences on the fields, back to ?next=)
  FX = { signedOut: true };
  await go(page, `/start/phone?next=${encodeURIComponent("/parent/lessons?c=c-riya")}`);
  const h1 = await page.locator("h1").first().innerText();
  check("V-NEXT ?next= opens sign-in, not sign-up", /Sign in/.test(h1), h1);
  await page.click("button[type=submit]");
  const empty = await page.evaluate(() => document.body.innerText);
  check("V-NEXT empty submit: 'Enter your email.' and 'Enter your password.' on their fields", /Enter your email\./.test(empty) && /Enter your password\./.test(empty) && !/missing field/.test(empty));
  await page.fill("input[type=email]", "parent@example.test");
  await page.fill("input[type=password]", "nope-nope-nope");
  await page.click("button[type=submit]");
  await page.waitForTimeout(300);
  const wrongPw = await page.evaluate(() => document.body.innerText);
  check("V-NEXT wrong password: a sentence on the field, never the server string", /That email and password don't match\. Try again\./.test(wrongPw) && !/email or password is incorrect/.test(wrongPw));
  await shot(page, "signin-next-error__360x640__light");
  await page.fill("input[type=password]", "right-password");
  await page.click("button[type=submit]");
  await page.waitForURL((u) => u.pathname === "/parent/lessons", { timeout: 5000 }).catch(() => {});
  check("V-NEXT after sign-in it returns to ?next=", new URL(page.url()).pathname === "/parent/lessons" && new URL(page.url()).searchParams.get("c") === "c-riya", page.url());
  // an open redirect is refused (lands on the normal post-sign-in route instead)
  FX = { signedOut: true };
  await go(page, `/start/phone?login=1&next=${encodeURIComponent("//evil.example")}`);
  await page.fill("input[type=email]", "parent@example.test");
  await page.fill("input[type=password]", "right-password");
  await page.click("button[type=submit]");
  await page.waitForTimeout(500);
  check("V-NEXT negative control: ?next=//evil.example is ignored", new URL(page.url()).host === new URL(BASE).host, page.url());
  // a FRESH signup with ?next= goes through consent first, never straight into the corner
  FX = { signedOut: true };
  await go(page, `/start/phone?signup=1&next=${encodeURIComponent("/parent?c=c-riya")}`);
  await page.fill("input[autocomplete=name]", "New Parent");
  await page.fill("input[type=email]", "new@example.test");
  await page.fill("input[type=password]", "a-long-password");
  await page.click("button[type=submit]");
  await page.waitForURL((u) => u.pathname !== "/start/phone", { timeout: 5000 }).catch(() => {});
  check("V-NEXT fresh signup with ?next= goes to consent, not the corner", new URL(page.url()).pathname === "/start/consent", page.url());
  // already signed in + ?next= → straight there
  FX = {};
  await go(page, `/start/phone?next=${encodeURIComponent("/parent/help?c=c-riya")}`);
  await page.waitForTimeout(400);
  check("V-NEXT already signed in: straight to ?next=", new URL(page.url()).pathname === "/parent/help", page.url());

  // 10. 1280 drawer: the evidence sheet is a right drawer of 480
  const wide = await ctxFor(1280, 800, "light");
  FX = { overview: "normal" };
  await go(wide.page, `/parent/evidence/${SK_CAN}?c=c-riya`);
  await wide.page.waitForSelector(".pa-ev");
  const box = await wide.page.locator("dialog.sheet[open]").boundingBox();
  check("V-LAYOUT evidence at 1280 is a right drawer of 480", box && Math.round(box.width) === 480 && Math.round(box.x + box.width) === 1280, JSON.stringify(box));
  await shot(wide.page, "evidence-drawer__1280x800__light");
  // the rail's ground runs the full page height (a long page scrolled to the end: the rail column is still painted)
  for (const theme of ["light", "dark"]) {
    await wide.page.emulateMedia({ colorScheme: theme });
    await go(wide.page, "/parent/progress?c=c-riya");
    const rail = await wide.page.evaluate(() => {
      window.scrollTo(0, document.scrollingElement.scrollHeight);
      const pa = document.querySelector(".pa"), r = document.querySelector(".pa-rail");
      const surf = getComputedStyle(r).backgroundColor;
      const bi = getComputedStyle(pa).backgroundImage;
      return { long: document.scrollingElement.scrollHeight > innerHeight * 1.5, gradient: /linear-gradient/.test(bi) && bi.includes(surf.replace(/\s/g, " ")), bi: bi.slice(0, 80), surf };
    });
    check(`V-LAYOUT 1280 ${theme}: the rail column is painted the full page height`, rail.long && rail.gradient, JSON.stringify(rail));
  }
  await wide.ctx.close();
  await ctx.close();
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(SHOTS, "results.json"), JSON.stringify({ at: new Date().toISOString(), pass: results.length - failed.length, fail: failed.length, results, shots }, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} passed · ${shots.length} shots in ${path.relative(ROOT, SHOTS)}`);
process.exit(failed.length ? 1 : 0);
