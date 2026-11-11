// r8 Games: the LAYOUT check for kon's round-8 boards (the same kind of check as tests/studio-v2-layout.test.mjs, for play
// views): each served level of kon/place (and kon/name once it lands) is mounted in the real PlayStage (the forge3 harness's
// play mode) at 360 × 640 and 1366 × 768, and played through its screens with the law's own acts: the first screen, mid-play,
// every mapped mal-rule played out, and the end. On every screen it refuses: two canvas texts overlapping (≥ 20 % of the
// smaller one, the visual QA's Q3 share), a text cut by the canvas edge, a label the painter had to clip, two controls
// overlapping, a control under 44 px, and a touch target under 64 px (classes 6-9; kon/name's letters and arcs: 48 px, as
// its band's floor). Since the judge packets (r8 fixes): a tick or ring over a letter or label, a chip across an arm or ray or
// over a point, two touch targets of one kind overlapping (arc targets are discs), the vertex-off ring before her first
// decision, an English accessible label in a Hinglish lesson, and the board moving when the game is solved. KON_SHOTS=<dir>
// also writes a PNG of every screen. Runs in `npm test` when Chromium is installed; FORGE3_BROWSER=0 skips it.
// Since the hold of 2026-11-11 (kon/place: the inner "80100" at 360 after "Rakh do"; the protractor shrinking when the pad
// came): every two scale numbers (outer and inner, outer against inner) keep SCALE_GAP px between their boxes, checked
// HEADLESSLY on every generated level of every kon/place goal (every pose the level serves, and every whole turn she can
// give the protractor) at the world box of 360 × 640 and of 1366 × 768, with the view's own layout function
// (kon.scale.ts), and in the browser on the served levels with the widths the browser measured; and the protractor's drawn
// size is the same on every screen of a level (first, placed and locked, typed, each miss, the end) at both sizes.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { BW, BH, PR, PRINT_EVERY, SIZE_PRINT_EVERY, TOL_PX, initPlace, goodPose, vertexOffPose, centreOnArmPose, sizeFigs } from "../src/play/families/kon/kon.place.ts";
import { SCALE_GAP, INK_H, monoMeasure, scaleLabels, scaleOmit } from "../src/play/families/kon/kon.scale.ts";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const haveChromium = existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.FORGE3_BROWSER === "0" ? "FORGE3_BROWSER=0" : !haveChromium ? "no Chromium" : false;
const SIZES = [{ tag: "360x640", w: 360, h: 640 }, { tag: "1366x768", w: 1366, h: 768 }];
export const KEYS = ["kon/place", "kon/name"];

