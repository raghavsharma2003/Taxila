// E2E experience review walker (2026-10-07): the real client in a phone viewport against the local server on Neon TEST.
// One family: signup (class 4 child, Asha), Hello, the first lesson driven like a child (right, wrong, partial, steering,
// visuals, goodbye), the next day (test clock +24 h), then a class 6 and a class 7 sibling the same way.
// Every turn: the silence from submit to her first audible sample (page audio hooks), her pace (audio seconds vs words).
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8811 node walk.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { kidClip } from "./kidtts.mjs";
const BASE = (process.env.TAXILA_BASE || "http://127.0.0.1:8811").replace(/\/+$/, "");
const SHOTS = process.env.WALK_SHOTS || "/home/user/Taxila/docs/design/round2/review-shots/";
const OUT = new URL("./", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const PIN = "1357";
const ONLY = process.env.WALK_ONLY || "4,6,7";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");

function kitItem(itemId) {
  const m = /^(c\d+-[a-z]+)-/.exec(String(itemId ?? ""));
  if (!m) return null;
  const f = `/home/user/Taxila/data/kits/${m[1]}.json`;
  if (!existsSync(f)) return null;
  for (const t of JSON.parse(readFileSync(f, "utf8")).topics ?? []) for (const it of t.items ?? []) if (it.id === itemId) return it;
  return null;
}

const INIT = () => {
  const ev = (window.__ev = []);
  const now = () => performance.now();
  let ctxN = 0;
  // a fake microphone: the child's voice clips are played into it (window.__say)
  let kidCtx = null, kidDest = null;
  const kid = () => { if (!kidCtx) { kidCtx = new AudioContext({ sampleRate: 48000 }); kidCtx.__kid = true; kidDest = kidCtx.createMediaStreamDestination(); } return kidCtx; };
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { await kid().resume().catch(() => {}); return kidDest.stream; };
  window.__say = async (b64) => {
    const c = kid(); await c.resume().catch(() => {});
    const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const ab = await c.decodeAudioData(u.buffer);
    const src = c.createBufferSource(); src.buffer = ab; src.connect(kidDest);
    const t0 = now(); src.start();
    ev.push({ t: "kid_start", at: t0, dur: ab.duration }); ev.push({ t: "kid_end", at: t0 + ab.duration * 1000 });
    return ab.duration;
  };
  const ctxs = (window.__ctxs = []);
  const AC0 = window.AudioContext;
  window.AudioContext = function (...a) { const c = new AC0(...a); ctxs.push(c); ev.push({ t: "ctx_new", at: now(), n: ctxs.length, state: c.state }); return c; };
  window.AudioContext.prototype = AC0.prototype;
  const CBS = BaseAudioContext.prototype.createBufferSource;
  BaseAudioContext.prototype.createBufferSource = function () { const n = CBS.call(this); if (!this.__kid) { const st0 = n.start; const c = this; n.start = function (when = 0, ...r) { try { c.__id ??= ++ctxN; const lead = Math.max(0, (when || 0) - c.currentTime); ev.push({ t: "src2", ctx: c.__id, at: now() + lead * 1000, dur: n.buffer?.duration ?? 0, sr: n.buffer?.sampleRate ?? 0, state: c.state }); } catch { /* */ } return st0.call(n, when, ...r); }; } return n; };
  const S = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, ...r) {
    try {
      const c = this.context;
      if (c.__kid) return S.call(this, when, ...r);
      c.__id ??= ++ctxN;
      const lead = Math.max(0, (when || 0) - c.currentTime);
      ev.push({ t: "src", ctx: c.__id, at: now() + lead * 1000, dur: this.buffer?.duration ?? 0, sr: this.buffer?.sampleRate ?? 0, state: c.state, ol: (c.outputLatency || c.baseLatency || 0) * 1000 });
    } catch { /* */ }
    return S.call(this, when, ...r);
  };
  const P = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const el = this;
    el.addEventListener("playing", () => ev.push({ t: "playing", at: now(), dur: el.duration, src: String(el.currentSrc || "").slice(-60) }), { once: true });
    el.addEventListener("ended", () => ev.push({ t: "ended", at: now(), dur: el.duration }), { once: true });
    return P.call(this);
  };
  const mark = () => ev.push({ t: "submit", at: now() });
  document.addEventListener("click", (e) => {
    const b = e.target?.closest?.('[data-testid="send"],[data-testid="pad-send"],[data-testid="choices"] button,.dk-key--send');
    if (b) mark();
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target?.closest?.('[data-testid="child-input"]')) mark(); }, true);
};

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
await context.addInitScript(INIT);
await context.grantPermissions(["microphone"], { origin: BASE }).catch(() => {});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error" || /cascade|transcri|fallback|reconnect/i.test(m.text())) errors.push(`console.${m.type()}: ` + m.text().slice(0, 200)); });
const btn = (re) => page.locator("button", { hasText: re }).first();
const pause = (ms) => page.waitForTimeout(ms);
let shotN = 0;
const shoot = async (name) => { const f = `${SHOTS}${String(++shotN).padStart(2, "0")}-${name}.png`; await page.screenshot({ path: f }).catch(() => {}); return f; };
const st = Date.now(), rnd = Math.random().toString(36).slice(2, 6);
const email = `prod-e2erev+${st}${rnd}@taxila.test`, password = `prod-pw-${st}-${rnd}`;
writeFileSync(`${OUT}creds-${st}.json`, JSON.stringify({ email, password }));
const log = { email: email.replace(/\+.*@/, "+…@"), children: [], errors, notes: [] };
const turns = [];
page.on("response", async (res) => {
  const u = res.url();
  if (!/\/api\/lesson\/(turn|start)$/.test(u)) return;
  const j = await res.json().catch(() => null);
  let body = null; try { body = res.request().postDataJSON(); } catch { /* */ }
  if (j) turns.push({ at: Date.now(), kind: u.endsWith("/start") ? "start" : "turn", j, sent: body ? { text: body.childText, typed: body.typed, asr: body.asrConfidence, chipId: body.chipId } : null });
});
// in-page fetch: Playwright's request jar drops the Secure session cookie on http://127.0.0.1 (every page.request call was 401)
const api = (method, path, data) => page.evaluate(async ({ method, path, data }) => { const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), credentials: "include" }); let j = {}; try { j = await r.json(); } catch { /* */ } return { status: r.status, ...j }; }, { method, path, data });

