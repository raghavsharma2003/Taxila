// Round 8 font matching (main's ruling, 2026-11-11): a bold Latin run on the live lesson stage must be drawn in the stage's own
// face, never the system sans. Chromium picks ONE weight segment of a family (the faces sharing the same weight descriptor)
// before it looks at unicode-range; ext/deva.css used to give "Atkinson Hyperlegible Next" a Devanagari-only face at 700-900
// (and "Bricolage Grotesque" one at 400-900), so a 700+ Atkinson run (900 Bricolage) matched a segment with no Latin face and
// every Latin glyph fell back to system-ui — on the engines' canvas and in the DOM HUD alike, once the ext engine chunk loaded.
//   1. static: in every self-hosted @font-face under src/, a family that has both a Latin and a Devanagari face declares the
//      SAME set of weight ranges for each script, so every segment Chromium can pick holds both (src/styles/fonts.css,
//      src/ui-v3/tokens.css, src/studio-v2/gallery/gallery.css, src/studio-v2/engines/ext/deva.css);
//   2. the REAL child route (built dist/ or the dev server, tests/support/app-server.mjs) with a Studio v2 engine on stage and
//      the Devanagari faces loaded: CDP CSS.getPlatformFontsForNode on the HUD readout, the task pill and a run in each stage
//      family at 400-900 gives the self-hosted face; the canvas measures the same widths as that DOM run (same FontSelector),
//      not the system sans's; Hindi still resolves to Mukta;
//   3. the whiteboard's word face (and a 700 run of it) resolves to Atkinson Hyperlegible Next with the Devanagari faces loaded.
// FONT_BROWSER=0 or no Chromium skips 2-3.
// What 2-3 need: Chromium (PLAYWRIGHT_BROWSERS_PATH), the built dist/ or the dev server (tests/support/app-server.mjs), and the
// font FILES on disk (public/fonts, dist/assets, src/**/fonts, node_modules/@fontsource) — no network: every .woff2 request is
// answered from disk, every request off localhost is aborted, and the face loads are settled one by one, so an environment
// that refuses a fetch cannot fail the test (main 2026-11-11: a "NetworkError" in Games' container).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.FONT_BROWSER === "0" ? "FONT_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-font", first_name: "Meera", class_level: 4, language_pref: "hinglish", teacher_id: "arjun" };
const LATIN = "Hamburgefonstiv 0123";
const WEIGHTS = [400, 500, 600, 700, 800, 900];
// a stage family's CSS variable (src/studio-v2/core/host.css, = core/tokens.ts FONT) → the face's own family name
const STAGE = { "--sv2-ui": "Atkinson Hyperlegible Next", "--sv2-display": "Bricolage Grotesque", "--sv2-mono": "Geist Mono" };

