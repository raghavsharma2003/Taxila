// livewalk: real LessonScreen on the built dist, served by server/serve.mjs, /api mocked by a scripted Director.
// usage: node walk.mjs <a|b> <p360|l1366> [--probe]
import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { createRequire } from "module";
const require = createRequire(new URL("../../../../../", import.meta.url).pathname);
const { chromium } = require("playwright");

const ROOT = new URL("../../../../../", import.meta.url).pathname;
const OUT = "docs/design/round8/phase2/livewalk/out";
const theme = process.argv[2] || "a";
const dev = process.argv[3] || "p360";
const DEV = dev === "p360" ? { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 };

const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [ROOT + "server/serve.mjs"], { env: { ...process.env, PORT: String(PORT), DATABASE_URL: "", TEST_DATABASE_URL: "" }, stdio: ["ignore", "pipe", "pipe"], cwd: ROOT });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 150)); }

function wav(ms = 900) { const n = Math.round(16 * ms); const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40); return b; }
const WAV = wav();

const board = (id) => ({ kind: "whiteboard", stage: { w: 400, h: 300 }, script: { v: 1, scriptId: id, line: { lessonId: "L-walk" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 1200,
  ops: [
    { id: "r1", op: "rect", at: [40, 60], w: 140, h: 140, startMs: 0, endMs: 300, ink: "ink", weight: 2 },
    { id: "s1", op: "sector", c: [110, 130], r: 70, fromDeg: 0, toDeg: 180, fill: "accent", startMs: 200, endMs: 500 },
    { id: "r2", op: "rect", at: [220, 60], w: 140, h: 140, startMs: 300, endMs: 600, ink: "ink", weight: 2 },
    { id: "s2", op: "sector", c: [290, 130], r: 70, fromDeg: 0, toDeg: 90, fill: "mark", startMs: 500, endMs: 800 },
    { id: "t1", op: "text", at: [110, 230], text: "1/2", size: "l", align: "middle", startMs: 600, endMs: 700 },
    { id: "t2", op: "text", at: [290, 230], text: "1/4", size: "l", align: "middle", startMs: 800, endMs: 900 },
    { id: "a1", op: "arrow", from: [190, 130], to: [215, 130], startMs: 900, endMs: 1100 },
    { id: "l1", op: "label", at: [200, 30], text: "bigger share", startMs: 1000, endMs: 1200 },
  ] } });
const slot = (id, art) => ({ slotId: id, intentId: id, state: "revealed", artifact: art, buildSha: "x", facts: { kind: "whiteboard", archetype: "frac", onScreen: {} } });

const SCRIPT = {
  opening: { reply: "Namaste! Aaj hum fractions compare karenge. Pehle batao, 1/2 aur 1/4 mein bada kaun hai?",
    ui: { ask: { text: "Which is bigger: 1/2 or 1/4?" }, handover: "answer", phase: "warmup", tray: "none", shortTitle: "Fractions: halves", answerForm: "words" } },
  boardTurn: { reply: "Bilkul sahi. Board dekho: ek half ke barabar kitne quarters? Shaded hisse gino.", ui: { verdict: "correct", phase: "teach", tray: "studio", studioSlot: slot("sl1", board("w1")), ask: { text: "How many quarters make one half?" }, handover: "answer", answerForm: "words" } },
  wrong: { reply: "Chalo ek baar phir dekhte hain. Shaded parts gino.", ui: { verdict: "not_yet", hint: { level: 1, text: "Count the shaded quarters on the board." }, ask: { text: "How many quarters make one half?" }, handover: "answer", answerForm: "words", tray: "studio", studioSlot: slot("sl1", board("w1")) } },
  right: { reply: "Haan, do quarters. Ab inmein se poora kaun hai?", ui: { verdict: "correct", phase: "practice", tray: "none", chips: [{ id: "a", label: "1/3" }, { id: "b", label: "2/3" }, { id: "c", label: "3/3" }], ask: { text: "Which fraction is one whole?" }, handover: "choice", answerForm: "choice" } },
  picture: { reply: "Ye lo, ek picture. Dekho do barabar tukde.", ui: { tray: "studio", studioSlot: slot("sl2", board("w2")), ask: { text: "Which fraction is one whole?" }, handover: "choice", answerForm: "choice", chips: [{ id: "a", label: "1/3" }, { id: "b", label: "2/3" }, { id: "c", label: "3/3" }] } },
  end: { reply: "Bahut achha. Aaj tumne halves aur quarters jode. Milte hain agli baar.", ui: { verdict: "correct", handover: "finish" }, end: true },
};

let playLevel = null, playArt = null;
try {
  const { logicFor } = await import(ROOT + "src/play/families/index.ts");
  const { pickLevels } = await import(ROOT + "src/play/core/pick.ts");
  const logic = logicFor("nishana", "place");
  const req = { family: "nishana", mode: "place", topicId: "c6-maths-ch07-t02", skillId: "c6-maths-ch07-t02-s1", classLevel: 6, fade: 1, goal: undefined, mis: {}, misMap: Object.fromEntries(logic.malRules.map((m) => [m, `dev:${m}`])), grammar: { forms: ["fraction"], dens: [3, 4] }, recent: [], seed: 7, harder: false };
  playLevel = pickLevels(logic, req).garam;
  playArt = { kind: "play", play: { sessionId: "walk-s1", family: "nishana", mode: "place", skillId: req.skillId, topicId: req.topicId, art: "kagaz", levelId: playLevel.levelId } };
} catch (e) { console.log("play level gen failed:", String(e).slice(0, 200)); }

const KID = { id: "kid-o", first_name: "Kabir", class_level: 8, language_pref: "hinglish", teacher_id: "arjun" };
const log = { console: [], failed: [], reqs: [], turns: [] };
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await browser.newContext({ ...DEV, colorScheme: "light" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") log.console.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => log.console.push("PAGEERROR " + e.message.slice(0, 200)));
page.on("requestfailed", (r) => log.failed.push(`${r.method()} ${r.url().slice(0, 100)} ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.status() >= 400) log.failed.push(`${r.status()} ${r.url().slice(0, 100)}`); });

let step = "";
await page.route("**/api/**", async (route) => {
  const req = route.request(); const p = new URL(req.url()).pathname;
  const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  log.reqs.push(p);
  if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
  if (p === "/api/lesson/start") return json(200, { lessonId: "L-walk", topic: { id: "t", title: "Fractions: halves and quarters", chapter: "Fractions" }, teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui: SCRIPT.opening.ui, teacherOpening: SCRIPT.opening.reply, teacherOpeningSeq: 1 });
  if (p === "/api/lesson/turn") {
    const body = JSON.parse(req.postData() || "{}"); log.turns.push({ step, chipId: body.chipId, text: body.text ?? body.answer });
    const s = SCRIPT[step] ?? SCRIPT.right; seq++;
    return json(200, { move: { kind: s.end ? "wrap" : "probe", shape: "x" }, moduleCommands: [], ui: s.ui, teacherReply: s.reply, teacherReplySeq: seq, ...(s.end ? { end: true } : {}) });
  }
  if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
  if (p === "/api/tts") return route.fulfill({ status: 200, contentType: "audio/wav", body: WAV });
  if (p === "/api/play/level" && playLevel) return json(200, { sessionId: "walk-s1", level: playLevel, art: { art: "kagaz", reason: "rotation" } });
  if (p.startsWith("/api/play/")) return json(200, { ok: true, sessionId: "walk-s1" });
  return json(404, { error: "not mocked" });
});
let seq = 1;

const facts = [];
const record = async (name) => {
  const f = await page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const bg = (el) => cs(el)?.backgroundColor ?? null;
    const lessonRoot = document.querySelector('[data-testid="lesson"]');
    const txRoot = document.querySelector("[data-tx]");
    const bt = document.querySelector("[data-board-theme]");
    const q = document.querySelector('[data-testid="ask"]');
    const line = document.querySelector('[data-testid="teacher-line"], [data-testid="speech-row"] [data-speech], [data-speech]');
    const boardEl = document.querySelector('[data-testid="studio-stage"], .studio-stage, [data-testid="board"], svg.wb, [data-testid="tray"] svg');
    const card = boardEl?.closest('[class*="card"], [class*="tray"], [data-testid="tray"]') ?? document.querySelector('[data-testid="tray"]');
    const font = (el) => (el ? { fam: cs(el).fontFamily.slice(0, 60), w: cs(el).fontWeight, size: cs(el).fontSize } : null);
    const mono = [];
    const scope = lessonRoot ?? document.body;
    for (const el of scope.querySelectorAll("*")) {
      const s = getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden") continue;
      const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
      if (!txt) continue;
      const isMono = /mono|courier|consolas|menlo/i.test(s.fontFamily) && !/sans-serif|serif/.test(s.fontFamily.split(",").slice(0, 2).join(","));
      const ls = parseFloat(s.letterSpacing) || 0;
      const upper = s.textTransform === "uppercase" || (txt === txt.toUpperCase() && /[A-Z]{3,}/.test(txt));
      if (isMono || (upper && ls > 0.5)) mono.push(`${isMono ? "MONO" : "UPPER"} ${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} "${txt.slice(0, 30)}" ${s.fontFamily.slice(0, 30)}`);
    }
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const svg = boardEl && (boardEl.tagName === "svg" ? boardEl : boardEl.querySelector("svg"));
    return {
      dataTx: txRoot ? txRoot.getAttribute("data-tx") : null, txTag: txRoot ? txRoot.tagName + "." + String(txRoot.className).split(" ")[0] : null,
      boardTheme: bt ? bt.getAttribute("data-board-theme") : null,
      bodyBg: bg(document.body), rootBg: bg(lessonRoot ?? txRoot), cardBg: bg(card), cardSel: card ? card.tagName.toLowerCase() + "." + String(card.className).split(" ")[0] : null,
      askFont: font(q), lineFont: font(line), askText: q?.textContent?.trim().slice(0, 60) ?? null,
      sideScroll: document.documentElement.scrollWidth > innerWidth, sw: document.documentElement.scrollWidth, iw: innerWidth,
      cardRect: r(card), boardRect: r(svg ?? boardEl), mono: mono.slice(0, 8),
      floor: lessonRoot?.getAttribute("data-floor") ?? null,
    };
  });
  const out = { name, ...f, console: [...log.console], failed: [...log.failed] };
  facts.push(out);
  return out;
};
const shot = async (name) => { await page.waitForTimeout(700); const file = `${OUT}/${theme}-${dev}-${name}.png`; await page.screenshot({ path: file }); await record(name); console.log("shot", file.split("/").pop()); };
const waitFloor = (f, t = 15000) => page.waitForFunction((f) => document.querySelector('[data-testid="lesson"]')?.getAttribute("data-floor") === f, f, { timeout: t });
const safe = async (label, fn) => { try { await fn(); } catch (e) { console.log("MISS", label, String(e.message).split("\n")[0].slice(0, 150)); try { await shot("miss-" + label); } catch {} } };

try {
  await page.goto(`${BASE}/c/${KID.id}/lesson/new?mode=text&tx=${theme}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 25000 });
  await waitFloor("your_turn", 25000).catch(() => {});
  await shot("01-first");
  await page.evaluate(() => 0);
  step = "boardTurn";
  await safe("answer1", async () => { await page.locator('[data-testid="child-input"]').fill("one half"); await page.locator('[data-testid="send"]').click(); });
  await waitFloor("speaking", 12000).catch(() => {});
  await shot("02-board-speaking");
  await waitFloor("your_turn", 20000).catch(() => {});
  await shot("03-question");
  step = "wrong";
  await safe("wrong", async () => {
    const pad = page.locator('[data-testid="number-pad"]');
    if (await pad.isVisible().catch(() => false)) { await pad.locator(".dk-key", { hasText: /^3$/ }).click(); await pad.locator(".dk-key--send").click(); }
    else { await page.locator('[data-testid="child-input"]').fill("3"); await page.locator('[data-testid="send"]').click(); }
  });
  await waitFloor("speaking", 12000).catch(() => {});
  await waitFloor("your_turn", 20000).catch(() => {});
  await shot("04-hint");
  step = "picture";
  await safe("picture", async () => { await page.locator('[data-testid="steer-diagram"]').click(); });
  await waitFloor("speaking", 12000).catch(() => {});
  await waitFloor("your_turn", 20000).catch(() => {});
  await shot("05-picture");
  step = "game";
  await safe("game", async () => { await page.locator('[data-testid="steer-game"]').click({ timeout: 4000 }); });
  await page.waitForTimeout(2500);
  await shot("06-game");
  await safe("pause", async () => { await page.locator('[data-testid="pause"]').click({ timeout: 4000 }); });
  await shot("07-pause");
  await safe("resume", async () => { const b = page.locator('button', { hasText: /resume|continue|back to|keep going/i }).first(); await b.click({ timeout: 3000 }); });
  await page.waitForTimeout(800);
  step = "end";
  await safe("end", async () => {
    await page.locator('[data-testid="child-input"]').fill("one whole"); await page.locator('[data-testid="send"]').click();
  });
  await page.waitForTimeout(6000);
  await shot("08-end");
  await page.waitForTimeout(5000);
  await shot("09-after-end");
} catch (e) { console.log("FATAL", e.message.split("\n")[0]); try { await shot("fatal"); } catch {} }
fs.writeFileSync(`${OUT}/facts-${theme}-${dev}.json`, JSON.stringify({ facts, turns: log.turns, reqs: [...new Set(log.reqs)], console: log.console, failed: log.failed }, null, 1));
await browser.close(); srv.kill();
process.exit(0);