/** does segment a–b cross box r (shrunk by `inset` so a line that only grazes an edge is not counted)? */
export function segCrossesBox(a, b, r, inset = 2) {
  const x0 = r.x + inset, y0 = r.y + inset, x1 = r.x + r.w - inset, y1 = r.y + r.h - inset;
  if (x1 <= x0 || y1 <= y0) return false;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = 0, t1 = 1;
  for (const [pp, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
    if (pp === 0) { if (q < 0) return false; continue; }
    const t = q / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}
/** the faults on one screen (pure: the probe's numbers in, the refusals out) */
export function screenFaults(probe, minTarget = 64) {
  const out = [], T = probe.texts, cw = probe.canvas.w, ch = probe.canvas.h;
  const inter = (a, b) => Math.max(0, Math.min(a.x0 + a.w, b.x0 + b.w) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y0 + a.h, b.y0 + b.h) - Math.max(a.y0, b.y0));
  for (let i = 0; i < T.length; i++) {
    const t = T[i];
    if (t.x0 < -1 || t.y0 < -1 || t.x0 + t.w > cw + 1 || t.y0 + t.h > ch + 1) out.push(`cut "${t.s}"`);
    for (let j = i + 1; j < T.length; j++) {
      const u = T[j];
      if (t.s === u.s && Math.abs(t.x0 - u.x0) < 1 && Math.abs(t.y0 - u.y0) < 1) continue;   // a glow pass of the same run
      const share = inter(t, u) / Math.min(t.w * t.h, u.w * u.h);
      if (share >= 0.2) out.push(`text×text "${t.s}" / "${u.s}" (${share.toFixed(2)})`);
    }
  }
  if (probe.clipped) out.push(`clipped ${probe.clipped}`);
  const C = probe.ctl;
  for (let i = 0; i < C.length; i++) {
    if (C[i].h < 44 || C[i].w < 44) out.push(`small control "${C[i].t}" ${Math.round(C[i].w)}x${Math.round(C[i].h)}`);
    for (let j = i + 1; j < C.length; j++) { const a = C[i], b = C[j]; if (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1) out.push(`control×control "${a.t}" / "${b.t}"`); }
  }
  const min = (id) => (/^(arc|pt)-/.test(id) ? Math.min(minTarget, 48) : minTarget);
  for (const t of probe.targets) if (t.w < min(t.id) - 0.5 || t.h < min(t.id) - 0.5) out.push(`small target ${t.id} ${Math.round(t.w)}x${Math.round(t.h)}`);
  // touch targets of one kind (arc-0 … arc-4, pt-0 … pt-3) never overlap: arc targets are discs, the others squares
  const G = probe.targets;
  for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++) {
    const a = G[i], b = G[j], ka = a.id.split("-")[0];
    if (ka !== b.id.split("-")[0] || !a.id.includes("-")) continue;
    const meet = ka === "arc" ? Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2) < (a.w + b.w) / 2 - 0.5
      : Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
    if (meet) out.push(`target×target ${a.id} / ${b.id}`);
  }
  // marks: a tick or a ring over any letter or label; a chip over a text that is not its own, across an arm or ray, or over a
  // point's dot
  const M = probe.marks ?? [], S = probe.segs ?? [];
  const tbox = (t) => ({ x: t.x0, y: t.y0, w: t.w, h: t.h });
  const meetBox = (a, b, pad = 0) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > pad && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > pad;
  for (const m of M) {
    if (m.kind === "tick" || m.kind === "ring") for (const t of T) if (meetBox(m, tbox(t), 1)) out.push(`${m.kind}×text "${t.s}"`);
    if (m.kind === "tick") for (const d of M) if (d.kind === "dot" && meetBox(m, d, 1)) out.push("tick×point");
    if (m.kind !== "chip") continue;
    const own = (t) => Math.abs(t.x0 + t.w / 2 - (m.x + m.w / 2)) < 2 && Math.abs(t.y0 + t.h / 2 - (m.y + m.h / 2)) < 3;
    for (const t of T) if (!own(t) && meetBox(m, tbox(t), 1)) out.push(`chip×text "${t.s}"`);
    for (const g of S) if (segCrossesBox([g.x0, g.y0], [g.x1, g.y1], m)) out.push(`chip×${g.kind} at ${Math.round(m.x)},${Math.round(m.y)}`);
    for (const d of M) if (d.kind === "dot" && meetBox(m, d, 1)) out.push("chip×point");
  }
  for (const a of probe.aria ?? []) if (/\b(the|one|turn|less|more|undo)\b/i.test(a) && probe.lang !== "en") out.push(`English aria "${a}"`);
  return out;
}

/** the world box (the play canvas, CSS px) kon/place is drawn in, by goal: measured in the browser (the check below refuses
 *  a box that differs, so these cannot go stale). measure and draw keep a three-row band of controls from the first screen
 *  on a phone (play.css), so their box never changes inside a level */