/** Audio facts since index `from` of __ev: first sound after the last submit, total seconds of her voice. */
async function audioSince(from) {
  const ev = await page.evaluate((f) => window.__ev.slice(f), from);
  return ev;
}
const evLen = () => page.evaluate(() => window.__ev.length);

/** Her voice = 24 kHz PCM stream chunks (or the whole-clip element). Wait for her first chunk after `since` (max 25 s),
 *  then until 1.5 s after the last scheduled chunk ends (max 45 s). */
const isVoice = (e) => (e.t === "src" && e.sr === 24000) || e.t === "playing";
async function waitQuiet(from, maxMs = 45_000, since = 0) {
  const t0 = Date.now();
  for (;;) {
    const ev = await audioSince(from);
    const v = ev.filter((e) => isVoice(e) && e.at >= since);
    const pn = await page.evaluate(() => performance.now());
    const endAt = v.length ? Math.max(...v.filter((e) => e.t === "src").map((e) => e.at + e.dur * 1000), 0) : 0;
    const playing = ev.filter((e) => e.t === "playing").length > ev.filter((e) => e.t === "ended").length;
    if (v.length && pn - endAt > 1500 && !playing) return ev;
    if (Date.now() - t0 > maxMs) return ev;
    if (!v.length && Date.now() - t0 > 25_000) return ev;
    await pause(300);
  }
}

