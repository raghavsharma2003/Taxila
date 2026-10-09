// Round 3 · forge · visual audit walker (2026-10-09). Reproduces the owner's complaint ("the content which is built is cheap
// and basic and nonsense ... when seen in the site is not viewed properly and totally broken") in the REAL child client.
//
// For each case: a fresh child on one @taxila.test guardian, the practice page of the case's topic on the text lane, two
// ordinary child turns, then the child's visual ask ("picture dikhao", "game khelna hai", ...). When something real is on
// the stage (a Studio piece painted, a board drawn, an engine frame in the tray) the SAME page is shot at 360 x 800,
// 412 x 915 and 1366 x 768 (the Desk re-solves from its container: one lesson, three layouts), and the page is measured:
// the visual's box in CSS px, every text element's rendered px and whether it is clipped by the box, the touch targets,
// and (for canvas engines, whose words are pixels) the host's own floors scaled to the box. Then two more answer turns
// are taken and any NEW tray content (a practice mount) is shot the same way.
//
// Browser trust: Chromium launched with HOME pointing at a private NSS db that trusts the sandbox proxy's CA
// (/root/.ccr/agent-proxy-ca.crt) — real TLS verification, no ignoreHTTPSErrors (the shared ~/.pki/nssdb is empty).
// One context, deviceScaleFactor 2, hasTouch, resized between the three sizes (isMobile cannot change in a context).
// No microphone is granted: the dock opens its typed row. Young (class <= 4) children have no typed row, so the walk
// uses class-5+ personas, also on class-4 topics (the Older Desk; the Young Desk is not covered by this walk).
//
//   NODE_USE_ENV_PROXY=1 node docs/design/round3/forge/audit/harness/walk.mjs --base https://taxila.dev --out <dir>
//     [--cases picture,diagram,...] [--nss-home <dir with .pki/nssdb>]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, withTestAccount, ok, warn, done, BASE, isLocal, PERSONAS, GREET, freshChild, openLesson } from "../../../../../../tests/prod/_owner.mjs";

const OUT = arg("out", join(process.cwd(), "audit-out"));
const NSS_HOME = arg("nss-home", process.env.FORGE_NSS_HOME || "");
const ONLY = arg("cases", "");
const SETTLE = Number(arg("settle", "7000"));
mkdirSync(OUT, { recursive: true });

export const VIEWPORTS = [
  { id: "p360", width: 360, height: 800 },
  { id: "p412", width: 412, height: 915 },
  { id: "l1366", width: 1366, height: 768 },
];

// The owner-5 asks on the round-2 topics, plus the perimeter mount the live-tech audit saw mismatched, plus science,
// EVS and SST asks so every kind of live-built content is reached at least once.
export const CASES = [
  { id: "picture", ask: "picture dikhao", persona: "aarav", topic: "c5-maths-ch02-t01" },
  { id: "diagram", ask: "show me a diagram", persona: "meher", topic: "c6-maths-ch07-t01" },
  { id: "draw", ask: "draw it", persona: "zoya", topic: "c5-evs-ch01-t01" },
  { id: "whiteboard", ask: "whiteboard pe bana ke samjhao", persona: "kabir", topic: "c7-maths-ch08-t01" },
  { id: "game", ask: "game khelna hai", persona: "aarav", topic: "c4-maths-ch05-t01" },
  { id: "animation", ask: "animation dikhao na", persona: "ishaan", topic: "c6-science-ch01-t01" },
  { id: "game-perimeter", ask: "game khelna hai", persona: "meher", topic: "c6-maths-ch06-t01" },
  { id: "sim-science", ask: "simulation dikhao", persona: "kabir", topic: "c7-science-ch01-t01" },
  { id: "picture-evs", ask: "picture dikhao", persona: "zoya", topic: "c4-evs-ch01-t01" },
  { id: "diagram-science", ask: "show me a diagram", persona: "meher", topic: "c6-science-ch02-t01" },
  { id: "game-sst", ask: "can we play a game?", persona: "meher", topic: "c6-sst-ch01-t01" },
  { id: "animation-maths", ask: "animation dikhao na", persona: "aarav", topic: "c5-maths-ch01-t01" },
].filter((c) => !ONLY || ONLY.split(",").includes(c.id));

