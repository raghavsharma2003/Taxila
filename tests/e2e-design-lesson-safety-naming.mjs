// The Playwright battery for workstream lesson-safety-naming (decision child-names-teacher; PRODUCT-DESIGN-V2 §3.3 step 5,
// §6.3.9, §8 "one teacher everywhere"), on the SHIPPED build. Standalone (needs Chromium; not part of `npm test`):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-lesson-safety-naming.mjs [--dist <built SPA>] [--shots <dir>]
//
// It builds the production SPA (no dev routes) unless --dist is given, serves it with server/serve.mjs, and mocks
// /api/* with page.route. The name route's mock runs the REAL server predicate (server/compiler/characters/naming.js),
// so what the child sees on a refusal is what production would answer. At 360x640 and 1280x800, light and dark
// (Young is light-only):
//   N-HELLO   Hello ends in the naming step for every child (after the AI card): suggestions Asha / Arjun / Uma, a typed
//             name; a refused name (romance, own name, public figure, bad shape) gets one gentle sentence and the
//             suggestions, never the name echoed; the AI line stays on the step; a good name is POSTed and the lesson opens
//   N-TEACHER Your teacher shows the name in use and "Change name"; a rename is saved and announced
//   N-ID      the child's name for the teacher is on the home label ("{T} · AI teacher") and the Your-teacher card
//   N-PIN     the lesson shows the name PINNED at its start (the start response), not a rename made since; the AI label
//             goes with it; the hint line (ui.hint) shows on the card with its rung dots
//   N-PARENT  the parent row shows the name, the AI note, Change and Reset; Change opens the same naming step (the real
//             predicate refuses, a good name POSTs { name, source: "parent" }); Reset POSTs { name: null, source: "parent" }
//   N-KEEP    first run: "Keep {T}" with no custom name writes nothing, so a failing name route (5xx, 011 not yet applied)
//             never strands the child; with a custom name the button reads "Go back to {own}" (it resets)
//   N-REAL    against the REAL routes (a second serve.mjs on the Neon TEST branch, CONDUCTOR_TEST_DATABASE_URL; skipped
//             and reported when unset): Your teacher → Change name → a refused name gets the server's 422, a good one is
//             stored with its history row and comes back from /api/me; the parent's Change stores source 'parent'
//   plus the shared audits on every frame: English chrome, accessible names, targets ≥ 48 (64 Young), no empty
//   container > 48 px, no horizontal scroll, no lamp outside the lesson dock.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";
import { checkTeacherName } from "../server/compiler/characters/naming.js";
import { teacherNameSuggestions } from "../shared/tutors.js";
import { lessonScript } from "../src/child/lesson/dev/script.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SHOTS = arg("--shots", `${ROOT}docs/design/build/lesson-safety-naming`);
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  detail = String(detail).replace(/\s+/g, " ").trim();
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-lsn-dist-"));
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

// ───────────── fixtures ─────────────
const KIDS = {
  riya: { id: "c-riya", first_name: "Riya", class_level: 3, board: "cbse", language_pref: "hinglish", teacher_id: "asha", teacher_name: null, avatar: "red-panda", interests: ["Cricket"] },
  kabir: { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "arjun", teacher_name: null, avatar: "rocket", interests: ["Football"] },
};
const OWN = { asha: "Asha", arjun: "Arjun", uma: "Uma" };
const card = (id, name) => ({ id, name: name || OWN[id], characterName: OWN[id], addressedAs: name || OWN[id], role: "AI teacher",
  pronouns: id === "arjun" ? { subject: "he", object: "him", possessive: "his" } : { subject: "she", object: "her", possessive: "her" }, voice: "x", lookRev: 1, signatureColor: null });
const plan = (kid) => ({ state: "start", homeState: "default", plan: { openLesson: null, window: { from: "07:00", to: "20:30" } },
  topic: { id: "c6-maths-ch05-t01", title: "Fractions as equal parts of a whole", shortTitle: "Fractions: equal parts", chapter: "Fractions", subject: "maths", minutes: 25 },
  resume: null, today: null, capRemaining: 20, capMin: 30, usedMin: 10, opensAt: null, packReady: null, day: "2026-10-03", tz: "Asia/Kolkata",
  teacher: card(kid.teacher_id, kid.teacher_name), surfaces: { map: true, notebook: true, resume: true }, source: { dayPlan: null } });

