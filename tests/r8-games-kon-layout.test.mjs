// r8 Games: the LAYOUT check for kon's round-8 boards (the same kind of check as tests/studio-v2-layout.test.mjs, for play
// views): each served level of kon/place (and kon/name once it lands) is mounted in the real PlayStage (the forge3 harness's
// play mode) at 360 × 640 and 1366 × 768, and played through its screens with the law's own acts: the first screen, mid-play,
// every mapped mal-rule played out, and the end. On every screen it refuses: two canvas texts overlapping (≥ 20 % of the
// smaller one, the visual QA's Q3 share), a text cut by the canvas edge, a label the painter had to clip, two controls
// overlapping, a control under 44 px, and a touch target under 64 px (classes 6-9). KON_SHOTS=<dir> also writes a PNG of
// every screen. Runs in `npm test` when Chromium is installed; FORGE3_BROWSER=0 skips it.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const haveChromium = existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.FORGE3_BROWSER === "0" ? "FORGE3_BROWSER=0" : !haveChromium ? "no Chromium" : false;
const SIZES = [{ tag: "360x640", w: 360, h: 640 }, { tag: "1366x768", w: 1366, h: 768 }];
export const KEYS = ["kon/place", "kon/name"];

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
  for (const t of probe.targets) if (t.w < minTarget - 0.5 || t.h < minTarget - 0.5) out.push(`small target ${t.id} ${Math.round(t.w)}x${Math.round(t.h)}`);
  return out;
}

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
      for (const level of levels) {
        const logic = LOGIC[`${level.family}/${level.mode}`], sol = logic.solve(level);
        // the screens: first; mid-play (the solver's acts but the decision); each mal-rule played out; the end
        const plays = [["first", []], ["mid", sol.slice(0, -1)], ...Object.keys(level.mal).map((m) => [`mal-${m}`, logic.malActs(level, m)]).filter(([, a]) => a), ["end", sol]];
        for (const [name, acts] of plays) {
          await page.evaluate((j) => window.__forge3.show(j), { play: { level, art: "kagaz", lang: "hinglish", classLevel: 6, debug: true }, tray: { w: size.w, h: size.h }, id: `${level.levelId}-${name}` });
          await page.waitForFunction(() => !!window.__play?.dispatch && !!document.querySelector("canvas.pl-canvas"));
          for (const a of acts) await page.evaluate((x) => window.__play.dispatch(x), a);
          await page.waitForTimeout(acts.length ? 1700 : 300);
          const probe = await page.evaluate(() => {
            const c = document.querySelector("canvas.pl-canvas").getBoundingClientRect(), a = window.__play.audit;
            return {
              canvas: { w: c.width, h: c.height },
              texts: a.texts.map((t) => ({ s: t.s, w: t.w, h: t.px * 1.2, x0: t.align === "left" ? t.x : t.align === "right" ? t.x - t.w : t.x - t.w / 2, y0: t.y - t.px * 0.6 })),
              targets: a.targets, clipped: a.clipped,
              ctl: [...document.querySelectorAll("[data-testid=play-controls] button")].map((b) => { const q = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 20), x: q.x, y: q.y, w: q.width, h: q.height }; }).filter((q) => q.w > 0),
            };
          });
          screens++;
          for (const f of screenFaults(probe)) faults.push(`${size.tag} ${level.levelId} ${name}: ${f}`);
          if (process.env.KON_SHOTS) { mkdirSync(process.env.KON_SHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.KON_SHOTS, `${level.mode}-${level.goal}-${size.tag}-${level.levelId.replace(/[^a-z0-9]/gi, "_")}-${name}.png`) }); }
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