/** In-page: everything visual on the Desk, measured in CSS px. Runs in the page (no closures). */
export function measurePage() {
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05; };
  const inside = (a, b, tol = 1) => a.x >= b.x - tol && a.y >= b.y - tol && a.x + a.w <= b.x + b.w + tol && a.y + a.h <= b.y + b.h + tol;
  const out = { vw: innerWidth, vh: innerHeight, scrollH: document.documentElement.scrollHeight, tray: null, stage: null, texts: [], targets: [], frames: [] };
  const tray = document.querySelector('[data-testid="tray"]');
  if (tray && vis(tray)) out.tray = { ...R(tray), kind: tray.getAttribute("data-kind") };
  const stage = document.querySelector('[data-testid="studio-stage"]');
  const box = document.querySelector('[data-testid="studio-box"]');
  if (stage && vis(stage)) {
    out.stage = { ...R(stage), kind: stage.getAttribute("data-kind"), state: stage.getAttribute("data-state"), phase: stage.getAttribute("data-phase") };
    if (box) out.stage.box = R(box);
    const cv = box?.querySelector("canvas.sv2-canvas") || box?.querySelector("canvas");
    if (cv && vis(cv)) out.stage.canvas = { ...R(cv), backing: [cv.width, cv.height] };
    const sv = box?.querySelector("svg");
    if (sv && vis(sv)) { const vb = sv.viewBox?.baseVal; out.stage.svg = { ...R(sv), viewBox: vb ? [vb.width, vb.height] : null }; }
  }
  const region = box && vis(box) ? R(box) : out.tray;
  const root = box && vis(box) ? box : tray;
  if (root && region) {
    // every element that directly holds visible text
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const el = n.parentElement;
      if (!el || seen.has(el) || !vis(el)) continue;
      seen.add(el);
      const rng = document.createRange(); rng.selectNodeContents(n);
      const rects = [...rng.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (!rects.length) continue;
      const u = rects.reduce((a, r) => ({ x: Math.min(a.x, r.left), y: Math.min(a.y, r.top), x2: Math.max(a.x2, r.right), y2: Math.max(a.y2, r.bottom) }), { x: 1e9, y: 1e9, x2: -1e9, y2: -1e9 });
      const rr = { x: Math.round(u.x), y: Math.round(u.y), w: Math.round(u.x2 - u.x), h: Math.round(u.y2 - u.y) };
      // rendered font px: the computed size times the element's on-screen scale (a transformed SVG / scaled stage)
      const cs = getComputedStyle(el);
      let px = parseFloat(cs.fontSize) || 0;
      if (el instanceof SVGElement) {
        const ctm = el.getScreenCTM?.();
        if (ctm) px *= Math.hypot(ctm.a, ctm.b);
      } else if (el.offsetWidth > 0) {
        const k = el.getBoundingClientRect().width / el.offsetWidth;
        if (Number.isFinite(k) && k > 0) px *= k;
      }
      const lineH = rects[0].height;
      const clippedOwn = el instanceof HTMLElement && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) && /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY) && cs.textOverflow !== "clip-never";
      out.texts.push({ t: t.slice(0, 80), px: Math.round(px * 10) / 10, lineH: Math.round(lineH), ...rr, outside: !inside(rr, region), ellipsis: clippedOwn });
    }
    for (const el of root.querySelectorAll("button, [role=button], a[href], input, [data-tap], [draggable=true]")) {
      if (!vis(el)) continue;
      const r = R(el);
      out.targets.push({ label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), w: r.w, h: r.h, outside: !inside(r, region) });
    }
    for (const f of root.querySelectorAll("iframe")) if (vis(f)) out.frames.push({ ...R(f), name: f.getAttribute("title") || f.getAttribute("name") || "" });
  }
  return out;
}