// ── 1. static ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function cssFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...cssFiles(p)); else if (e.name.endsWith(".css") && statSync(p).isFile()) out.push(p);
  }
  return out;
}
/** Does a unicode-range string cover this code point? (no range = the whole font) */
function covers(range, cp) {
  if (!range) return true;
  return range.split(",").some((r) => {
    const [a, b] = r.trim().replace(/^U\+/i, "").split("-");
    if (a.includes("?")) return cp >= parseInt(a.replace(/\?/g, "0"), 16) && cp <= parseInt(a.replace(/\?/g, "F"), 16);
    return cp >= parseInt(a, 16) && cp <= parseInt(b ?? a, 16);
  });
}
function fontFaces(files) {
  const faces = [];
  for (const f of files) {
    const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const d = (k) => new RegExp(`(?:^|;|\\s)${k}\\s*:\\s*([^;]+)`, "i").exec(m[1])?.[1].trim();
      const family = d("font-family")?.replace(/["']/g, "");
      const w = (d("font-weight") ?? "400").replace(/normal/, "400").replace(/bold/, "700").split(/\s+/);
      faces.push({ file: f.slice(ROOT.length), family, weight: `${w[0]} ${w[1] ?? w[0]}`, latin: covers(d("unicode-range"), 0x41), deva: covers(d("unicode-range"), 0x915) });
    }
  }
  return faces;
}

test("every self-hosted family with a Latin and a Devanagari face declares the same weight ranges for both (no segment without Latin)", () => {
  const faces = fontFaces(cssFiles(join(ROOT, "src")));
  assert.ok(faces.length >= 15, `found ${faces.length} @font-face rules`);
  const byFamily = Object.groupBy(faces, (f) => f.family);
  const bad = [];
  for (const [family, list] of Object.entries(byFamily)) {
    const devaOnly = list.filter((f) => f.deva && !f.latin), latin = list.filter((f) => f.latin);
    if (!devaOnly.length || !latin.length) continue;
    const L = new Set(latin.map((f) => f.weight)), D = new Set(devaOnly.map((f) => f.weight));
    for (const w of D) if (!L.has(w)) bad.push(`${family} ${w}: Devanagari only (${devaOnly.filter((f) => f.weight === w).map((f) => f.file).join(", ")}) — a Latin run at these weights falls back to the system font`);
    for (const w of L) if (!D.has(w)) bad.push(`${family} ${w}: Latin only (${latin.filter((f) => f.weight === w).map((f) => f.file).join(", ")}) — a Hindi run at these weights may miss Mukta`);
  }
  assert.deepEqual(bad, []);
});

// ── 2-3. the real app in Chromium ────────────────────────────────────────────────────────────────────────────────────────
/** A font URL's file on disk: /fonts/x → public/fonts/x; /assets/x → dist/assets/x; /@fs/<abs> or /src/... or /node_modules/... as is. */
function fontOnDisk(urlPath) {
  const name = urlPath.split("/").pop();
  const tries = [];
  if (urlPath.startsWith("/@fs/")) tries.push(urlPath.slice(4));
  tries.push(join(ROOT, urlPath.replace(/^\//, "")));
  if (urlPath.startsWith("/fonts/")) tries.push(join(ROOT, "public", urlPath));
  if (urlPath.startsWith("/assets/")) tries.push(join(ROOT, "dist", urlPath));
  for (const f of tries) { try { if (statSync(f).isFile()) return f; } catch { /* next */ } }
  // a hashed bundle name (atkinson-latin-AbC123.woff2) is in dist/assets only
  try { const d = join(ROOT, "dist/assets"); if (readdirSync(d).includes(name)) return join(d, name); } catch { /* no dist */ }
  return null;
}
let app, browser;
before(async () => {
  if (SKIP) return;
  app = await (await import("./support/app-server.mjs")).appServer();
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

async function lesson(artifact, ready) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
    studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact } };
  // fonts from disk, nothing off localhost (see the header)
  await page.route((u) => !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(String(u)), (route) => route.abort());
  await page.route("**/*.woff2", async (route) => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = fontOnDisk(p);
    return file ? route.fulfill({ status: 200, contentType: "font/woff2", body: readFileSync(file) }) : route.continue();
  });
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-font", topic: { id: "c4-maths-ch05-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${app.url}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(ready, { timeout: 30_000 });
  // the Devanagari faces (ext/deva.css, in the ext engine chunk the stage warms on idle) are declared and loaded
  await page.waitForFunction(() => [...document.fonts].some((f) => /Atkinson/.test(f.family) && /U\+900/i.test(f.unicodeRange)), null, { timeout: 30_000 });
  await page.evaluate(async (weights) => {
    const fams = ['"Atkinson Hyperlegible Next"', '"Bricolage Grotesque"', '"Geist Mono"', '"Board Atkinson Hyperlegible Next"'];
    await Promise.allSettled(fams.flatMap((f) => weights.map((w) => document.fonts.load(`${w} 40px ${f}`, "Aक"))));
    await document.fonts.ready;
  }, WEIGHTS);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
  /** The fonts Chromium actually used for an element's text (CDP), as "family(custom|system):glyphs". */
  const used = async (selector) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    if (!nodeId) return null;
    return (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
  };
  return { page, used };
}
const only = (fonts, family) => fonts?.length > 0 && fonts.every((f) => f.familyName.startsWith(family) && f.isCustomFont)   // (a variable face reports its instance: "Bricolage Grotesque 96pt ExtraBold");
const show = (fonts) => JSON.stringify(fonts?.map((f) => `${f.familyName}${f.isCustomFont ? "" : "(system)"}:${f.glyphCount}`));

test("live lesson stage (Studio v2 engine, Devanagari faces loaded): every Latin run at 400-900 is drawn in the stage's face, DOM and canvas", { skip: SKIP, timeout: 120_000 }, async () => {
  const topic = JSON.parse(readFileSync(join(ROOT, "data/studio-catalogue/topics/c4-maths-ch05-t01.json"), "utf8"));
  const { page, used } = await lesson({ kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: { rung: "library", archetype: topic.game.archetype, spec: topic.game.spec,
    boardTwin: { board: { title: "Equal parts", lines: ["1 whole = 4 equal parts"] } } } }, '.sv2-stage[data-ready="1"]');
  try {
    const bad = [];
    // the host's own chrome: the HUD readout (700, display) and the task pill's goal (ui), when the engine shows them
    for (const [sel, fam] of [[".sv2-hud .box b", "Bricolage Grotesque"], [".sv2-task .goal", "Atkinson Hyperlegible Next"]]) {
      const has = await page.evaluate((s) => !!document.querySelector(s)?.textContent?.trim(), sel);
      if (!has) continue;
      const f = await used(sel);
      if (!only(f, fam)) bad.push(`${sel}: ${show(f)}`);
    }
    // a Latin run in each stage family at every weight, inside the stage (its tokens), and the same run on a canvas
    const widths = await page.evaluate(({ STAGE, WEIGHTS, LATIN }) => {
      const stage = document.querySelector(".sv2-stage");
      const host = document.createElement("div"); host.id = "font-probe"; host.style.cssText = "position:absolute;left:0;top:0;opacity:0;pointer-events:none;white-space:nowrap";
      stage.appendChild(host);
      const ctx = document.createElement("canvas").getContext("2d");
      const out = {};
      for (const v of Object.keys(STAGE)) for (const w of WEIGHTS) {
        const stack = getComputedStyle(stage).getPropertyValue(v).trim();
        const s = document.createElement("span"); s.id = `p${v.slice(6)}${w}`; s.textContent = LATIN; s.style.font = `${w} 100px ${stack}`; host.appendChild(s);
        ctx.font = `${w} 100px ${stack}`; const canvas = ctx.measureText(LATIN).width;
        ctx.font = `${w} 100px system-ui, sans-serif`; const fallback = ctx.measureText(LATIN).width;
        out[`${v}:${w}`] = { dom: s.getBoundingClientRect().width, canvas, fallback };
      }
      const hi = document.createElement("span"); hi.id = "p-hi"; hi.textContent = "नमस्ते"; hi.style.font = `700 40px ${getComputedStyle(stage).getPropertyValue("--sv2-ui")}`; host.appendChild(hi);
      const hi4 = document.createElement("span"); hi4.id = "p-hi4"; hi4.textContent = "नमस्ते"; hi4.style.font = `400 40px ${getComputedStyle(stage).getPropertyValue("--sv2-ui")}`; host.appendChild(hi4);
      const hi6 = document.createElement("span"); hi6.id = "p-hi6"; hi6.textContent = "नमस्ते"; hi6.style.font = `600 40px ${getComputedStyle(stage).getPropertyValue("--sv2-ui")}`; host.appendChild(hi6);
      return out;
    }, { STAGE, WEIGHTS, LATIN });
    for (const [v, fam] of Object.entries(STAGE)) for (const w of WEIGHTS) {
      const f = await used(`#p${v.slice(6)}${w}`);
      if (!only(f, fam)) bad.push(`${v} ${w} DOM: ${show(f)}`);
      const m = widths[`${v}:${w}`];
      // canvas text resolves through the same font selector: its width is the DOM run's (the proven face), not the fallback's
      // (within 3 px of 1000: the stage's DOM text is laid out with its own text-rendering, the canvas without)
      if (Math.abs(m.canvas - m.dom) > 3 || Math.abs(m.canvas - m.fallback) < 10) bad.push(`${v} ${w} canvas ${m.canvas.toFixed(1)} px vs DOM ${m.dom.toFixed(1)} px (system sans ${m.fallback.toFixed(1)})`);
    }
    for (const id of ["#p-hi", "#p-hi4", "#p-hi6"]) { const f = await used(id); if (!only(f, "Mukta")) bad.push(`Hindi ${id}: ${show(f)}`); }
    // (main 2026-11-11, release 20 on a phone: 400 Hindi drew in Mukta SemiBold — the 600 file served 400-600. The used WEIGHT
    // counts too: 400 is Mukta's regular, 600 its SemiBold. The face's own name says which file was used)
    const name = async (id) => ((await used(id)) ?? []).filter((f) => f.familyName.startsWith("Mukta")).map((f) => f.familyName).join("+");
    const n4 = await name("#p-hi4"), n6 = await name("#p-hi6");
    if (/SemiBold|Bold|Medium/.test(n4)) bad.push(`Hindi 400 drawn in ${n4}, not Mukta's regular`);
    if (!/SemiBold/.test(n6)) bad.push(`Hindi 600 drawn in ${n6}, not Mukta SemiBold`);
    if (process.env.FONT_MATCH_LOG) console.log(JSON.stringify(widths));
    assert.deepEqual(bad, []);
  } finally { await page.close(); }
});

test("whiteboard: the word face and a 700 run of it resolve to Atkinson Hyperlegible Next with the Devanagari faces loaded", { skip: SKIP, timeout: 120_000 }, async () => {
  const script = { v: 1, scriptId: "font", line: { lessonId: "L-font" }, anchor: "line_audio_start", board: { w: 800, h: 500, ground: "chalk" }, mode: "fresh", durationMs: 400,
    ops: [{ id: "t1", op: "text", at: [400, 250], text: "Half of eight", size: "m", startMs: 0, endMs: 200 }] };
  const { page, used } = await lesson({ kind: "whiteboard", stage: { w: 800, h: 500 }, script }, '[data-testid="studio-box"] svg text');
  try {
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('[data-testid="studio-box"] svg text')].find((e) => /Half/.test(e.textContent ?? ""));
      t.id = "wb-word";
      const b = t.cloneNode(true); b.id = "wb-bold"; b.style.fontWeight = "700"; t.parentNode.appendChild(b);
    });
    // (CI 2026-11-11: the clone was asked for its used fonts before it was laid out and painted — an empty list. Wait for
    // the fonts and two frames, then ask again until the node reports a font, at most 3 s)
    await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const bad = [];
    for (const id of ["#wb-word", "#wb-bold"]) {
      let f = await used(id);
      for (let i = 0; i < 15 && !f?.length; i++) { await page.waitForTimeout(200); f = await used(id); }
      if (!only(f, "Atkinson Hyperlegible Next")) bad.push(`${id}: ${show(f)}`);
    }
    assert.deepEqual(bad, []);
  } finally { await page.close(); }
});
