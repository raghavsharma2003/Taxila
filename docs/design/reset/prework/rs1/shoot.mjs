// RS-1 prework shot battery + measurements on the REAL v3 React components (not the HTML mockups).
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/design/reset/prework/rs1/shoot.mjs [--quick] [--no-shots]
//
// Starts `vite` (dev server) on a spare port, opens the dev-only gallery (src/ui-v3/gallery/index.html) for every screen
// state × 4 viewports (360×640, 390×844, 820×1180, 1440×900) in Night, plus Day for six screens, writes PNGs to ./shots and
// measures, per shot:
//   M-HSCROLL   document wider than the viewport              M-OFF     element boxes off-screen (outside scrollers)
//   M-CLIP      text clipped without an ellipsis/clamp        M-HIT     interactive targets < 36 px
//   M-NAME      interactive elements without an accessible name
//   M-VOLT      visible data-volt elements per screen state (≤ 1; the kit sheet is exempt)
//   M-CONSOLE   console errors + page errors                  M-LINT    rendered-text babyish/machinery lint (innerText)
//   M-FONT      Bricolage + Geist Mono actually loaded        M-MINFONT smallest visible text size
//   lesson only: M-LSCROLL document scroll; M-SLOT artifact outside the slot or under the rail; M-SAFE canvas text/targets
//   inside the PiP or label zones; M-DOCK dock fully visible.
// Then the owner's R11 failure, reproduced on 390×844 touch: set 4:30 PM by tap on onboarding (rotating quick pick /
// steppers / rail) and on the parent reschedule, 20 runs each; keyboard-only reschedule; onboarding taps with defaults.
// Output: ./measurements.json (+ a console table). No network beyond localhost; no Azure spend.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { lintRendered } from "../../../../../src/ui-v3/lint/rules.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../../../../..");
const QUICK = process.argv.includes("--quick");
const NO_SHOTS = process.argv.includes("--no-shots");
const SHOTS = path.join(HERE, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [[360, 640], [390, 844], [820, 1180], [1440, 900]];
const NIGHT_STATES = [
  ...[0, 1, 2, 3, 4, 5, 6].map((s) => ({ id: `onboarding-${s}`, q: `screen=onboarding&step=${s}` })),
  { id: "home", q: "screen=home" },
  ...["board", "speaking", "game", "park", "brief", "decline", "stop"].map((s) => ({ id: `lesson-${s}`, q: `screen=lesson&state=${s}`, lesson: true })),
  { id: "lesson-paused", q: "screen=lesson&state=board", lesson: true, act: async (p) => { await p.getByRole("button", { name: "Pause lesson" }).click(); } },
  { id: "end", q: "screen=end" },
  { id: "progress", q: "screen=progress" },
  { id: "parent-night", q: "screen=parent&theme=night" },
];
const DAY_STATES = [
  { id: "onboarding-4", q: "screen=onboarding&step=4" },
  { id: "home", q: "screen=home" },
  { id: "lesson-board", q: "screen=lesson&state=board", lesson: true },
  { id: "end", q: "screen=end" },
  { id: "progress", q: "screen=progress" },
  { id: "parent", q: "screen=parent" },
  { id: "parent-edit", q: "screen=parent&edit=0" },
];

// ---------- server ----------
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}/src/ui-v3/gallery/index.html`;
const vite = spawn(process.execPath, [path.join(ROOT, "node_modules/vite/bin/vite.js"), "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
let viteLog = "";
vite.stdout.on("data", (d) => (viteLog += d));
vite.stderr.on("data", (d) => (viteLog += d));
const up = async () => { for (let i = 0; i < 120; i++) { try { const r = await fetch(BASE); if (r.ok) return; } catch { /* not yet */ } await new Promise((r) => setTimeout(r, 500)); } throw new Error(`vite did not start:\n${viteLog}`); };
await up();

const browser = await chromium.launch();
const results = [];
const flows = {};

// ---------- in-page measurement ----------
function measure({ isLesson, isKit }) {
  const vw = innerWidth, vh = innerHeight;
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05 && !el.closest(".v3-sr,[aria-hidden='true']"); };
  const inScroller = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true; } return false; };
  const all = [...document.querySelectorAll("body *")];
  const hscroll = document.documentElement.scrollWidth > vw + 1;
  const off = all.filter((el) => { if (!vis(el) || getComputedStyle(el).position === "fixed") return false; const r = el.getBoundingClientRect(); return (r.right > vw + 1 || r.left < -1) && !inScroller(el); }).map((el) => el.className?.toString?.().slice(0, 40) || el.tagName);
  const clip = all.filter((el) => {
    if (!vis(el) || !(el instanceof HTMLElement)) return false;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return false;
    const cs = getComputedStyle(el);
    if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" && cs.webkitLineClamp) return false;
    return el.scrollWidth > el.clientWidth + 1 && (cs.overflow === "hidden" || cs.overflowX === "hidden");
  }).map((el) => el.textContent.trim().slice(0, 40));
  // text spilling out of its control (e.g. "TOMORROW" wider than a 56 px date cell) even when overflow is visible
  const spill = [...document.querySelectorAll("button, a[href], [role='radio']")].filter(vis).flatMap((b) => {
    const br = b.getBoundingClientRect();
    // the control's own text nodes too (review fix 2026-10-05: "11:00 AM" spilled a 59 px grid cell as a direct text node, which the
    // descendant-only check could not see)
    const ownSpill = [...b.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && b.scrollWidth > b.clientWidth + 1 ? [b.textContent.trim().slice(0, 24)] : [];
    return [...ownSpill, ...[...b.querySelectorAll("*")].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).filter((el) => { const r = el.getBoundingClientRect(); return r.right > br.right + 1 || r.left < br.left - 1; }).map((el) => el.textContent.trim().slice(0, 24))];
  });
  const interactive = [...document.querySelectorAll("button, a[href], input, [role='radio'], [role='switch'], [role='slider'], canvas[tabindex]")].filter(vis);
  const hit = interactive.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 36 || r.height < 36; }).map((el) => `${(el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
  const nameOf = (el) => el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) || el.textContent || el.getAttribute("title") || "";
  const unnamed = interactive.filter((el) => !nameOf(el).trim()).map((el) => el.outerHTML.slice(0, 60));
  const volt = isKit ? 0 : [...document.querySelectorAll("[data-volt]")].filter(vis).length;
  let minFont = 99;
  for (const el of all) { if (!vis(el) || el.closest("svg")) continue; if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; minFont = Math.min(minFont, parseFloat(getComputedStyle(el).fontSize)); }
  // fonts: every family a visible text element renders with must have a LOADED face (not a fallback)
  const used = new Set();
  for (const el of all) { if (!vis(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; used.add(getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim()); }
  const loaded = new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/["']/g, "")));
  const fonts = { used: [...used], missing: [...used].filter((f) => /Bricolage|Geist|Atkinson|Mukta/.test(f) && !loaded.has(f)) };
  const out = { spill: spill.length, spillList: spill.slice(0, 4), hscroll, off: off.length, offList: off.slice(0, 5), clip: clip.length, clipList: clip.slice(0, 5), hit: hit.length, hitList: hit.slice(0, 6), unnamed: unnamed.length, unnamedList: unnamed.slice(0, 3), volt, minFont, fonts };
  if (isLesson) {
    const R = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const slot = R("[data-stage-slot]");
    const art = document.querySelector(".v3-artifact.is-in > *")?.getBoundingClientRect();
    const rail = R(".v3-rail-hud");
    const pip = R(".v3-pip");
    const label = R(".v3-stage-label");
    const dock = R(".v3-dock");
    const inter = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const svgBits = [...document.querySelectorAll(".v3-artifact.is-in svg text, .v3-artifact.is-in svg [role='slider']")].map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0);
    out.lscroll = document.documentElement.scrollHeight > vh + 1 || document.body.scrollHeight > vh + 1;
    out.slotBad = !!(slot && art && (art.left < slot.left - 1 || art.right > slot.right + 1 || art.top < slot.top - 1 || art.bottom > slot.bottom + 1 || (rail && slot.bottom > rail.top + 1)));
    out.safeBad = svgBits.filter((r) => inter(r, pip) || inter(r, label)).length;
    out.pipLabel = !!inter(pip, label);
    out.dockBad = !dock || dock.bottom > vh + 1;
    out.slotPx = slot ? `${Math.round(slot.width)}x${Math.round(slot.height)}` : null;
    // zones must never overlap each other (the side-column grid-area bug overlapped transcript and chips)
    const zones = [".v3-tile", ".v3-convo", ".v3-steer", ".v3-dock-row", ".v3-stage", ".v3-l-top"].map((s) => [s, R(s)]).filter(([, r]) => r && r.width > 0);
    const shrink = (r) => ({ left: r.left + 1, right: r.right - 1, top: r.top + 1, bottom: r.bottom - 1 });
    out.zoneOverlap = [];
    for (let i = 0; i < zones.length; i++) for (let j = i + 1; j < zones.length; j++) if (inter(shrink(zones[i][1]), shrink(zones[j][1]))) out.zoneOverlap.push(`${zones[i][0]}∩${zones[j][0]}`);
    // a zone collapsed to a sliver is as broken as an overlap
    for (const [s, r] of zones) if (r.width < 60 || r.height < 24) out.zoneOverlap.push(`${s} collapsed ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return out;
}

async function shoot(state, theme, [w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 900, isMobile: w < 900, colorScheme: theme === "day" ? "light" : "dark" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errors.push(`pageerror ${String(e).slice(0, 160)}`));
  const themeQ = state.q.includes("theme=") ? "" : `&theme=${theme}`;
  await page.goto(`${BASE}?${state.q}${themeQ}&settled=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (state.act) await state.act(page);
  await page.waitForTimeout(1300);
  const m = await page.evaluate(measure, { isLesson: !!state.lesson, isKit: state.id === "kit" });
  const text = await page.evaluate(() => document.body.innerText);
  const lint = lintRendered(text);
  const file = `${state.id}__${theme}__${w}x${h}.png`;
  if (!NO_SHOTS) await page.screenshot({ path: path.join(SHOTS, file), fullPage: !state.lesson });
  await ctx.close();
  const row = { id: state.id, theme, vp: `${w}x${h}`, file, ...m, console: errors.length, consoleList: errors.slice(0, 3), lint: lint.length, lintList: lint.slice(0, 3) };
  results.push(row);
  const bad = [m.spill && `SPILL${m.spill}`, m.hscroll && "HSCROLL", m.off && `OFF${m.off}`, m.clip && `CLIP${m.clip}`, m.hit && `HIT${m.hit}`, m.unnamed && `NAME${m.unnamed}`, m.volt > 1 && `VOLT${m.volt}`, errors.length && `CONSOLE${errors.length}`, lint.length && `LINT${lint.length}`,
    m.lscroll && "LSCROLL", m.slotBad && "SLOT", m.safeBad && `SAFE${m.safeBad}`, m.pipLabel && "PIPLABEL", m.dockBad && "DOCK", m.zoneOverlap?.length && `OVERLAP:${m.zoneOverlap}`, m.fonts.missing.length && `FONT:${m.fonts.missing}`].filter(Boolean);
  console.log(`${bad.length ? "FAIL" : "ok  "} ${state.id.padEnd(16)} ${theme.padEnd(5)} ${`${w}x${h}`.padEnd(9)} ${bad.join(" ")}`);
}

const vps = QUICK ? [VIEWPORTS[0], VIEWPORTS[3]] : VIEWPORTS;
for (const s of NIGHT_STATES) for (const vp of vps) await shoot(s, "night", vp);
for (const s of DAY_STATES) for (const vp of vps) await shoot(s, "day", vp);
for (const vp of [VIEWPORTS[1], VIEWPORTS[3]]) await shoot({ id: "kit", q: "screen=kit" }, "night", vp);

// ---------- the owner's R11 failure: set 4:30 PM by tap, 20 runs each, 390×844 touch ----------
async function touchPage(q) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?${q}`, { waitUntil: "networkidle" });
  return { ctx, page };
}
const N = QUICK ? 5 : 20;
{
  let pass = 0;
  const methods = { quick: 0, steppers: 0, rail: 0 };
  const fails = [];
  for (let i = 0; i < N; i++) {
    const method = ["quick", "steppers", "rail"][i % 3];
    const { ctx, page } = await touchPage("screen=onboarding&step=4");
    try {
      if (method === "quick") await page.getByRole("button", { name: /After school · 4:30/ }).tap();
      else if (method === "steppers") for (let k = 0; k < 4; k++) await page.getByRole("button", { name: "15 minutes earlier" }).tap();
      else await page.getByRole("radio", { name: "4:30 PM", exact: true }).tap();
      const readout = (await page.locator(".v3-readout-t").innerText()).replace(/\s+/g, "");
      const summary = await page.locator(".v3-ob-summary b").innerText();
      await page.getByRole("button", { name: "Save schedule" }).tap();
      await page.getByRole("button", { name: "Do this later" }).tap();
      const when = await page.locator(".v3-kv dd").nth(1).innerText();
      const ok = /4:30PM$/.test(readout) && summary.includes("4:30 PM") && when.includes("4:30 PM");
      if (ok) { pass++; methods[method]++; } else fails.push({ method, readout, summary, when });
    } catch (e) { fails.push({ method, error: String(e).slice(0, 160) }); }
    await ctx.close();
  }
  flows.onboarding430 = { n: N, pass, methods, fails: fails.slice(0, 3) };
}
{
  let pass = 0;
  const fails = [];
  let negOk = 0;
  for (let i = 0; i < N; i++) {
    const { ctx, page } = await touchPage("screen=parent&edit=0");
    try {
      // negative control: a clash day (Wed 7) and a disabled time must not change the selection
      await page.getByRole("radio", { name: /Wednesday 7 October/ }).tap({ force: true });
      const stillMon = await page.getByRole("radio", { name: /Monday 5 October/ }).getAttribute("aria-checked");
      await page.getByRole("radio", { name: /Tuesday 6 October/ }).tap();
      await page.getByRole("radio", { name: /^9:00 PM/ }).tap({ force: true });
      const nineOff = await page.getByRole("radio", { name: /^9:00 PM/ }).getAttribute("aria-checked");
      if (stillMon === "true" && nineOff === "false") negOk++;
      await page.getByRole("radio", { name: "4:30 PM", exact: true }).tap();
      const sum = await page.locator(".v3-confirm b").innerText();
      await page.getByRole("button", { name: "Move lesson" }).tap();
      const row = await page.locator(".v3-slotrow").first().innerText();
      const ok = sum.startsWith("Tue 6 Oct · 4:30 PM") && /Tue\s*6/i.test(row) && row.includes("4:30 PM · 20 min");
      if (ok) pass++; else fails.push({ sum, row });
    } catch (e) { fails.push({ error: String(e).slice(0, 160) }); }
    await ctx.close();
  }
  flows.parent430 = { n: N, pass, negativeControls: negOk, fails: fails.slice(0, 3) };
}
// keyboard-only reschedule (desktop): arrows skip the clash day, End reaches the last enabled time
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?screen=parent&edit=0`, { waitUntil: "networkidle" });
  const steps = [];
  await page.getByRole("radio", { name: /Monday 5 October/ }).focus();
  await page.keyboard.press("ArrowRight");
  steps.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  await page.keyboard.press("ArrowRight");
  steps.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  await page.keyboard.press("Tab");
  await page.keyboard.press("End");
  steps.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  await page.keyboard.press("Home");
  steps.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  const sum = await page.locator(".v3-confirm").innerText();
  flows.keyboardReschedule = { steps, summary: sum.replace(/\s+/g, " "), ok: /Tuesday 6/.test(steps[0] ?? "") && /Thursday 8/.test(steps[1] ?? "") && !/past|outside/.test(steps[2] ?? "x") };
  await ctx.close();
}
// negative controls for the layout metrics: re-inject the two real bugs this battery found and confirm it trips
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?screen=lesson&state=board&settled=1`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "@media (min-width: 900px) { .v3-side > * { grid-area: unset !important; } .v3-side .v3-convo { grid-area: convo !important; } }" });
  await page.waitForTimeout(300);
  const a = await page.evaluate(measure, { isLesson: true, isKit: false });
  await page.goto(`${BASE}?screen=parent&settled=1`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".v3-switch { height: 32px !important; }" });
  const b = await page.evaluate(measure, { isLesson: false, isKit: false });
  await page.goto(`${BASE}?screen=parent&edit=0&settled=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => { document.querySelectorAll(".v3-date small")[1].textContent = "Tomorrow"; });
  const c = await page.evaluate(measure, { isLesson: false, isKit: false });
  flows.negativeControls = { overlapTrips: a.zoneOverlap.length > 0, overlap: a.zoneOverlap, hitTrips: b.hit > 0, spillTrips: c.spill > 0, spill: c.spillList };
  await ctx.close();
}
// onboarding with defaults: taps from welcome to "Start warm-up"
{
  const { ctx, page } = await touchPage("screen=onboarding&step=0");
  const labels = ["Get started", "Continue", "Continue", /^Choose /, "Save schedule", "Do this later"];
  let taps = 0;
  for (const l of labels) { await page.getByRole("button", { name: l }).first().tap(); taps++; }
  const ready = await page.getByRole("heading", { level: 1 }).innerText();
  await page.getByRole("button", { name: "Start warm-up" }).tap();
  taps++;
  flows.onboardingTaps = { taps, reachedReady: /You're set/.test(ready) };
  await ctx.close();
}

await browser.close();
vite.kill();

// ---------- summary ----------
const sumBy = (k) => results.reduce((a, r) => a + (typeof r[k] === "number" ? r[k] : r[k] ? 1 : 0), 0);
const lessonRows = results.filter((r) => r.lscroll !== undefined);
const summary = {
  at: new Date().toISOString(), shots: results.length, viewports: vps.map((v) => v.join("x")),
  hscroll: sumBy("hscroll"), textSpill: sumBy("spill"), offscreen: sumBy("off"), clipped: sumBy("clip"), hitUnder36: sumBy("hit"), unnamed: sumBy("unnamed"),
  voltOver1: results.filter((r) => r.volt > 1).length, consoleErrors: sumBy("console"), renderedLint: sumBy("lint"),
  fontsMissing: results.filter((r) => r.fonts.missing.length).length,
  minFontPx: Math.min(...results.map((r) => r.minFont)),
  lesson: { rows: lessonRows.length, docScroll: sumBy("lscroll"), slotViolations: lessonRows.filter((r) => r.slotBad).length, safeZoneHits: sumBy("safeBad"), pipOverLabel: lessonRows.filter((r) => r.pipLabel).length, dockHidden: lessonRows.filter((r) => r.dockBad).length, zoneOverlaps: lessonRows.filter((r) => r.zoneOverlap.length).length, floorSlot: lessonRows.find((r) => r.vp === "360x640")?.slotPx },
  flows,
};
fs.writeFileSync(path.join(HERE, "measurements.json"), JSON.stringify({ summary, results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