/** In a module frame (engine): text px, targets, and anything past the frame's own viewport (cut off). */
export function measureFrame() {
  const vw = innerWidth, vh = innerHeight;
  const out = { vw, vh, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, texts: [], targets: [], svgs: [] };
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    const el = n.parentElement;
    if (!t || !el || seen.has(el) || !vis(el) || el.closest("script,style")) continue;
    seen.add(el);
    const rng = document.createRange(); rng.selectNodeContents(n);
    const rs = [...rng.getClientRects()].filter((r) => r.width > 0);
    if (!rs.length) continue;
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top)), x2 = Math.max(...rs.map((r) => r.right)), y2 = Math.max(...rs.map((r) => r.bottom));
    let px = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (el instanceof SVGElement) { const m = el.getScreenCTM?.(); if (m) px *= Math.hypot(m.a, m.b); }
    out.texts.push({ t: t.slice(0, 80), px: Math.round(px * 10) / 10, x: Math.round(x), y: Math.round(y), w: Math.round(x2 - x), h: Math.round(y2 - y), outside: x < -1 || y < -1 || x2 > vw + 1 || y2 > vh + 1 });
  }
  for (const el of document.querySelectorAll("button, [role=button], input, [data-tap]")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    out.targets.push({ label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), outside: r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1 });
  }
  for (const s of document.querySelectorAll("svg")) { if (!vis(s)) continue; const r = s.getBoundingClientRect(); out.svgs.push({ w: Math.round(r.width), h: Math.round(r.height), outside: r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1 || r.top < -1 }); }
  return out;
}

/** Studio v2 host floors (src/studio-v2/core/tokens.ts MIN, design units of a 1000-wide world). */
export const SV2_MIN = { label: 38, value: 48, target: 130, worldW: 1000 };

/** Defects of one measured view, by the bars the owner's complaint implies (legible, whole, touchable, on the screen). */
export function defectsOf(m, frames = [], { vp } = {}) {
  const d = [];
  const minText = vp && vp.width >= 900 ? 12 : 12; // the Desk's own floor for any child-facing word (ds tokens: 12 px caption floor)
  const box = m.stage?.box ?? m.tray;
  if (!box) { d.push({ code: "no_visual", note: "nothing visual on the Desk" }); return d; }
  const area = box.w * box.h, vpArea = m.vw * m.vh;
  if (box.w < 300 && m.vw < 900) d.push({ code: "visual_cramped", note: `visual box ${box.w} x ${box.h} CSS px on a ${m.vw} px phone (${Math.round(100 * area / vpArea)}% of the screen)` });
  if (m.stage?.canvas) {
    const s = m.stage.canvas.w / SV2_MIN.worldW;
    const label = SV2_MIN.label * s, target = SV2_MIN.target * s;
    if (label < minText) d.push({ code: "canvas_text_too_small", note: `engine labels ${label.toFixed(1)} px (38 units x ${s.toFixed(3)})` });
    if (target < 44) d.push({ code: "canvas_target_too_small", note: `engine targets ${target.toFixed(1)} px (130 units x ${s.toFixed(3)})` });
  }
  const small = m.texts.filter((t) => t.px > 0 && t.px < minText);
  if (small.length) d.push({ code: "text_too_small", note: `${small.length} text runs < ${minText} px, smallest ${Math.min(...small.map((t) => t.px))} px: "${small[0].t}"` });
  const cut = m.texts.filter((t) => t.outside || t.ellipsis);
  if (cut.length) d.push({ code: "text_cut_off", note: `${cut.length} text runs clipped by the box: "${cut[0].t}"` });
  const tgt = m.targets.filter((t) => Math.min(t.w, t.h) < 44 && !/^\s*$/.test(t.label));
  if (tgt.length) d.push({ code: "target_too_small", note: `${tgt.length} targets < 44 px, e.g. "${tgt[0].label}" ${tgt[0].w}x${tgt[0].h}` });
  if (m.scrollH > m.vh + 2) d.push({ code: "page_scrolls", note: `page ${m.scrollH} px tall in a ${m.vh} px viewport` });
  for (const f of frames) {
    if (f.scrollW > f.vw + 2) d.push({ code: "frame_overflows_x", note: `engine content ${f.scrollW} px wide in a ${f.vw} px frame (cut at the right edge)` });
    if (f.scrollH > f.vh + 2) d.push({ code: "frame_overflows_y", note: `engine content ${f.scrollH} px tall in a ${f.vh} px frame` });
    const fs = f.texts.filter((t) => t.px > 0 && t.px < minText);
    if (fs.length) d.push({ code: "frame_text_too_small", note: `${fs.length} engine text runs < ${minText} px, smallest ${Math.min(...fs.map((t) => t.px))}: "${fs[0].t}"` });
    const fo = f.texts.filter((t) => t.outside);
    if (fo.length) d.push({ code: "frame_text_cut_off", note: `${fo.length} engine text runs outside the frame: "${fo[0].t}"` });
    const ft = f.targets.filter((t) => Math.min(t.w, t.h) < 44);
    if (ft.length) d.push({ code: "frame_target_too_small", note: `${ft.length} engine targets < 44 px, e.g. "${ft[0].label}" ${ft[0].w}x${ft[0].h}` });
    if (f.svgs.some((s) => s.outside)) d.push({ code: "frame_svg_cut_off", note: "an engine drawing runs past the frame edge" });
  }
  return d;
}