export const WORLD = {
  "360x640": { measure: { w: 360, h: 287 }, draw: { w: 360, h: 287 }, size: { w: 360, h: 399 } },
  "1366x768": { measure: { w: 1005, h: 768 }, draw: { w: 1005, h: 768 }, size: { w: 1005, h: 768 } },
};
/** the room between two number boxes (px; negative: they overlap). The test's own arithmetic, not kon.scale.ts's */
const roomBetween = (p, q) => Math.max(Math.abs(p.x - q.x) - (p.w + q.w) / 2, Math.abs(p.y - q.y) - (p.h + q.h) / 2);
/** every pair of numbers closer than SCALE_GAP: [a, b, room] */
export function numberClashes(L, gap = SCALE_GAP) {
  const out = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const g = roomBetween(L[i], L[j]); if (g < gap - 0.01) out.push([L[i].s, L[j].s, +g.toFixed(2)]); }
  return out;
}
/** the numbers one protractor prints, as the view lays them out (headless widths: Geist Mono's 0.6 em) */
function printedNumbers({ rot, R, rad0, every, radii, fs = 14 }) {
  const omit = scaleOmit(radii ?? [{ R, rad0 }], every, fs, monoMeasure, rot);
  return scaleLabels({ rot, R, rad0, every, fs, measure: monoMeasure, omit });
}
const placeReq = (goal, seed, fade) => ({ family: "kon", mode: "place", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap: {}, grammar: { tol: 3, tolPx: TOL_PX }, recent: [], seed });

it("kon/place scale numbers: no two closer than SCALE_GAP px, every generated level, every pose and turn, 360 and 1366 (headless)", () => {
  const faults = [];
  let levels = 0, checked = 0;
  for (const goal of ["measure", "draw", "size"]) for (const fade of [1, 2, 3]) for (const seed of [1, 7, 42, 99, 123, 2026]) {
    for (const c of konLogic.generate(placeReq(goal, seed, fade))) {
      const p = konLogic.validate(c.level).params;
      levels++;
      for (const [tag, sizes] of Object.entries(WORLD)) {
        const box = sizes[goal], s = Math.min(box.w / BW, box.h / BH);
        assert.ok(s > 0.5, `${tag} ${goal}: world box ${JSON.stringify(box)}`);
        const sets = [];
        if (goal === "size") {
          // both protractors upright, printing the same numbers
          const radii = sizeFigs(p).map((f) => ({ R: f.rad * s, rad0: f.rad })), every = SIZE_PRINT_EVERY[p.scale];
          for (const r of radii) sets.push([`r${r.rad0}`, printedNumbers({ rot: 0, ...r, every, radii })]);
          // the same numbers on both
          const shown = sets.map(([, L]) => L.map((l) => `${l.ring}${l.a}`).sort().join(","));
          if (shown[0] !== shown[1]) faults.push(`${tag} ${c.level.levelId}: the two protractors print different numbers (${shown.join(" | ")})`);
        } else {
          const every = PRINT_EVERY[p.scale];
          const poses = { rest: initPlace(p).pose, placed: goodPose(p), "vertex-off": vertexOffPose(p), "centre-on-arm": centreOnArmPose(p) };
          for (const [k, q] of Object.entries(poses)) sets.push([k, printedNumbers({ rot: q.rot, R: PR * s, rad0: PR, every })]);
        }
        for (const [k, L] of sets) {
          checked++;
          for (const [a, b, g] of numberClashes(L)) faults.push(`${tag} ${c.level.levelId} ${k}: "${a}" and "${b}" ${g} px apart`);
          // both scales stay numbered: the ends of both, and 90 where the fade prints it
          for (const want of ["outer0", "outer180", "inner0", "inner180"]) if (!L.some((l) => `${l.ring}${l.a}` === want)) faults.push(`${tag} ${c.level.levelId} ${k}: ${want} not printed`);
          if (L.filter((l) => l.ring === "inner").length < Math.min(4, 180 / (goal === "size" ? SIZE_PRINT_EVERY[p.scale] : PRINT_EVERY[p.scale]))) faults.push(`${tag} ${c.level.levelId} ${k}: the inner scale is too bare (${L.filter((l) => l.ring === "inner").map((l) => l.s)})`);
        }
      }
    }
  }
  // every whole turn she can give the loose protractor, at every fade and both sizes
  for (const [tag, sizes] of Object.entries(WORLD)) for (const goal of ["measure", "draw"]) {
    const box = sizes[goal], s = Math.min(box.w / BW, box.h / BH);
    for (const every of new Set(Object.values(PRINT_EVERY))) for (let rot = 0; rot < 360; rot++) {
      checked++;
      for (const [a, b, g] of numberClashes(printedNumbers({ rot, R: PR * s, rad0: PR, every }))) faults.push(`${tag} ${goal} every ${every}° turn ${rot}: "${a}" and "${b}" ${g} px apart`);
    }
  }
  assert.ok(levels >= 100, `${levels} levels`);
  assert.deepEqual(faults.slice(0, 40), [], `${faults.length} faults over ${checked} protractors`);
});