/** One scenario's API. fx: { kid, tutors: 1|2, pinned?: name the lesson started under, history? } */
async function mockApi(page, fx) {
  const st = { names: [], starts: 0, chooses: [] };
  const kid = fx.kid;
  const script = lessonScript(false);
  let turnI = 0;
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const body = () => JSON.parse(req.postData() || "{}");
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "parent@example.test", name: "Parent" }, children: [kid] });
    if (p === "/api/child/plan") return json(200, plan(kid));
    if (p === "/api/child/map") return json(200, { mode: "sky", hidden: false, subjects: [], skills: [], empty: true });
    if (p === "/api/tutors" && req.method() === "GET") {
      const two = fx.tutors === 2;
      return json(200, { current: kid.teacher_id, chosen: false, mode: two ? "picker" : "single", band: "b3", tutors: two ? ["asha", "arjun"] : [kid.teacher_id], live: false,
        name: kid.teacher_name || OWN[kid.teacher_id], characterName: OWN[kid.teacher_id], custom: !!kid.teacher_name,
        suggestions: teacherNameSuggestions(kid.teacher_id, { childFirstName: kid.first_name }) });
    }
    if (p === "/api/tutors/choose") { const b = body(); st.chooses.push(b.tutorId); kid.teacher_id = b.tutorId; kid.teacher_name = null; return json(200, { current: b.tutorId, chosen: true, name: null }); }
    if (p === "/api/tutors/name" && req.method() === "POST") {
      const b = body();
      st.names.push(b);
      if (fx.nameFails) return json(500, { error: "relation does not exist" });
      if (b.name === null) { kid.teacher_name = null; return json(200, { name: OWN[kid.teacher_id], characterName: OWN[kid.teacher_id], custom: false, teacher: card(kid.teacher_id) }); }
      // the REAL predicate (server/compiler/characters/naming.js)
      const r = checkTeacherName(b.name, { childFirstName: kid.first_name, characterId: kid.teacher_id });
      if (!r.ok) return json(422, { error: "name not allowed", reason: r.reason, suggestions: r.suggestions });
      kid.teacher_name = r.name === OWN[kid.teacher_id] ? null : r.name;
      return json(200, { name: r.name, characterName: OWN[kid.teacher_id], custom: !!kid.teacher_name, teacher: card(kid.teacher_id, kid.teacher_name) });
    }
    if (p === "/api/tutors/name" && req.method() === "GET") {
      return json(200, { name: kid.teacher_name || OWN[kid.teacher_id], characterName: OWN[kid.teacher_id], custom: !!kid.teacher_name, retired: false,
        characterId: kid.teacher_id, band: "b3",
        history: fx.history ?? (kid.teacher_name ? [{ name: kid.teacher_name, characterId: kid.teacher_id, source: "child", at: "2026-10-03T08:00:00Z" }] : []) });
    }
    if (p === "/api/children" && req.method() === "PATCH") return json(200, { child: kid });
    if (p === "/api/parent/pin") return json(200, { hasPin: true, unlocked: true, unlockedUntil: new Date(Date.now() + 600_000).toISOString(), lockedUntil: null });
    if (p === "/api/parent/controls") return json(200, { controls: { dailyMinutes: 30, hoursStart: "07:00", hoursEnd: "20:30", captionsAlways: false, comfortMode: false, address: "tum", reportChannel: "app" } });
    if (p === "/api/lesson/start") {
      st.starts++;
      if (!fx.lesson) return json(409, { error: "not in this battery" });
      return json(201, { lessonId: "L-pin", topic: { id: "t", title: "Fractions: halves and quarters", chapter: "Fractions" },
        teacher: card(kid.teacher_id, fx.pinned), moduleCommands: [], ui: script.opening.ui, teacherOpening: script.opening.reply, teacherOpeningSeq: 1 });
    }
    if (p === "/api/lesson/turn") {
      const step = script.turns[Math.min(turnI, script.turns.length - 1)];
      turnI++;
      return json(200, { move: { kind: "hint", shape: "x" }, moduleCommands: [], ui: step.ui, teacherReply: step.reply, teacherReplySeq: 1 + turnI });
    }
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p === "/api/tts") return route.fulfill({ status: 200, contentType: "audio/wav", body: wav() });
    return json(404, { error: "unmocked" });
  });
  return st;
}
function wav(ms = 700) {
  const n = Math.round(16 * ms);
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  return b;
}