async function frameMetrics(page) {
  const res = [];
  for (const fr of page.frames()) {
    if (fr === page.mainFrame()) continue;
    try {
      const el = await fr.frameElement();
      const box = await el.boundingBox();
      if (!box || box.width < 20 || box.height < 20) continue;
      const m = await fr.evaluate(measureFrame);
      res.push({ url: fr.url().slice(0, 80), box: { w: Math.round(box.width), h: Math.round(box.height) }, ...m });
    } catch { /* detached or inaccessible */ }
  }
  return res;
}

const stageSig = (m) => JSON.stringify([m.tray?.kind ?? null, m.stage?.kind ?? null, m.stage?.phase ?? null, m.frames.length]);

async function shootAll(page, dir, tag, extra = {}) {
  const views = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(1400);
    const file = join(dir, `${tag}-${vp.id}.png`);
    await page.screenshot({ path: file, fullPage: false }).catch(() => {});
    const m = await page.evaluate(measurePage);
    const frames = await frameMetrics(page);
    const defects = defectsOf(m, frames, { vp });
    views.push({ vp: vp.id, file: file.split("/").slice(-2).join("/"), m, frames, defects });
  }
  await page.setViewportSize({ width: VIEWPORTS[0].width, height: VIEWPORTS[0].height });
  return { tag, ...extra, views };
}

async function launchBrowser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const env = { ...process.env };
  if (NSS_HOME) env.HOME = NSS_HOME;
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  return chromium.launch({ env, ...(proxy ? { proxy } : {}), args: ["--autoplay-policy=no-user-gesture-required"] });
}

