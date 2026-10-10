// K1 rendered harness (BUILD-SPEC §3.3, §3.5, §11.1, §11.3): the REAL Desk under the Kaksha skin and the Debrief, on the
// dev fixture page (src/ui-v3/kaksha/dev/desk.html), for class 4 (Young → dawn), 6 and 7 (Older → night), at 360x800
// (phone), 412x915 and 1366x768 (laptop). Not part of `npm test` (it needs a browser and a vite dev server).
//   node tests/prod/r4-kaksha-desk-shots.mjs     → docs/design/round4/build/kaksha/shots-k1/*.webp + lint-k1.json; exit 1 on a finding
// Per page: the U1 in-page lint (r4-kaksha-inpage.mjs). Plus the safety and truth checks K1 must keep:
//   HELP-1   on every lesson state, Pause is visible, enabled, ≥ 44 px and on screen: one tap to the helplines
//   HELP-2   the Pause sheet prints 1098 and 14416 on screen with no scroll
//   AI-1     her face never shows without "AI" beside it (Desk label or tag; Debrief "AI teacher")
//   LAMP-1   the plasma lamp is on the Answer dock only, and only at YOUR TURN
//   SKIN-1   the Desk root carries data-skin="kaksha" and the Kaksha frame; zones carry data-zone
//   TRUTH-1  "Now secure" shows exactly the skill that crossed to secure between the two map reads, and nothing otherwise
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { inPage, startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = path.join(ROOT, "docs/design/round4/build/kaksha/shots-k1");
const PORT = 5198;
const BASE = `http://localhost:${PORT}/src/ui-v3/kaksha/dev/desk.html`;
const CLASSES = [4, 6, 7];
const FIXTURES = ["speaking", "your_turn", "work-tiles", "board-not_yet", "work-pad", "pause", "summary", "summary-secure", "summary-tried", "intake-ask", "intake-mapped", "intake-plan"];
const LESSON = new Set(["speaking", "your_turn", "work-tiles", "board-not_yet", "work-pad", "intake-ask", "intake-mapped", "intake-plan"]);
const VIEWS = [[360, 800], [412, 915], [1366, 768]];
const SHOT_VIEWS = new Set(["360x800", "1366x768"]);

function checks(fx) {
  const out = [];
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && r.top >= -1 && r.left >= 0 && r.bottom <= innerHeight + 0.5 && r.right <= innerWidth + 0.5; };
  const root = document.querySelector('[data-testid="lesson"]');
  if (!root || root.getAttribute("data-skin") !== "kaksha" || !root.closest(".kx.kx-lesson")) out.push("SKIN-1 root");
  if (fx.lesson) {
    if (!document.querySelector('[data-zone="dock"]') || !document.querySelector('[data-zone="card"]')) out.push("SKIN-1 zones");
    const pause = document.querySelector('[data-testid="pause"]');
    if (!vis(pause) || pause.disabled) out.push("HELP-1 pause not reachable");
    else { const r = pause.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) out.push(`HELP-1 pause ${r.width}x${r.height}`); }
    const face = document.querySelector('[data-testid="teacher-window"], [data-testid="speech-row"]');
    const ai = [...document.querySelectorAll("[data-ai-tag], [data-ai-label]")].filter(vis);
    if (face && !ai.some((a) => /\bAI\b/.test(a.textContent))) out.push("AI-1 no AI label by her face");
    const lamps = [...document.querySelectorAll("[data-lamp]")];
    if (lamps.some((l) => !l.closest('[data-zone="dock"]'))) out.push("LAMP-1 lamp off the dock");
    if (fx.name === "your_turn" && lamps.length !== 1) out.push(`LAMP-1 your_turn lamps=${lamps.length}`);
    if (fx.name === "speaking" && lamps.length) out.push("LAMP-1 lamp while she speaks");
  }
  // INTAKE-1 (K3): the card shows the server's mapping inside the Question card, adds no control, and the dots match the plan
  if (fx.name.startsWith("intake")) {
    const card = document.querySelector('[data-testid="question-card"] [data-testid="intake"]');
    if (!card || !vis(card)) out.push("INTAKE-1 no intake card in the Question card");
    else {
      if (card.querySelector("button, a, input")) out.push("INTAKE-1 the card carries a control");
      if (fx.name !== "intake-ask" && !/Class \d/.test(card.querySelector(".kx-in-trail")?.textContent ?? "")) out.push("INTAKE-1 no trail");
      if (fx.name === "intake-plan" && card.querySelectorAll(".kx-in-dot").length !== 2) out.push("INTAKE-1 plan dots ≠ planned parts");
    }
  }
  if (fx.name === "pause") {
    for (const id of ["call-1098", "call-14416"]) if (!vis(document.querySelector(`[data-testid="${id}"]`))) out.push(`HELP-2 ${id} not on screen`);
  }
  if (fx.name.startsWith("summary")) {
    const s = document.querySelector('[data-testid="summary"]');
    if (!s) out.push("DEBRIEF missing");
    else if (!/AI teacher/.test(s.textContent)) out.push("AI-1 Debrief without AI teacher");
    if (!document.querySelector('[data-testid="finish"]')) out.push("DEBRIEF no finish");
    const sec = document.querySelector('[data-testid="now-secure"]');
    if (fx.name === "summary-secure") {
      if (!sec || !/Equivalent fractions/.test(sec.textContent) || /Fractional units|Angles/.test(sec.textContent)) out.push(`TRUTH-1 secure=${sec ? sec.textContent.slice(0, 80) : "none"}`);
    } else if (sec) out.push("TRUTH-1 a secure section with no crossing");
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const stopVite = await startVite(ROOT, PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const report = [];
const tot = { small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, unresolved: 0, texts: 0, pages: 0, errors: 0, checks: 0 };
try {
  for (const [w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    const p = await ctx.newPage();
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    for (const cls of CLASSES) for (const fx of FIXTURES) {
      await p.goto(`${BASE}?class=${cls}&fixture=${fx}`);
      await p.waitForSelector('[data-testid="lesson"]');
      await p.waitForTimeout(fx.startsWith("summary") ? 900 : 700);
      const r = await p.evaluate(inPage);
      const c = await p.evaluate(checks, { name: fx, lesson: LESSON.has(fx) });
      tot.pages++; tot.texts += r.texts; tot.overflow += r.overflow > 0 ? 1 : 0; tot.unresolved += r.unresolved; tot.checks += c.length;
      for (const k of ["small", "deva", "targets", "contrast"]) tot[k] += r[k].length;
      report.push({ view: `${w}x${h}`, cls, state: fx, ...r, checks: c });
      if (c.length || r.small.length || r.deva.length || r.targets.length || r.contrast.length) console.log(`${w} c${cls} ${fx}`, JSON.stringify({ c, s: r.small, t: r.targets, k: r.contrast }).slice(0, 600));
      if (SHOT_VIEWS.has(`${w}x${h}`)) {
        const png = path.join(OUT, `c${cls}-${fx}__${w}x${h}.png`);
        await p.screenshot({ path: png });
        execFileSync("python3", ["-c", `from PIL import Image;Image.open('${png}').save('${png.replace(".png", ".webp")}','WEBP',quality=78,method=6)`]);
        fs.rmSync(png);
      }
    }
    tot.errors += errs.length; if (errs.length) console.log(`${w} page errors:`, errs.slice(0, 3));
    await ctx.close();
  }
} finally { await browser.close(); stopVite(); }
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/lint-k1.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: `Playwright Chromium on the Kaksha Desk dev page (the real Desk + fixture models); ${FIXTURES.length} states x classes ${CLASSES.join("/")} x ${VIEWS.length} viewports`, totals: tot, pages: report }, null, 1));
console.log(JSON.stringify(tot));
const findings = tot.small + tot.deva + tot.targets + tot.contrast + tot.overflow + tot.checks + tot.errors;
process.exit(findings ? 1 : 0);