/** One child turn through the real client; returns the server reply + audio timing. */
const floorNow = () => page.evaluate(() => document.querySelector('[data-testid="dock"]')?.getAttribute("data-floor") ?? null).catch(() => null);
async function waitFloor(want, maxMs) { const t0 = Date.now(); let f; while (Date.now() - t0 < maxMs) { f = await floorNow(); if (want.includes(f)) return f; await pause(200); } return f; }
async function childSays(label, text, { chip = null, voice = false } = {}) {
  const floorBefore = await waitFloor(["your_turn"], 45_000);
  await pause(400);
  const from = await evLen();
  const n = turns.length;
  const tSend = Date.now();
  if (voice && !chip) {
    const clip = (await kidClip(text)).toString("base64");
    const mic = page.locator('[data-testid="mic"]:not([disabled])');
    for (let i = 0; i < 40 && !(await mic.isVisible().catch(() => false)); i++) await pause(250);
    await mic.click().catch(() => {});
    const fl = await waitFloor(["listening"], 4000);
    await pause(250);
    const kd = await page.evaluate((b) => window.__say(b), clip);
    if (fl !== "listening") console.log(`   (mic tap: floor ${fl})`);
    // local transport is the push-to-talk fallback (no WebRTC from the sandbox): "tap the mic, then tap Done" — a quick
    // child taps Done 300 ms after their last word
    await pause(kd * 1000 + 300);
    const fl2 = await floorNow();
    if (fl2 === "listening") { await page.evaluate(() => window.__ev.push({ t: "done_tap", at: performance.now() })); await page.locator('[data-testid="mic"]').click().catch(() => {}); }
  } else if (chip) {
    const chips = page.locator('[data-testid="choices"] button');
    const pick = chips.filter({ hasText: chip });
    if (await pick.count()) await pick.first().click(); else return { label, text, error: `no chip ${chip}` };
  } else if (await page.locator('[data-testid="number-pad"]').isVisible().catch(() => false) && /^[\d,\/ ]+$/.test(text)) {
    for (const d of text.replace(/\s/g, "")) {
      const k = page.locator('[data-testid="number-pad"] .dk-key', { hasText: new RegExp(`^${d === "/" ? "\\/" : d}$`) });
      if (await k.count()) await k.first().click();
    }
    await page.locator('[data-testid="pad-send"], [data-testid="number-pad"] .dk-key--send').first().click();
  } else if (await page.locator('[data-testid="number-pad"]').isVisible().catch(() => false)) {
    // a number item: the typed dock has the pad and Hint only — no way to type words
    const hint = page.locator('[data-testid="hint"]');
    if (/pata nahi|samajh nahi|help/i.test(text) && await hint.isVisible().catch(() => false)) { await hint.click(); await pause(800); const h1 = page.locator('[data-testid="hint-sheet"] button').first(); if (await h1.isVisible().catch(() => false)) await h1.click(); }
    else { const row = { label, text, blocked: "number pad up: the typed dock has no way to type words" }; console.log(`  [${label}] "${text}" → BLOCKED (number pad, no text entry)`); row.shot = await shoot(`${curTag}-${label}-blocked`); return row; }
  } else {
    const input = page.locator('[data-testid="child-input"]');
    if (!(await input.isVisible().catch(() => false))) {
      const close = page.locator('[data-testid="type-close"]');
      await page.locator('[data-testid="type"]').click().catch(() => {});
      await pause(300);
      if (!(await input.isVisible().catch(() => false)) && await close.isVisible().catch(() => false)) { await close.click(); await pause(200); await page.locator('[data-testid="type"]').click().catch(() => {}); }
    }
    await input.fill(text);
    await page.locator('[data-testid="send"]').click();
  }
  for (let i = 0; i < 240 && turns.length <= n; i++) await pause(250);
  const r = turns.length > n ? turns[n].j : null;
  const sentAs = turns.length > n ? turns[n].sent : null;
  const extraTurns = turns.length - n - 1;
  const tResp = Date.now();
  const ev0 = await audioSince(from);
  const submit0 = ev0.find((e) => e.t === "done_tap") ?? ev0.find((e) => e.t === "kid_end") ?? ev0.find((e) => e.t === "submit");
  const ev = r ? await waitQuiet(from, 45_000, submit0?.at ?? 0) : ev0;
  const submit = ev.find((e) => e.t === "done_tap") ?? ev.find((e) => e.t === "kid_end") ?? ev.find((e) => e.t === "submit");
  const heardEv = ev.filter(isVoice);
  const first = heardEv.find((e) => !submit || e.at >= submit.at);
  const receipt = ev.find((e) => e.t === "src" && e.sr !== 24000 && (!submit || e.at >= submit.at));
  const secs = ev.filter((e) => e.t === "src" && e.sr === 24000 && (!submit || e.at >= submit.at)).reduce((a, e) => a + e.dur, 0) || (ev.find((e) => e.t === "playing")?.dur ?? 0);
  const reply = String(r?.teacherReply ?? "");
  const words = reply.split(/\s+/).filter(Boolean).length;
  const row = {
    label, text, floorBefore, extraTurns, heardAs: sentAs, kind: r?.move?.kind ?? null, request: r?.move?.request ?? null, verdict: r?.ui?.verdict ?? null, end: !!r?.end,
    ask: r?.ui?.ask?.text ?? null, itemId: r?.ui?.ask?.itemId ?? null, tray: r?.ui?.tray ?? null, stage: r?.ui?.studioSlot?.kind ?? r?.ui?.studioSlot?.intentId ?? null,
    chips: (r?.ui?.chips ?? []).map((c) => c.label), reply,
    httpMs: tResp - tSend, silenceMs: submit && first ? Math.round(first.at - submit.at) : null, receiptMs: submit && receipt ? Math.round(receipt.at - submit.at) : null, speechEndToDoneMs: (() => { const k = ev.find((e) => e.t === "kid_end"), d = ev.find((e) => e.t === "done_tap"); return k && d ? Math.round(d.at - k.at) : null; })(), audioSec: Math.round(secs * 10) / 10, words,
    wpm: secs > 0.5 ? Math.round(words / (secs / 60)) : null,
    byCtx: Object.fromEntries([...new Set(ev.filter((e) => e.t === "src").map((e) => e.ctx))].map((c) => { const xs = ev.filter((e) => e.t === "src" && e.ctx === c && (!submit || e.at >= submit.at)); return [c, { first: xs.length && submit ? Math.round(xs[0].at - submit.at) : null, n: xs.length, sec: Math.round(xs.reduce((a, e) => a + e.dur, 0) * 100) / 100, sr: xs[0]?.sr }]; })),
    kidSec: ev.find((e) => e.t === "kid_start")?.dur ?? null, ctxs: [...new Set(ev.filter((e) => e.t === "src").map((e) => `${e.ctx}@${e.sr}`))],
  };
  const stageState = await page.evaluate(() => { const s = document.querySelector('[data-testid="studio-stage"]'); return s ? `${s.getAttribute("data-kind")}/${s.getAttribute("data-state")}` : null; }).catch(() => null);
  row.stageDom = stageState;
  row.shot = await shoot(`${curTag}-${label}`);
  console.log(`  [${label}] "${text}" → ${row.kind}${row.request ? "/" + row.request : ""} v=${row.verdict ?? "-"} end=${row.end} silence=${row.silenceMs}ms audio=${row.audioSec}s wpm=${row.wpm} stage=${stageState} | ${reply.slice(0, 160)}`);
  return row;
}
let curTag = "c4";