const results = [];
await withTestAccount(async ({ api }) => {
  const browser = await launchBrowser();
  try {
    for (const c of CASES) {
      const persona = PERSONAS[c.persona];
      const child = await freshChild(api, persona);
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
      const cookie = api.cookie();
      if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
      const page = await ctx.newPage();
      const net = [];
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 200)}`); });
      page.on("response", async (r) => {
        const u = r.url();
        if (!/\/api\/(lesson\/turn|lesson\/start|studio\/slot)/.test(u)) return;
        try { const j = await r.json(); net.push({ at: Date.now(), url: u.replace(BASE, "").slice(0, 120), ui: j.ui ?? null, studio: j.studio ?? null, slot: j.slot ?? null, moduleCommands: j.moduleCommands ?? null, reply: j.teacherReply ?? null }); } catch { /* not json */ }
      });
      const rec = { case: c.id, ask: c.ask, topic: c.topic, persona: c.persona, shots: [], errors, turns: [] };
      results.push(rec);
      const dir = join(OUT, c.id);
      mkdirSync(dir, { recursive: true });
      try {
        await page.goto(`${BASE}/c/${child.id}/practice/${c.topic}?mode=text`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
        const send = async (text) => {
          // a number answer with the NumberPad open in the tray: the child taps the digits
          const pad = page.locator('[data-testid="number-pad"]');
          if (/^\d+$/.test(text) && await pad.isVisible().catch(() => false)) {
            for (const ch of text) await pad.locator(".dk-key", { hasText: new RegExp(`^${ch}$`) }).first().click().catch(() => {});
            const t0 = Date.now();
            await pad.locator(".dk-key--send").click().catch(() => {});
            rec.turns.push({ child: text, at: t0, via: "pad" });
            await page.waitForTimeout(2500);
            return;
          }
          const input = page.locator('[data-testid="child-input"]');
          // the typed lane: the keyboard row is open when there is no mic; else open it from the dock's Type button
          for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) {
            if (/^\d+$/.test(text) && await pad.isVisible().catch(() => false)) return send(text);
            const typeBtn = page.locator('[data-testid="type"]');
            if (await typeBtn.isVisible().catch(() => false)) await typeBtn.click().catch(() => {});
            await page.waitForTimeout(1500);
          }
          await input.waitFor({ state: "visible", timeout: 45_000 });
          await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45_000 }).catch(() => {});
          await input.fill(text);
          const t0 = Date.now();
          await input.press("Enter");
          rec.turns.push({ child: text, at: t0 });
          await page.waitForTimeout(2500);
        };
        await page.waitForTimeout(3000);
        rec.shots.push(await shootAll(page, dir, "00-open"));
        await send(GREET[persona.style] ?? GREET.hinglish);
        await send(persona.style === "english" ? "okay" : "haan");
        const before = stageSig(await page.evaluate(measurePage));
        await send(c.ask);
        // wait for a real visual: a Studio piece painted (phase live/reveal) or a new tray kind with media
        let seen = false;
        for (let k = 0; k < 14 && !seen; k++) {
          const m = await page.evaluate(measurePage);
          const media = (m.stage && (m.stage.canvas || m.stage.svg || m.frames.length)) || (m.tray && m.tray.kind !== "pad" && m.tray.kind !== "tiles" && (m.frames.length || m.texts.length));
          if (media && stageSig(m) !== before && (!m.stage || m.stage.phase === "live" || m.stage.phase === "reveal")) seen = true;
          else await page.waitForTimeout(1500);
        }
        rec.realVisual = seen;
        await page.waitForTimeout(SETTLE);
        rec.shots.push(await shootAll(page, dir, "01-ask", { seen }));
        // two more turns: the practice mount (if any) is shot too
        let prev = stageSig(await page.evaluate(measurePage));
        for (const [n, line] of [["02", persona.style === "english" ? "okay, next" : "achha, aage"], ["03", persona.style === "english" ? "I think 4" : "4"]]) {
          await send(line);
          await page.waitForTimeout(SETTLE);
          const m = await page.evaluate(measurePage);
          const sig = stageSig(m);
          if (sig !== prev && (m.tray || m.stage)) rec.shots.push(await shootAll(page, dir, `${n}-turn`));
          prev = sig;
        }
      } catch (e) {
        rec.error = String(e.message).slice(0, 300);
        await page.screenshot({ path: join(dir, "zz-error.png") }).catch(() => {});
      } finally {
        rec.net = net.map((x) => ({ ...x, at: x.at - (rec.turns[0]?.at ?? x.at) }));
        writeFileSync(join(dir, "record.json"), JSON.stringify(rec, null, 1));
        await ctx.close().catch(() => {});
      }
      const views = rec.shots.flatMap((s) => s.views);
      ok(!rec.error, `${c.id} (${c.topic}) walked${rec.error ? `: ${rec.error}` : ""}; real visual after the ask: ${rec.realVisual ? "yes" : "NO"}; views ${views.length}, broken views ${views.filter((v) => v.defects.length).length}`);
    }
  } finally {
    await browser.close().catch(() => {});
  }
}, { tag: "r3forge-audit", child: { firstName: "Riya" } });

writeFileSync(join(OUT, "summary.json"), JSON.stringify(results.map((r) => ({ case: r.case, topic: r.topic, realVisual: r.realVisual, error: r.error ?? null,
  shots: r.shots.map((s) => ({ tag: s.tag, views: s.views.map((v) => ({ vp: v.vp, file: v.file, tray: v.m.tray, stage: v.m.stage && { kind: v.m.stage.kind, phase: v.m.stage.phase, box: v.m.stage.box, canvas: v.m.stage.canvas }, defects: v.defects })) })),
  errors: r.errors.slice(0, 10) })), null, 1));
done();