// ───────────── shared audits ─────────────
const HINGLISH = ["ghar", "ruko", "bolo", "bhejo", "phir", "shuru", "chalo", "paath", "pakka", "baari", "agla", "kyun", "karein", "karo", "mera", "meri", "naam", "nahi", "haan", "likho", "abhi", "suno", "kaise", "pata"];
async function audit(page, { young }) {
  const vw = page.viewportSize()?.width ?? 0;
  return page.evaluate(({ HINGLISH, young, vw }) => {
    const out = { en: [], names: [], dead: [], lamps: 0, tgt: [], hscroll: false };
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
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
    const nameOf = (el) => {
      const lb = el.getAttribute("aria-labelledby");
      if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
      if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent.trim(); }
      return (el.innerText ?? el.textContent ?? "").trim() || el.querySelector("img[alt]:not([alt=''])")?.getAttribute("alt") || el.getAttribute("title") || "";
    };
    for (const el of document.querySelectorAll("button, [role=button], [role=radio], a[href], input, textarea, select")) {
      if (!visible(el) || el.closest("[aria-hidden='true']")) continue;
      if (!nameOf(el)) out.names.push(el.outerHTML.slice(0, 90));
      const r = el.getBoundingClientRect();
      const min = young && !el.matches(".cs-grownups") ? 64 : 48;
      if (el.closest("[data-testid=lesson]")) continue; // the Desk has its own target audit (B1)
      if (!el.closest("p, .t-note, summary") && (r.width < min - 0.5 || r.height < min - 0.5) && el.tagName !== "INPUT")
        out.tgt.push(`<${min} ${Math.round(r.width)}x${Math.round(r.height)} ${(el.innerText || el.getAttribute("aria-label") || el.tagName).slice(0, 30)}`);
    }
    const main = document.querySelector("main") ?? document.body;
    for (const el of main.querySelectorAll("div, section, fieldset, li")) {
      if (!visible(el) || el.closest("[aria-hidden='true'], .scene, [aria-busy='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 48) continue;
      const has = (el.innerText ?? "").trim() || el.querySelector("img, svg, canvas, picture, video, input, textarea, button, a, [role=img]");
      if (!has) out.dead.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.height)}px`);
    }
    out.lamps = [...document.querySelectorAll("[data-lamp]")].filter((e) => !e.closest("[data-testid=lesson]")).length;
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

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const VIEWS = [{ w: 360, h: 640 }, { w: 1280, h: 800 }];
const errors = [];
async function open(fx, url, { w, h, theme = "light", storage = {} }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 720 ? 2 : 1, hasTouch: w < 720, isMobile: w < 720, colorScheme: theme, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${url}: ${e.message}`));
  const st = await mockApi(page, fx);
  const prefs = { ...(storage.hello ? { hello: true } : {}), theme };
  await page.addInitScript(([cid, p]) => { if (sessionStorage.getItem("__seeded")) return; sessionStorage.setItem("__seeded", "1"); localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify(p)); }, [fx.kid.id, prefs]);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(900);
  return { ctx, page, st };
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
const cardOf = (page) => page.locator("[data-testid=hello]").getAttribute("data-card");