it("numberClashes: two numbers 3 px apart side by side clash, 6 px apart do not; diagonal neighbours by both axes", () => {
  const n = (s, x, y, w = 16.8, h = 14 * INK_H) => ({ s, x, y, w, h });
  assert.equal(numberClashes([n("80", 0, 0), n("100", 16.8 / 2 + 25.2 / 2 + 3, 0, 25.2)]).length, 1);
  assert.equal(numberClashes([n("80", 0, 0), n("100", 16.8 / 2 + 25.2 / 2 + 6, 0, 25.2)]).length, 0);
  assert.equal(numberClashes([n("80", 0, 0), n("60", 10, 14 * INK_H + 5)]).length, 0);   // overlapping in x, 5 px apart in y
  // the hold's own case: at 360 (s ≈ 0.844), turn 0, fade 1, the inner 80 and 100 are no longer both printed side by side
  const L = printedNumbers({ rot: 0, R: PR * 0.844, rad0: PR, every: 20 });
  assert.deepEqual(numberClashes(L), []);
});

describe("r8 kon boards: no overlap or cut-off on any screen at 360 × 640 and 1366 × 768", { skip: SKIP, timeout: 300_000 }, () => {
  let browser, served, levels = [];
  before(async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= browsersDir;
    process.env.FORGE3_QA_LOCAL = "1";
    const { buildHarness, serveHarness, launchLocal } = await import("../server/forge3/qa/render.js");
    const { coverageLevels } = await import("../server/forge3/play-cert.js");
    const { coverage } = await import("../server/play/levels.js");
    for (const e of coverage().entries.filter((x) => KEYS.includes(`${x.family}/${x.mode}`))) for (const l of await coverageLevels(e, 2, { focus: true })) levels.push(l);
    served = await serveHarness(await buildHarness(join(tmpdir(), `kon-layout-${process.pid}`)));
    browser = await launchLocal();
  });
  after(async () => { await browser?.close(); served?.server.close(); });

  it("every served level, every screen", async () => {
    const { LOGIC } = await import("../src/play/families/index.ts");
    assert.ok(levels.length >= 6, `${levels.length} levels`);
    const faults = [];
    let screens = 0;
    for (const size of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1, hasTouch: true });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message)));
      await page.goto(served.base);
      await page.waitForFunction(() => window.__forge3?.ready === true);
      let mono = null;
      for (let level of levels) {
        const logic = LOGIC[`${level.family}/${level.mode}`], sol = logic.solve(level);
        // the screens: first; mid-play (the solver's acts but the decision); each mal-rule played out; the end
        let midBox = null;
        // (judging round 2: the signs a pick makes at chance weight, no longer mapped, still play out: draw's join to A, find's
        // first-letter arc; and a solve after a miss, whose end tick is pale)
        const signs = level.params.goal === "draw" ? ["join-wrong-end"] : level.params.goal === "find" ? ["vertex-name"] : [];
        // centre-on-arm (Learning's split, mapped by the rule with integration 49): played here with the mapping it will carry
        if ((level.params.goal === "measure" || level.params.goal === "draw") && !level.mal["centre-on-arm"]) level = { ...level, mal: { ...level.mal, "centre-on-arm": "c6-maths-ch02-t03-m-centre-on-arm" } };
        const plays = [["first", []], ["mid", sol.slice(0, -1)], ...[...Object.keys(level.mal), ...signs].map((m) => [`mal-${m}`, logic.malActs(level, m)]).filter(([, a]) => a),
          ...signs.map((m) => [`late-${m}`, [...(logic.malActs(level, m) ?? []), ...(level.params.goal === "find" ? sol : sol.slice(-2))]]).filter(([, a]) => a.length > sol.length),
          // size: every pick (a miss plays out both readings; the solved tick sits with the pick, or between the figures for "same")
          ...(level.params.goal === "size" ? ["a", "b", "same"].map((w) => [`pick-${w}`, [{ kind: "pick", which: w }]]) : []), ["end", sol]];
        // measure: the number typed on the pad, before "Yahi hai" (keys, not acts)
        const read = level.params.goal === "measure" ? sol[sol.length - 1] : null;
        if (read?.kind === "read") plays.splice(2, 0, ["typed", sol.slice(0, -1), String(read.n).split("").map((d) => `k${d}`)]);
        const drawn = [];   // the protractor's drawn size and the world box, screen by screen
        for (const [name, acts, keys = []] of plays) {
          await page.evaluate((j) => window.__forge3.show(j), { play: { level, art: "kagaz", lang: "hinglish", classLevel: 6, debug: true }, tray: { w: size.w, h: size.h }, id: `${level.levelId}-${name}` });
          await page.waitForFunction(() => !!window.__play?.dispatch && !!document.querySelector("canvas.pl-canvas"));
          // the scale numbers are laid out in Geist Mono (0.6 em): once the play chunk (and its @font-face) is on the page, the
          // face loads before the boards are measured, or the check says why not (CI 2026-11-11 measured 8 px a figure at 14 px)
          if (mono === null) {
            mono = await page.evaluate(async () => { try { const l = await document.fonts.load('700 14px "Geist Mono"'); return l.map((f) => f.status).join(",") || "no face"; } catch (e) { return `error ${e?.message ?? e}`; } });
            if (!/loaded/.test(mono)) faults.push(`${size.tag}: Geist Mono did not load (${mono})`);
            await page.waitForTimeout(100);
          }
          for (const a of acts) await page.evaluate((x) => window.__play.dispatch(x), a);
          for (const k of keys) await page.evaluate((id) => window.__play.press(id), k);
          await page.waitForTimeout(acts.length ? 1700 : 300);
          const probe = await page.evaluate(() => {
            const c = document.querySelector("canvas.pl-canvas").getBoundingClientRect(), a = window.__play.audit;
            return {
              nums: a.texts.filter((t) => /^\d{1,3}$/.test(t.s)).map((t) => ({ s: t.s, x: t.x, y: t.y, w: t.w, px: t.px })),
              letters: a.texts.filter((t) => /^[A-Z]$/.test(t.s)).map((t) => ({ s: t.s, x: t.x, y: t.y, w: t.w, px: t.px })),
              canvas: { w: c.width, h: c.height },
              texts: a.texts.map((t) => ({ s: t.s, w: t.w, h: t.px * 1.2, x0: t.align === "left" ? t.x : t.align === "right" ? t.x - t.w : t.x - t.w / 2, y0: t.y - t.px * 0.6 })),
              targets: a.targets, clipped: a.clipped, marks: a.marks, segs: a.segs, lang: "hinglish",
              aria: [...document.querySelectorAll("[data-testid=play-controls] button")].map((b) => b.getAttribute("aria-label") ?? ""),
              box: (({ x, y, width, height }) => ({ x, y, w: width, h: height }))(document.querySelector("canvas.pl-canvas").getBoundingClientRect()),
              ctl: [...document.querySelectorAll("[data-testid=play-controls] button")].map((b) => { const q = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 20), x: q.x, y: q.y, w: q.width, h: q.height }; }).filter((q) => q.w > 0),
            };
          });
          screens++;
          // (centre-on-arm: her protractor centred on A runs past the board's edge, so its own scale numbers there are cut, and its 0 sits by O under the ring: her
          // placement, not the layout; every other fault still counts)
          for (const f of screenFaults(probe)) if (!(name === "mal-centre-on-arm" && /^(cut|ring×text) "\d+"$/.test(f))) faults.push(`${size.tag} ${level.levelId} ${name}: ${f}`);
          // the vertex-off ring is a consequence of a committed decision: never on the first screen or before the decision
          if ((name === "first" || name === "mid") && probe.marks.some((m) => m.kind === "ring")) faults.push(`${size.tag} ${level.levelId} ${name}: centre ring before a decision`);
          // the board does not move when the game is solved (the controls keep their rows)
          if (name === "mid") midBox = probe.box;
          if (name === "end" && midBox && ["x", "y", "w", "h"].some((k) => Math.abs(midBox[k] - probe.box[k]) > 0.5)) faults.push(`${size.tag} ${level.levelId}: the board moved on solving (${JSON.stringify(midBox)} → ${JSON.stringify(probe.box)})`);
          // the hold of 2026-11-11: the scale numbers as the browser drew and measured them keep SCALE_GAP px apart (outer,
          // inner, outer against inner), and the headless width model (Geist Mono's 0.6 em) is the browser's
          if (level.mode === "place") {
            for (const [a, b, g] of numberClashes(probe.nums.map((t) => ({ ...t, h: t.px * INK_H })))) faults.push(`${size.tag} ${level.levelId} ${name}: numbers "${a}" and "${b}" ${g} px apart`);
            // nor does a letter stand against a number (the resting protractor's 80 beside O read as "80O")
            const box = (t) => ({ s: t.s, x: t.x, y: t.y, w: t.w, h: t.px * INK_H });
            for (const l of probe.letters) for (const n of probe.nums) { const g = roomBetween(box(l), box(n)); if (g < SCALE_GAP - 0.01) faults.push(`${size.tag} ${level.levelId} ${name}: letter "${l.s}" and number "${n.s}" ${g.toFixed(2)} px apart`); }
            for (const t of probe.nums) if (Math.abs(t.w - monoMeasure(t.s, t.px)) > 0.6) faults.push(`${size.tag} ${level.levelId} ${name}: "${t.s}" measured ${t.w.toFixed(2)} px, the headless model ${monoMeasure(t.s, t.px).toFixed(2)}`);
            // the world box is the one the headless check lays the numbers out in
            const want = WORLD[size.tag][level.params.goal];
            if (Math.abs(want.w - probe.canvas.w) > 0.5 || Math.abs(want.h - probe.canvas.h) > 0.5) faults.push(`${size.tag} ${level.levelId} ${name}: world box ${probe.canvas.w}x${probe.canvas.h}, WORLD says ${want.w}x${want.h}`);
            drawn.push({ name, box: probe.box, prot: probe.marks.filter((m) => m.kind === "protractor").map((m) => `${m.w.toFixed(1)}x${m.h.toFixed(1)}`).join(" ") });
          }
          if (process.env.KON_SHOTS) { mkdirSync(process.env.KON_SHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.KON_SHOTS, `${level.mode}-${level.goal}-${size.tag}-${level.levelId.replace(/[^a-z0-9]/gi, "_")}-${name}.png`) }); }
        }
        // the hold of 2026-11-11: the protractor keeps its drawn size (and the board its box) on every screen of the level:
        // the first screen, placed and locked, typed, each miss played out, the end
        if (level.mode === "place") {
          const want = ["first", "mid", "end", ...(read ? ["typed"] : [])];
          for (const n of want) if (!drawn.some((d) => d.name === n)) faults.push(`${size.tag} ${level.levelId}: no ${n} screen measured`);
          if (!drawn.some((d) => d.name.startsWith("mal-") || d.name.startsWith("pick-"))) faults.push(`${size.tag} ${level.levelId}: no miss screen measured`);
          const sizes = new Set(drawn.map((d) => d.prot)), boxes = new Set(drawn.map((d) => `${d.box.x.toFixed(1)},${d.box.y.toFixed(1)},${d.box.w.toFixed(1)}x${d.box.h.toFixed(1)}`));
          if (sizes.size !== 1 || [...sizes][0] === "") faults.push(`${size.tag} ${level.levelId}: the protractor's drawn size changes: ${drawn.map((d) => `${d.name} ${d.prot}`).join(" · ")}`);
          if (boxes.size !== 1) faults.push(`${size.tag} ${level.levelId}: the board's box changes: ${[...boxes].join(" · ")}`);
          if (process.env.KON_SIZES) console.log(`${size.tag} ${level.levelId} protractor ${[...sizes].join(" | ")} box ${[...boxes].join(" | ")}`);
        }
      }
      assert.deepEqual(errors, [], `page errors at ${size.tag}`);
      await ctx.close();
    }
    assert.ok(screens >= 24, `${screens} screens`);
    assert.deepEqual(faults, [], faults.join("\n"));
  });
});