function arith(q) {
  const t = String(q ?? "").replace(/,(?=\d{3})/g, "");
  let m = /(\d+)\s*(?:times|×|x|\*)\s*\(\s*(\d+)\s*(?:plus|\+)\s*(\d+)\s*\)/i.exec(t);
  if (m) return String(+m[1] * (+m[2] + +m[3]));
  m = /(\d+)\s*(\+|plus|aur|−|-|minus|×|x|times|\*|÷|\/)\s*(\d+)/i.exec(t);
  if (!m) return null;
  const a = +m[1], b = +m[3], op = m[2].toLowerCase();
  if (/^(\+|plus|aur)$/.test(op)) return String(a + b);
  if (/^(−|-|minus)$/.test(op)) return String(a - b);
  if (/^(×|x|times|\*)$/.test(op)) return String(a * b);
  if (/^(÷|\/)$/.test(op) && b && a % b === 0) return String(a / b);
  return null;
}
function answers(r) {
  const it = kitItem(r?.ui?.ask?.itemId);
  if (!it) {
    const k = arith(r?.ui?.ask?.text ?? r?.teacherReply);
    return k ? { key: k, wrong: String(+k + 7), partial: k.slice(0, -1) || "1", form: "arith", id: r?.ui?.ask?.itemId ?? null } : null;
  }
  const key = String(it.answer);
  const num = /^-?[\d,]+$/.test(key);
  const frac = /^\d+\/\d+$/.test(key);
  const wrong = num ? String(Number(key.replace(/,/g, "")) + 7) : frac ? "1/9" : (it.options?.find((o) => String(o.text ?? o) !== key)?.text ?? "pata nahi, shayad sau");
  const partial = /,|\band\b|aur/.test(key) && !num ? key.split(/,|\band\b|aur/)[0].trim() : num ? key.replace(/,/g, "").slice(0, -1) || "1" : frac ? key.split("/")[0] : key.split(/\s+/)[0];
  return { key, wrong, partial, form: it.kind ?? it.form ?? null, id: it.id };
}