try {
  // ═════════ N-HELLO: Older (two teachers → pick → name) and Young (one teacher → name) ═════════
  for (const who of ["kabir", "riya"]) {
    const young = who === "riya";
    const b = young ? "b1" : "b3";
    for (const v of VIEWS) for (const theme of young ? ["light"] : ["light", "dark"]) {
      const kid = structuredClone(KIDS[who]);
      const tag = `hello ${who} ${v.w} ${theme}`;
      const { ctx, page, st } = await open({ kid, tutors: young ? 1 : 2 }, `/c/${kid.id}/hello`, { ...v, theme });
      await page.waitForSelector("[data-testid=hello]", { timeout: 10_000 }).catch(() => {});
      const next = page.locator(young ? "[data-testid=hello-hear]" : "[data-testid=hello-next]");
      await next.click().catch(() => {});
      if (young) await page.locator("text=Next").first().click({ timeout: 2500 }).catch(() => {});
      await page.waitForFunction(() => document.querySelector("[data-testid=hello]")?.getAttribute("data-card") === "ai", null, { timeout: 8000 }).catch(() => {});
      check(`N-HELLO the AI card comes before naming ${tag}`, (await cardOf(page)) === "ai");
      await page.locator("[data-testid=hello-gotit]").click();
      await page.locator(".avatar-grid--hello .avatar-btn").nth(1).click();
      await page.locator("[data-testid=hello-thatsme]").click();
      await page.waitForTimeout(250);
      if ((await cardOf(page)) === "likes") await page.locator("[data-testid=hello-right]").click();
      await page.waitForTimeout(250);
      if (!young) {
        check(`N-HELLO two teachers: the pick comes first ${tag}`, (await cardOf(page)) === "teacher");
        await page.locator("[data-testid=choose-asha]").click();
        await page.locator("[data-testid=confirm-teacher]").click();
        await page.waitForTimeout(500);
      }
      check(`N-HELLO the naming step ${tag}`, (await cardOf(page)) === "name", await cardOf(page));
      const namer = page.locator("[data-testid=teacher-namer]");
      const sugg = await namer.locator(".tn-name").allInnerTexts();
      check(`N-HELLO suggestions Asha / Arjun / Uma, the look's own first ${tag}`, sugg.join(",") === (young ? "Asha,Arjun,Uma" : "Asha,Arjun,Uma"), sugg.join(","));
      check(`N-HELLO the AI line stays on the step ${tag}`, /your teacher is an AI/.test(await namer.innerText()));
      check(`N-HELLO "Use this name" waits for a name ${tag}`, await page.locator("[data-testid=name-use]").isDisabled());
      report(`${tag} name`, await audit(page, { young }));
      await shot(page, `hello__6-name__${b}__${v.w}__${theme}`);
      // refusals: romance, own name, a public figure, a bad shape (the shape one answers before any request)
      for (const [typed, reason] of [["Jaanu", "not_allowed"], [kid.first_name, "own_name"], ["Virat Kohli", "public_figure"]]) {
        await page.locator("[data-testid=name-input]").fill(typed);
        await page.locator("[data-testid=name-use]").click();
        await page.waitForSelector("[data-testid=name-retry]", { timeout: 4000 }).catch(() => {});
        const retry = page.locator("[data-testid=name-retry]");
        const said = await retry.innerText().catch(() => "");
        check(`N-HELLO refusal "${reason}" is a gentle retry ${tag}`, (await retry.getAttribute("data-reason").catch(() => null)) === reason && said.length > 10 && !said.includes(typed), said);
        check(`N-HELLO the field keeps what they typed ${tag} ${reason}`, (await page.locator("[data-testid=name-input]").inputValue()) === typed);
      }
      await shot(page, `hello__6-name-retry__${b}__${v.w}__${theme}`);
      report(`${tag} retry`, await audit(page, { young }));
      await page.locator("[data-testid=name-input]").fill("Asha2");
      check(`N-HELLO a bad shape is caught as they type ${tag}`, (await page.locator("[data-testid=name-use]").isDisabled()) && (await page.locator("[data-testid=name-input]").getAttribute("aria-invalid")) === "true");
      await page.locator("[data-testid=name-input]").fill("");
      await page.locator("[data-testid=name-Uma]").click();
      check(`N-HELLO a tapped suggestion is selected ${tag}`, (await page.locator("[data-testid=name-Uma]").getAttribute("aria-pressed")) === "true");
      const posts = st.names.length;
      await page.locator("[data-testid=name-use]").click();
      await page.waitForURL(/\/lesson\/new/, { timeout: 6000 }).catch(() => {});
      check(`N-HELLO the name is saved and lesson 1 opens ${tag}`, st.names.length === posts + 1 && st.names.at(-1).name === "Uma" && /\/lesson\/new/.test(page.url()), `${JSON.stringify(st.names.at(-1))} ${page.url()}`);
      if (!young) check(`N-HELLO the pick was saved before the name ${tag}`, st.chooses.join(",") === "asha");
      await ctx.close();
    }
  }

  // ═════════ N-TEACHER + N-ID: Your teacher with the child's name; rename; the home label ═════════
  for (const v of VIEWS) for (const theme of ["light", "dark"]) {
    const kid = { ...structuredClone(KIDS.kabir), teacher_name: "Rohan" };
    const tag = `teacher ${v.w} ${theme}`;
    let { ctx, page } = await open({ kid, tutors: 1 }, `/c/${kid.id}`, { ...v, theme, storage: { hello: true } });
    await page.waitForSelector("[data-teacher-id]", { timeout: 10_000 }).catch(() => {});
    const label = await page.locator("[data-ai-label]").first().innerText().catch(() => "");
    check(`N-ID home label carries the child's name and "AI teacher" ${tag}`, /^Rohan · AI teacher$/.test(label.trim()), label);
    report(`${tag} home`, await audit(page, { young: false }));
    await shot(page, `home__named-teacher__b3__${v.w}__${theme}`);
    await ctx.close();
    ({ ctx, page } = await open({ kid, tutors: 1 }, `/c/${kid.id}/teacher`, { ...v, theme, storage: { hello: true } }));
    await page.waitForSelector("[data-testid=teacher-name-row]", { timeout: 10_000 }).catch(() => {});
    check(`N-TEACHER the name in use ${tag}`, /Your teacher's name: Rohan/.test(await page.locator("[data-testid=teacher-name-row]").innerText().catch(() => "")));
    check(`N-ID Your-teacher card name ${tag}`, (await page.locator(".tc-one .tc-name").innerText().catch(() => "")) === "Rohan");
    report(`${tag} card`, await audit(page, { young: false }));
    await shot(page, `teacher__named__b3__${v.w}__${theme}`);
    await page.locator("[data-testid=name-change]").click();
    await page.waitForSelector("[data-testid=teacher-namer]", { timeout: 4000 }).catch(() => {});
    check(`N-TEACHER the step opens with the current name ${tag}`, (await page.locator("[data-testid=name-input]").inputValue()) === "Rohan");
    check(`N-KEEP with a custom name the secondary button says what it does ("Go back to Arjun") ${tag}`,
      (await page.locator("[data-testid=name-keep]").innerText().catch(() => "")).trim() === "Go back to Arjun");
    await page.locator("[data-testid=name-input]").fill("miss tara");
    report(`${tag} rename`, await audit(page, { young: false }));
    await shot(page, `teacher__rename__b3__${v.w}__${theme}`);
    await page.locator("[data-testid=name-use]").click();
    await page.waitForSelector("[data-testid=name-saved]", { timeout: 5000 }).catch(() => {});
    check(`N-TEACHER the rename is saved and announced ${tag}`, /now called Miss Tara/.test(await page.locator("[data-testid=name-saved]").innerText().catch(() => "")));
    await page.waitForTimeout(600);
    check(`N-ID the new name is on the card after the save ${tag}`, (await page.locator(".tc-one .tc-name").innerText().catch(() => "")) === "Miss Tara");
    await ctx.close();
  }

  // ═════════ N-PIN: the lesson's pinned name; the hint line ═════════
  for (const v of VIEWS) for (const theme of ["light", "dark"]) {
    const kid = { ...structuredClone(KIDS.kabir), class_level: 8, teacher_name: "Tara" }; // renamed after the lesson began as Rohan
    const tag = `lesson ${v.w} ${theme}`;
    const { ctx, page } = await open({ kid, tutors: 1, lesson: true, pinned: "Rohan" }, `/c/${kid.id}/lesson/new?mode=text`, { ...v, theme, storage: { hello: true } });
    await page.waitForSelector("[data-testid=lesson]", { timeout: 20_000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector("[data-testid=lesson]")?.getAttribute("data-floor") === "your_turn", null, { timeout: 20_000 }).catch(() => {});
    const txt = await page.locator("[data-testid=lesson]").innerText().catch(() => "");
    const ai = await page.locator("[data-ai-label], [data-ai-tag]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") || e.textContent)).catch(() => []);
    check(`N-PIN the lesson shows the name it started with ${tag}`, ai.some((x) => /Rohan/.test(x)) && !/Tara/.test(txt) && !ai.some((x) => /Tara/.test(x)), ai.join(" | "));
    check(`N-PIN the AI label goes with the name ${tag}`, ai.some((x) => /Rohan.*AI teacher/.test(x)), ai.join(" | "));
    await shot(page, `lesson__pinned-name__b3__${v.w}__${theme}`);
    // turn 1 (correct), then turn 2 carries ui.hint
    for (const ans of ["one half", "three"]) {
      await page.locator("[data-testid=child-input]").fill(ans).catch(() => {});
      await page.locator("[data-testid=send]").click().catch(() => {});
      await page.waitForFunction(() => document.querySelector("[data-testid=lesson]")?.getAttribute("data-floor") === "your_turn", null, { timeout: 15_000 }).catch(() => {});
    }
    const q = await page.locator("[data-testid=question-card]").innerText().catch(() => "");
    check(`N-PIN the hint line shows under the ask with its rung ${tag}`, /Count the shaded quarters/.test(q) && (await page.locator(".dk-rung").count()) === 1, q.slice(0, 160));
    await shot(page, `lesson__hint-line__b3__${v.w}__${theme}`);
    await ctx.close();
  }

  // ═════════ N-PARENT: the parent row (rendered where the parent corner mounts it) ═════════
  for (const v of VIEWS) for (const theme of ["light", "dark"]) {
    const kid = { ...structuredClone(KIDS.kabir), teacher_name: "Rohan" };
    const tag = `parent ${v.w} ${theme}`;
    const { ctx, page, st } = await open({ kid, tutors: 1, history: [{ name: "Rohan", characterId: "arjun", source: "child", at: "2026-10-03T08:00:00Z" }, { name: "Miss Tara", characterId: "arjun", source: "child", at: "2026-10-02T08:00:00Z" }] },
      `/parent/controls?c=${kid.id}`, { ...v, theme });
    const row = page.locator("[data-testid=parent-teacher-name]");
    const mounted = await row.waitFor({ timeout: 8000 }).then(() => true, () => false);
    check(`N-PARENT the row is mounted in Controls ${tag}`, mounted, mounted ? "" : "not mounted (parent-corner owner: <ParentTeacherName childId childName />)");
    if (mounted) {
      const t = await row.innerText();
      check(`N-PARENT shows the name and the AI note ${tag}`, /Kabir calls the teacher Rohan/.test(t) && /talking to an AI/.test(t), t.slice(0, 160));
      check(`N-PARENT earlier names exclude the one in use ${tag}`, (await row.locator(".ptn-history li").allInnerTexts()).join(",") === "Miss Tara");
      await row.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, `parent__teacher-name__adult__${v.w}__${theme}`);
      // Change: the same naming step, as the parent (the real predicate decides)
      await page.locator("[data-testid=parent-teacher-name-change]").click();
      const namer = row.locator("[data-testid=teacher-namer]");
      const opened = await namer.waitFor({ timeout: 4000 }).then(() => true, () => false);
      check(`N-PARENT Change opens the naming step with a parent title ${tag}`, opened && /Choose a name for the teacher/.test(await namer.innerText()));
      await row.locator("[data-testid=name-input]").fill("Mybaby");
      await row.locator("[data-testid=name-use]").click();
      await row.locator("[data-testid=name-retry]").waitFor({ timeout: 4000 }).catch(() => {});
      check(`N-PARENT a refused name gets the gentle retry, not echoed ${tag}`, (await row.locator("[data-testid=name-retry]").getAttribute("data-reason").catch(() => null)) === "not_allowed"
        && !(await row.locator("[data-testid=name-retry]").innerText()).includes("Mybaby"));
      await row.locator("[data-testid=name-input]").fill("Meenu");
      report(`${tag} change`, await audit(page, { young: false }));
      await namer.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, `parent__teacher-name-change__adult__${v.w}__${theme}`);
      await row.locator("[data-testid=name-use]").click();
      await page.waitForTimeout(500);
      check(`N-PARENT Change sends { name, source: parent } ${tag}`, st.names.at(-1)?.name === "Meenu" && st.names.at(-1)?.source === "parent", JSON.stringify(st.names.at(-1)));
      check(`N-PARENT the row shows the new name ${tag}`, /Kabir calls the teacher Meenu/.test(await row.innerText()) && /from the next lesson/.test(await row.innerText()));
      await page.locator("[data-testid=parent-teacher-name-reset]").click();
      await page.waitForTimeout(500);
      check(`N-PARENT Reset sends { name: null, source: parent } ${tag}`, st.names.at(-1)?.name === null && st.names.at(-1)?.source === "parent", JSON.stringify(st.names.at(-1)));
      check(`N-PARENT after Reset the look's own name ${tag}`, /uses the teacher's own name, Arjun/.test(await row.innerText()));
    }
    await ctx.close();
  }
  // ═════════ N-KEEP: first run, a failing name route, Keep {T} still gets the child to lesson 1 ═════════
  for (const [v, theme] of [[VIEWS[0], "light"], [VIEWS[1], "dark"]]) {
    const kid = structuredClone(KIDS.kabir);
    const tag = `keep ${v.w} ${theme}`;
    const { ctx, page, st } = await open({ kid, tutors: 1, nameFails: true }, `/c/${kid.id}/hello`, { ...v, theme });
    await page.waitForSelector("[data-testid=hello]", { timeout: 10_000 }).catch(() => {});
    await page.locator("[data-testid=hello-next]").click().catch(() => {});
    await page.waitForFunction(() => document.querySelector("[data-testid=hello]")?.getAttribute("data-card") === "ai", null, { timeout: 8000 }).catch(() => {});
    await page.locator("[data-testid=hello-gotit]").click().catch(() => {});
    await page.locator(".avatar-grid--hello .avatar-btn").nth(1).click().catch(() => {});
    await page.locator("[data-testid=hello-thatsme]").click().catch(() => {});
    await page.waitForTimeout(250);
    if ((await cardOf(page)) === "likes") await page.locator("[data-testid=hello-right]").click();
    await page.waitForTimeout(250);
    check(`N-KEEP the naming step ${tag}`, (await cardOf(page)) === "name", await cardOf(page));
    check(`N-KEEP the button reads "Keep Arjun" ${tag}`, (await page.locator("[data-testid=name-keep]").innerText().catch(() => "")).trim() === "Keep Arjun");
    await page.locator("[data-testid=name-keep]").click();
    await page.waitForURL(/\/lesson\/new/, { timeout: 6000 }).catch(() => {});
    check(`N-KEEP Keep writes nothing and lesson 1 opens though the route fails ${tag}`, st.names.length === 0 && /\/lesson\/new/.test(page.url()), `${st.names.length} POST(s) ${page.url()}`);
    await ctx.close();
  }

  // ═════════ N-REAL: the naming step against the real routes and the Neon TEST branch ═════════
  await realRun();
} finally {
  await browser.close();
  srv.kill();
}