it("screenFaults: each refusal on a synthetic screen", () => {
  const T = (s, x0, y0, w = 30, h = 17) => ({ s, x0, y0, w, h });
  const base = { canvas: { w: 360, h: 350 }, texts: [], targets: [], clipped: 0, ctl: [] };
  assert.deepEqual(screenFaults({ ...base, texts: [T("90", 10, 10), T("60", 100, 10)] }), []);
  assert.equal(screenFaults({ ...base, texts: [T("90", 10, 10), T("60", 20, 12)] }).length, 1);
  assert.equal(screenFaults({ ...base, texts: [T("180", 345, 10)] })[0], 'cut "180"');
  assert.equal(screenFaults({ ...base, targets: [{ id: "turn", x: 0, y: 0, w: 48, h: 48 }] })[0], "small target turn 48x48");
  assert.equal(screenFaults({ ...base, ctl: [{ t: "a", x: 0, y: 0, w: 100, h: 50 }, { t: "b", x: 50, y: 10, w: 100, h: 50 }] })[0], 'control×control "a" / "b"');
});

it("screenFaults: the marks refusals (tick over a letter, chip across an arm, chip over a point, English aria, discs)", () => {
  const base = { canvas: { w: 360, h: 350 }, texts: [], targets: [], clipped: 0, ctl: [], marks: [], segs: [], lang: "hinglish" };
  const B = { s: "B", x0: 20, y0: 20, w: 12, h: 19 };
  assert.equal(screenFaults({ ...base, texts: [B], marks: [{ kind: "tick", x: 25, y: 25, w: 20, h: 16 }] })[0], 'tick×text "B"');
  assert.deepEqual(screenFaults({ ...base, texts: [B], marks: [{ kind: "tick", x: 60, y: 25, w: 20, h: 16 }] }), []);
  assert.match(screenFaults({ ...base, marks: [{ kind: "chip", x: 100, y: 100, w: 80, h: 27 }], segs: [{ kind: "arm", x0: 90, y0: 90, x1: 200, y1: 140 }] })[0], /^chip×arm/);
  assert.equal(screenFaults({ ...base, marks: [{ kind: "chip", x: 100, y: 100, w: 80, h: 27 }, { kind: "dot", x: 110, y: 105, w: 16, h: 16 }] })[0], "chip×point");
  assert.equal(screenFaults({ ...base, aria: ["one less"] })[0], 'English aria "one less"');
  assert.deepEqual(screenFaults({ ...base, targets: [{ id: "arc-0", x: 0, y: 0, w: 48, h: 48 }, { id: "arc-1", x: 40, y: 40, w: 48, h: 48 }] }), []);   // discs 56 apart
  assert.equal(screenFaults({ ...base, targets: [{ id: "pt-0", x: 0, y: 0, w: 48, h: 48 }, { id: "pt-1", x: 40, y: 40, w: 48, h: 48 }] })[0], "target×target pt-0 / pt-1");
});