async function lessonFor(tag, startedResp, plan, { voice = false } = {}) {
  curTag = tag;
  const rows = [];
  let last = startedResp;
  const opening = String(last?.teacherReply ?? last?.teacherOpening ?? "");
  console.log(`  [open] ${last?.move?.kind} | ${opening.slice(0, 200)}`);
  rows.push({ label: "open", kind: last?.move?.kind, reply: opening, ask: last?.ui?.ask?.text });
  // let the opening play
  await waitQuiet(0, 30_000);
  for (const step of plan) {
    if (last?.end) break;
    let text = step.text, chip = null;
    if (step.answer) {
      const a = answers(last);
      if (!a) { text = step.fallback ?? (rows.length <= 1 ? "mujhe batting pasand hai" : "pata nahi, aap batao"); }
      else text = a[step.answer];
    }
    if (step.chip) chip = step.chip;
    const row = await childSays(step.label, text, { chip, voice });
    row.lane = voice ? "voice" : "typed";
    if (step.answer) row.truth = step.answer;
    rows.push(row);
    if (turns.length) last = turns.at(-1).j;
    await pause(600);
  }
  writeFileSync(`${OUT}ev-${tag}.json`, JSON.stringify(await page.evaluate(() => ({ ev: window.__ev, ctx: (window.__ctxs || []).map((c) => c.state) }))));
  return rows;
}

const PLAN0 = [
  { label: "a1-right", answer: "key" },
  { label: "a2-wrong", answer: "wrong" },
  { label: "a3-partial", answer: "partial" },
  { label: "s-example", text: "example do" },
  { label: "a4-right", answer: "key" },
  { label: "s-diagram", text: "diagram bana ke samjhao na" },
  { label: "s-story", text: "story ki tarah samjhao" },
  { label: "s-slow", text: "slowly please" },
  { label: "a5-right", answer: "key" },
  { label: "s-hindi", text: "Hindi mein samjhao" },
  { label: "a6-after-hindi", answer: "key" },
  { label: "s-animation", text: "animation dikhao" },
  { label: "s-else", text: "something else karte hain" },
  { label: "a7-wrong", answer: "wrong" },
  { label: "a8-right", answer: "key" },
  { label: "bye", text: "ok bye, kal milte hain" },
];