async function realRun() {
  const envFile = path.join(ROOT, ".env.local");
  const fromEnv = (n) => process.env[n] || (fs.existsSync(envFile) ? (fs.readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(n + "=")) || "").slice(n.length + 1).replace(/^"(.*)"$/, "$1") : "");
  const TEST = fromEnv("CONDUCTOR_TEST_DATABASE_URL"), PROD = fromEnv("DATABASE_URL");
  const host = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
  if (!TEST || (PROD && host(TEST) === host(PROD))) {
    console.log(`SKIP N-REAL: ${!TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : "the test URL is the production endpoint"}`);
    results.push({ name: "N-REAL skipped", ok: true, detail: "no test branch", skipped: true });
    return;
  }
  const { createHash, randomUUID } = await import("crypto");
  process.env.DATABASE_URL = TEST;
  const { q, one } = await import("../server/db.js");
  const port = await freePort();
  const REAL = `http://127.0.0.1:${port}`;
  const real = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, DATABASE_URL: TEST, DB_DRIVER: "", PORT: String(port), TAXILA_DIST: dist }, stdio: ["ignore", "pipe", "pipe"] });
  let realLog = "";
  real.stdout.on("data", (d) => { realLog += d; });
  real.stderr.on("data", (d) => { realLog += d; });
  let guardian = null;
  try {
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${REAL}/`)).ok) break; } catch { /* starting */ }
      await new Promise((r) => setTimeout(r, 150));
    }
    const run = randomUUID().slice(0, 8);
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'lsn-e2e') returning id", [`lsn-e2e+${run}@test.invalid`])).id;
    const token = randomUUID() + randomUUID();
    // a PIN exists and this session has the corner unlocked (as after the parent typed it): the gate is the real one
    await q("insert into auth_session (token_hash, guardian_id, expires_at, parent_unlocked_until) values ($1, $2, now() + interval '1 day', now() + interval '30 minutes')", [createHash("sha256").update(token).digest("hex"), guardian]);
    const { hashSecret } = await import("../server/routes/parent.js");
    await q("insert into guardian_pin (guardian_id, pin_hash) values ($1, $2)", [guardian, await hashSecret("2580")]);
    const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Kabir', 6, 'english', 'arjun') returning id", [guardian])).id;
    for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [guardian, p]);
    for (const [v, theme] of [[VIEWS[0], "light"], [VIEWS[1], "dark"]]) {
      const tag = `real ${v.w} ${theme}`;
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.w < 720 ? 2 : 1, hasTouch: v.w < 720, isMobile: v.w < 720, colorScheme: theme, serviceWorkers: "block" });
      await ctx.addCookies([{ name: "tx_session", value: token, url: REAL }]);
      const page = await ctx.newPage();
      page.on("pageerror", (e) => errors.push(`real: ${e.message}`));
      await page.addInitScript(([cid, p]) => { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify(p)); }, [kid, { hello: true, theme }]);
      await page.goto(`${REAL}/c/${kid}/teacher`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-testid=name-change]", { timeout: 15_000 }).catch(() => {});
      await page.locator("[data-testid=name-change]").click().catch(() => {});
      await page.waitForSelector("[data-testid=teacher-namer]", { timeout: 6000 }).catch(() => {});
      const bad = v.w < 720 ? "Not An Ai" : "Mybaby";
      await page.locator("[data-testid=name-input]").fill(bad);
      await page.locator("[data-testid=name-use]").click();
      await page.waitForSelector("[data-testid=name-retry]", { timeout: 8000 }).catch(() => {});
      check(`N-REAL the server's 422 is the gentle retry (${bad}) ${tag}`, (await page.locator("[data-testid=name-retry]").getAttribute("data-reason").catch(() => null)) === "not_allowed");
      const good = v.w < 720 ? "Meenu" : "Rao Sir";
      await page.locator("[data-testid=name-input]").fill(good.toLowerCase());
      await shot(page, `real__teacher-rename__b3__${v.w}__${theme}`);
      await page.locator("[data-testid=name-use]").click();
      await page.waitForSelector("[data-testid=name-saved]", { timeout: 8000 }).catch(() => {});
      const row = await one("select teacher_name from child where id = $1", [kid]);
      const hist = await one("select name, source, character_id from teacher_name_history where child_id = $1 order by at desc limit 1", [kid]);
      check(`N-REAL stored with its history row ${tag}`, row?.teacher_name === good && hist?.name === good && hist?.source === "child" && hist?.character_id === "arjun", JSON.stringify({ row, hist }));
      const me = await page.evaluate(async () => (await fetch("/api/me")).json());
      check(`N-REAL /api/me returns the name ${tag}`, me.children?.find((c) => c.id === kid)?.teacher_name === good);
      check(`N-REAL the card shows the name ${tag}`, (await page.locator(".tc-one .tc-name").innerText().catch(() => "")) === good);
      report(`${tag} teacher`, await audit(page, { young: false }));
      // the parent row (behind the real gate, unlocked for this session), Change as the parent
      await page.goto(`${REAL}/parent/controls?c=${kid}`, { waitUntil: "domcontentloaded" });
      // the client gate asks for the PIN on a fresh page: typed on its pad, checked by the real POST /api/parent/unlock
      if (await page.getByText("Enter your parent PIN").waitFor({ timeout: 8000 }).then(() => true, () => false)) {
        for (const d of "2580") await page.getByRole("button", { name: d, exact: true }).click();
        await page.getByRole("button", { name: "OK", exact: true }).click().catch(() => {});
      }
      const prow = page.locator("[data-testid=parent-teacher-name]");
      const mounted = await prow.locator("[data-testid=parent-teacher-name-line]").waitFor({ timeout: 15_000 }).then(() => true, () => false);
      check(`N-REAL the parent row reads the real GET ${tag}`, mounted && new RegExp(`calls the teacher ${good}`).test(await prow.innerText().catch(() => "")), mounted ? "" : `${(await page.locator("body").innerText().catch(() => "")).slice(0, 300)} ${page.url()}`);
      if (mounted) {
        await prow.locator("[data-testid=parent-teacher-name-change]").click();
        await prow.locator("[data-testid=name-input]").fill("Tara");
        await prow.locator("[data-testid=name-use]").click();
        await page.waitForTimeout(1500);
        const h2 = await one("select name, source from teacher_name_history where child_id = $1 order by at desc limit 1", [kid]);
        check(`N-REAL the parent's Change is stored as source 'parent' ${tag}`, h2?.name === "Tara" && h2?.source === "parent", JSON.stringify(h2));
        await prow.scrollIntoViewIfNeeded().catch(() => {});
        await shot(page, `real__parent-change__adult__${v.w}__${theme}`);
      }
      await ctx.close();
    }
  } catch (e) {
    check("N-REAL ran", false, `${e.message} ${realLog.slice(-300)}`);
  } finally {
    if (guardian) await q("delete from guardian where id = $1", [guardian]).catch(() => {});
    real.kill();
  }
}

const real = errors.filter((e) => !/AudioContext|play\(\)|NotAllowedError|autoplay/i.test(e));
check("no page errors", real.length === 0, real.slice(0, 3).join(" | "));
const fail = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(SHOTS, "results.json"), JSON.stringify({ date: new Date().toISOString(), pass: results.length - fail.length, fail: fail.length, results }, null, 2));
console.log(`\n${results.length - fail.length}/${results.length} passed; shots in ${path.relative(ROOT, SHOTS)}`);
process.exit(fail.length ? 1 : 0);