const PLAN = process.env.WALK_SHORT ? PLAN0.slice(0, 3) : PLAN0;
page.on("response", (r) => { if (/tts|speech|voice/.test(r.url())) log.notes.push(`net ${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`); });
try {
  // ───────── signup, class 4 ─────────
  await page.goto(`${BASE}/start/class`, { waitUntil: "networkidle" });
  await shoot("signup-class");
  await btn(/^\s*Class 4\s*$/).click();
  await btn(/^\s*CBSE/).click();
  await btn(/Continue/).click();
  await pause(800);
  await shoot("signup-meet-teacher");
  const teacherBtns = await page.locator("button").allInnerTexts();
  log.notes.push(`meet-teacher buttons: ${teacherBtns.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ").slice(0, 400)}`);
  const asha = page.locator("button, [role=radio]", { hasText: /Asha/ }).first();
  if (await asha.isVisible().catch(() => false)) await asha.click();
  await btn(/Hindi and English mix/).click();
  await btn(/Continue/).click();
  await pause(800);
  await btn(/Type the word parent/).click();
  await page.locator("input:visible").last().fill("parent");
  await page.keyboard.press("Enter");
  await pause(1000);
  await page.locator('input[autocomplete="name"]').fill("Review Parent");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await btn(/Create account/).click();
  await page.waitForURL(/\/start\/consent/, { timeout: 20_000 });
  await btn(/Yes, remember/).click();
  await btn(/^\s*Yes\s*$/).click();
  await btn(/Only in the app/).click();
  await btn(/Agree and continue/).click();
  await page.waitForURL(/\/start\/child/, { timeout: 20_000 });
  await page.locator("input:visible").first().fill("Chintu");
  await btn(/^\s*Casual\s*$/).click();
  await btn(/^\s*Cricket\s*$/).click();
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/start\/controls/, { timeout: 20_000 });
  const pin = async () => { for (const d of PIN) await page.locator("button", { hasText: new RegExp(`^\\s*${d}\\s*$`) }).first().click(); };
  await pin(); await btn(/^\s*Next\s*$/).click(); await pause(300);
  await pin(); await btn(/^\s*OK\s*$/).click(); await pause(500);
  const times = page.locator("input[type=time]");
  await times.nth(0).fill("00:00");
  await times.nth(1).fill("23:59");
  await btn(/Looks good/).click();
  await page.waitForURL(/\/start\/check/, { timeout: 20_000 });
  await page.locator('[data-testid="check-skip"]').click();
  await page.waitForURL(/\/start\/handover/, { timeout: 20_000 });
  await page.locator('[data-testid="handover-now"]').click();
  await page.waitForURL(/\/c\/[0-9a-f-]+\/hello/, { timeout: 20_000 });
  const childId = page.url().match(/\/c\/([0-9a-f-]+)\//)[1];
  for (let i = 0; i < 10 && /\/hello/.test(page.url()); i++) {
    await pause(900);
    if (i === 0) await shoot("hello-1");
    const av = page.locator('[role=radio][aria-label="tiger cub"]');
    if (await av.isVisible().catch(() => false)) await av.click();
    const keep = page.locator('[data-testid="name-keep"]');
    const next = (await keep.isVisible().catch(() => false)) ? keep : page.locator('[data-testid^="hello-"]:visible').last();
    await next.click().catch(() => {});
    await pause(900);
  }
  // ───────── class 4 first lesson ─────────
  await page.waitForSelector('[data-testid="child-input"], [data-testid="type"], [data-testid="number-pad"], [data-testid="mic"], [data-testid="hear-again"]', { timeout: 60_000 });
  for (let i = 0; i < 40 && !turns.find((t) => t.kind === "start"); i++) await pause(250);
  await shoot("c4-lesson-start");
  if (await btn(/^\s*Not now\s*$/).isVisible().catch(() => false)) await btn(/^\s*Not now\s*$/).click();
  const face = await page.evaluate(() => ({ svg: document.querySelectorAll('[data-testid="teacher-window"] svg, [data-testid="teacher-window"] canvas').length, tw: !!document.querySelector('[data-testid="teacher-window"]') }));
  log.notes.push(`c4 teacher window: ${JSON.stringify(face)}`);
  const c4 = { tag: "c4", childId, topic: turns.find((t) => t.kind === "start")?.j?.topic?.id ?? null, rows: [] };
  if (ONLY.includes("4")) c4.rows = await lessonFor("c4", turns.find((t) => t.kind === "start")?.j, PLAN, { voice: true });
  await pause(2500);
  await shoot("c4-after-bye");
  c4.summaryVisible = await page.locator('[data-testid="summary"], [data-testid="summary-show"]').first().isVisible().catch(() => false);
  log.children.push(c4);
  writeFileSync(`${OUT}walk.json`, JSON.stringify(log, null, 1));

  // ───────── next day: the clock +24 h, the same child comes back ─────────
  const unl = await api("POST", "/api/parent/unlock", { pin: PIN });
  const clock = await api("POST", "/api/test/clock", { advanceMs: 24 * 3600_000 });
  log.notes.push(`unlock ${unl.status}; clock body ${JSON.stringify(clock).slice(0, 200)}`);
  log.notes.push(`clock: ${clock.status}`);
  await page.goto(`${BASE}/c/${childId}`, { waitUntil: "networkidle" });
  await pause(2500);
  await shoot("c4-day2-home");
  const homeText = (await page.locator("main, body").first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 600);
  const n0 = turns.length;
  const go = page.locator('a[href*="/lesson/"], button', { hasText: /start|shuru|lesson|chalo|let's go|today/i }).first();
  if (await go.isVisible().catch(() => false)) await go.click(); else await page.goto(`${BASE}/c/${childId}/lesson/new?mode=text`);
  for (let i = 0; i < 120 && !turns.slice(n0).find((t) => t.kind === "start"); i++) await pause(250);
  const s2 = turns.slice(n0).find((t) => t.kind === "start")?.j;
  await pause(1500);
  await shoot("c4-day2-lesson-start");
  const day2 = { tag: "c4-day2", homeText, topic: s2?.topic?.id ?? null, rows: [] };
  if (s2 && ONLY.includes("4")) day2.rows = await lessonFor("c4d2", s2, [
    { label: "d2-a1", answer: "key" }, { label: "d2-a2", answer: "wrong" }, { label: "d2-a3", answer: "key" },
    { label: "d2-stop", text: "bas, aaj ke liye itna hi" }, { label: "d2-confirm", text: "haan, bas karo" },
  ], { voice: true });
  log.children.push(day2);
  writeFileSync(`${OUT}walk.json`, JSON.stringify(log, null, 1));

  // ───────── siblings: class 6 and class 7 ─────────
  await api("POST", "/api/parent/unlock", { pin: PIN });
  for (const [cls, name] of [[6, "Meera"], [7, "Kabir"]]) {
    if (!ONLY.includes(String(cls))) continue;
    await api("POST", "/api/parent/unlock", { pin: PIN });
    const made = await api("POST", "/api/children", { firstName: name, classLevel: cls, languagePref: "hinglish", interests: ["cricket"] });
    const kid = made.child;
    if (!kid?.id) { log.notes.push(`c${cls}: child create failed ${JSON.stringify(made).slice(0, 200)}`); continue; }
    await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    await page.evaluate((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, kid.id);
    var n1 = turns.length;
    await page.goto(`${BASE}/c/${kid.id}/lesson/new${cls === 7 ? "" : "?mode=text"}`);
    const tth = page.locator('[data-testid="tap-to-hear"]');
    for (let i = 0; i < 30 && !(await tth.isVisible().catch(() => false)) && !turns.slice(n1).find((t) => t.kind === "start"); i++) await pause(300);
    if (await tth.isVisible().catch(() => false)) await tth.click();
    for (let i = 0; i < 160 && !turns.slice(n1).find((t) => t.kind === "start"); i++) await pause(250);
    await page.waitForSelector('[data-testid="child-input"], [data-testid="type"], [data-testid="number-pad"]', { timeout: 45_000 }).catch(() => {});
    if (await btn(/^\s*Not now\s*$/).isVisible().catch(() => false)) await btn(/^\s*Not now\s*$/).click();
    await shoot(`c${cls}-lesson-start`);
    const s = turns.slice(n1).find((t) => t.kind === "start")?.j;
    const rec = { tag: `c${cls}`, childId: kid.id, topic: s?.topic?.id ?? null, rows: [] };
    if (s) rec.rows = await lessonFor(`c${cls}`, s, cls === 6 ? PLAN : [...PLAN.slice(0, -1), { label: "stop", text: "bas, aaj ke liye itna hi" }, { label: "stop-confirm", text: "haan, bas karo" }], { voice: cls === 7 });
    await pause(2500);
    await shoot(`c${cls}-end`);
    rec.summaryVisible = await page.locator('[data-testid="summary"], [data-testid="summary-show"]').first().isVisible().catch(() => false);
    log.children.push(rec);
    writeFileSync(`${OUT}walk.json`, JSON.stringify(log, null, 1));
  }
} catch (e) {
  log.notes.push(`threw: ${String(e?.stack ?? e).slice(0, 600)}`);
  await shoot("threw");
  console.log("THREW", e);
} finally {
  writeFileSync(`${OUT}walk.json`, JSON.stringify(log, null, 1));
  // delete the account
  try {
    await api("POST", "/api/parent/unlock", { pin: PIN });
    let d = await api("DELETE", "/api/account", { password, confirm: true });
    if (d.status >= 500) { await pause(3000); d = await api("DELETE", "/api/account", { password, confirm: true }); }
    console.log(`cleanup: DELETE /api/account → ${d.status}`);
    log.notes.push(`cleanup ${d.status}`);
  } catch (e) { console.log("cleanup failed", e.message); }
  writeFileSync(`${OUT}walk.json`, JSON.stringify(log, null, 1));
  await browser.close();
}
