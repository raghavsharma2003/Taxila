// The Studio gate (LIVE-STUDIO §3.6, S2): every check is code, and a build ships only if EVERY hard check passes
// (rj-mean-check-pass-as-quality). Ported from the probe gate (evals/live-studio/qa.mjs) and made archetype-driven:
//
//   G0 static (AST)          size, URL, loading tags, inline handlers, banned APIs, table keys, literal answers
//   G1 boot                  Studio.ready() ≤ 5 s; 0 console / page errors; 0 CSP violations; 0 network; a CSP probe refused
//   G2 seam                  the archetype's data attributes present and live
//   G3 words                 visible text ⊆ strings table ∪ numerals; Studio.t only with table keys
//   G4 layout                nothing outside the design box (no scroll either way); targets ≥ the band's minimum at the
//                            phone-tray scale and inside the box; labels not overlapping; labels anchored to their referent
//   G5 play-truth            real pointer taps: a wrong path (graded wrong, no advance), then the right path, to done
//   G6 semantics             per archetype (part areas, bar heights and ticks, flow directions, tick spacing, tilt ...)
//   G7 state graph           the host-observed path is a path of the archetype's FSM (ready once, done once, last)
//   G8 no-hint               candidate answers carry identical styles before the child acts
//   G9 perf                  4x CPU throttle: rAF p95 ≤ 50 ms, ≤ 2 long tasks
//   G10 determinism          by construction: the runtime seeds Math.random per session (page.js)
//
// runGate(browser, job) → { pass, checks, ms, readyMs, perf, fixes, log }. The browser is the caller's (a shared
// Chromium in the studio-qa sandbox, or a local one for the bench and tests); each gate gets its own context.
import { archetype, validateParams, stringKeys, buildParams, minTarget } from "../archetypes/index.js";
import { fixFragment, splitFragment } from "../fixers.js";
import { staticChecks } from "./static.js";
import { runtimeSource, gateDocument, HOST_BINDING } from "./page.js";
import { graderFor } from "./graders.js";
import { PLAYERS } from "./players/index.js";
import { boxes, visible, tap, visibleTexts, strayWords, overflow, sleep, styleSignatures, targetReach } from "./common.js";

export const GATE_VERSION = "studio-gate@1";

/** The hard-check ids each G family maps to (for reports and the router bench's failure table). */
export const family = (id) => id.split(".")[0];

/**
 * Run the full gate on one build.
 * @param {import("playwright").Browser} browser
 * @param {{ archetypeId: string, fragment: string, params: object, strings: Record<string,string>, band?: string,
 *   lang?: string, seed?: number, shot?: string, perf?: boolean, fixed?: boolean }} job
 */
export async function runGate(browser, job) {
  const t0 = performance.now();
  const a = archetype(job.archetypeId);
  const player = PLAYERS[a.player];
  const checks = [];
  const add = (id, pass, detail = "") => { checks.push({ id, pass: !!pass, detail }); return !!pass; };
  const band = job.band ?? "B3";
  const perr = validateParams(a, job.params);
  if (!add("params_valid", perr.length === 0, perr.slice(0, 4)) || !player) {
    if (!player) add("player_exists", false, a.player);
    return { pass: false, checks, ms: Math.round(performance.now() - t0), fixes: [], log: [] };
  }
  const keys = stringKeys(a, job.params);
  const missing = keys.filter((k) => typeof job.strings?.[k] !== "string" || !job.strings[k].trim());
  add("strings_complete", missing.length === 0, missing.slice(0, 4));
  const fx = job.fixed ? { html: job.fragment, fixes: [], scriptError: null } : fixFragment(job.fragment, { seam: player.seam });
  for (const c of staticChecks(fx.html, { keys, bytes: a.budgets?.bytes ?? 60_000 })) checks.push(c);
  if (fx.scriptError && fx.scriptError !== "no_script") add("G0.parses_after_fix", false, fx.scriptError);

  const stage = a.stage;
  const minT = minTarget(a, band);
  const bp = buildParams(a, job.params);
  const grade = graderFor(a, job.params);
  const log = [];
  const requests = [], consoleErr = [];
  const ctx = await browser.newContext({ viewport: { width: stage.w, height: stage.h }, deviceScaleFactor: 1, hasTouch: false, javaScriptEnabled: true });
  let readyMs = null, perf = null;
  try {
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") consoleErr.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => log.push({ type: "page_error", message: String(e.message).slice(0, 160), at: performance.now() }));
    await page.route("**/*", (r) => { requests.push(r.request().url().slice(0, 100)); r.abort(); });
    await page.exposeBinding(HOST_BINDING, (_src, msg) => {
      const at = performance.now();
      if (!msg || typeof msg !== "object") return null;
      if (msg.type === "answer") {
        const r = grade(msg.value);
        log.push({ type: "answer", value: msg.value, correct: r.correct, complete: r.complete, itemId: r.itemId, at });
        return { correct: r.correct };
      }
      log.push({ type: String(msg.type).slice(0, 16), ...(msg.key ? { key: msg.key } : {}), ...(msg.name ? { name: msg.name } : {}),
        ...(msg.message ? { message: msg.message } : {}), ...(msg.directive ? { directive: msg.directive } : {}), at });
      return null;
    });
    const runtime = runtimeSource({ params: bp, strings: job.strings, lang: job.lang ?? "hinglish", seed: job.seed ?? 1 });
    const { scripts } = splitFragment(fx.html);
    const doc = gateDocument({ fragment: fx.html, script: scripts[0] ?? null, runtime, stage });
    const tl = performance.now();
    await page.setContent(doc.html, { waitUntil: "load", timeout: 10_000 });
    await page.waitForFunction(() => true, null, { timeout: 100 }).catch(() => {});
    const deadline = tl + 5000;
    while (!log.some((e) => e.type === "ready") && performance.now() < deadline) await sleep(50);
    const ready = log.find((e) => e.type === "ready");
    readyMs = ready ? Math.round(ready.at - tl) : null;
    add("G1.ready_le_5s", !!ready, readyMs);
    // the CSP probe: from inside the page, a fetch and an image load must both be refused, and nothing reach the network
    const logAt = log.length, consoleAt = consoleErr.length, reqAt = requests.length;
    const probe = await page.evaluate(async () => {
      let fetched = "refused";
      try { await fetch("https://example.com/x"); fetched = "allowed"; } catch { /* refused */ }
      try { const i = document.createElement("img"); i.src = "https://example.com/p.png"; document.body.appendChild(i); i.remove(); } catch { /* refused */ }
      return fetched;
    }).catch(() => "refused");
    await sleep(150);
    add("G1.csp_probe_refused", probe === "refused" && requests.length === reqAt, { probe, requests: requests.length - reqAt });
    // the probe's own violations are expected: drop exactly those (the build's own stay counted)
    requests.length = reqAt;
    consoleErr.length = consoleAt;
    const kept = log.slice(logAt).filter((e) => !(e.type === "csp" && /connect-src|img-src/.test(e.directive ?? "")));
    log.splice(logAt, log.length - logAt, ...kept);
    if (job.shot) await page.screenshot({ path: `${job.shot}-first.png` });

    // G9 perf, idle animation, before play: rAF intervals over 1.5 s at 4x CPU throttle
    if (job.perf !== false) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      perf = await page.evaluate(() => new Promise((res) => { const ts = []; const lt = []; let po;
        try { po = new PerformanceObserver((l) => l.getEntries().forEach((e) => lt.push(e.duration))); po.observe({ entryTypes: ["longtask"] }); } catch {}
        const t0 = performance.now(); const f = (t) => { ts.push(t); if (t - t0 < 1500) requestAnimationFrame(f); else { po?.disconnect(); const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res({ p95: Math.round(d[Math.floor(d.length * 0.95)] || 0), frames: d.length, longTasks: lt.length }); } }; requestAnimationFrame(f); })).catch(() => null);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      add("G9.perf_p95_le_50ms_4x", !!perf && perf.p95 <= 50 && perf.longTasks <= 2, perf);
    }

    // G4 layout (first screen)
    const ov = await overflow(page, stage);
    add("G4.inside_design_box", ov.right <= 1 && ov.bottom <= 1 && ov.left <= 1 && ov.top <= 1 && ov.scrollX <= 1 && ov.scrollY <= 1, ov);
    const targets = await visible(page, player.targets);
    const small = targets.filter((b) => Math.min(b.w, b.h) < minT - 0.5);
    add("G4.targets_min", targets.length > 0 && small.length === 0, { min: minT, n: targets.length, small: small.slice(0, 3).map((b) => [Math.round(b.w), Math.round(b.h), JSON.stringify(b.attrs).slice(0, 60)]) });
    const out = targets.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > stage.w + 1 || b.y + b.h > stage.h + 1);
    add("G4.targets_inside", out.length === 0, out.slice(0, 3).map((b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)]));
    const reach = await targetReach(page, player.targets);
    add("G4.targets_reachable", reach.unreachable.length === 0, reach.unreachable.slice(0, 3));
    add("G4.targets_no_overlap", reach.overlapping.length === 0, reach.overlapping.slice(0, 3));
    // G3 words (first screen; the end screen is re-checked after play)
    const stray0 = strayWords(await visibleTexts(page), job.strings);

    // G2 / G5 / G6 / G8 by the archetype's player
    const pctx = {
      page, a, params: job.params, bp, strings: job.strings, band, minT, stage, add, log, sleep,
      boxes: (sel) => boxes(page, sel), visible: (sel) => visible(page, sel), styleSignatures: (sel) => styleSignatures(page, sel),
      tap: (sel, o) => tap(page, sel, o),
      answers: () => log.filter((e) => e.type === "answer"),
      lastAnswer: () => log.filter((e) => e.type === "answer").at(-1) ?? null,
      waitAnswer: async (n, ms = 1500) => { const t = performance.now(); while (log.filter((e) => e.type === "answer").length < n && performance.now() - t < ms) await sleep(40); return log.filter((e) => e.type === "answer").at(-1) ?? null; },
    };
    try { await player.play(pctx); } catch (e) { add("harness_completed", false, String(e?.message ?? e).slice(0, 200)); }
    await sleep(300);
    const stray = [...new Set([...stray0, ...strayWords(await visibleTexts(page), job.strings)])];
    add("G3.words_from_table", stray.length === 0, stray.slice(0, 4));
    const ov2 = await overflow(page, stage);
    add("G4.inside_after_play", ov2.right <= 1 && ov2.bottom <= 1 && ov2.left <= 1 && ov2.top <= 1 && ov2.scrollX <= 1 && ov2.scrollY <= 1, ov2);
    if (job.shot) await page.screenshot({ path: `${job.shot}-end.png` });
  } catch (e) {
    add("harness_completed", false, String(e?.message ?? e).slice(0, 200));
  } finally {
    await ctx.close().catch(() => {});
  }
  // G3 keys, G1 errors / CSP / network, G7 state graph (from the host log: the page cannot write it)
  const badKeys = log.filter((e) => e.type === "bad_key").map((e) => e.key);
  add("G3.table_keys_runtime", badKeys.length === 0, [...new Set(badKeys)].slice(0, 4));
  const pageErr = log.filter((e) => e.type === "page_error" || e.type === "cb_threw").map((e) => e.message);
  add("G1.no_errors", consoleErr.filter((m) => !/Content Security Policy/i.test(m)).length === 0 && pageErr.length === 0, [...pageErr, ...consoleErr].slice(0, 3));
  const csp = log.filter((e) => e.type === "csp").map((e) => e.directive);
  add("G1.no_csp_violations", csp.length === 0 && !consoleErr.some((m) => /Content Security Policy/i.test(m)), [...new Set(csp)].slice(0, 3));
  add("G1.no_network", requests.length === 0, requests.slice(0, 3));
  add("G7.state_graph", ...stateGraph(log));
  const pass = checks.every((c) => c.pass);
  return { pass, checks, ms: Math.round(performance.now() - t0), readyMs, perf, fixes: fx.fixes, html: fx.html, log: log.map(({ at, ...e }) => e) };
}

/**
 * G7 (EE-Eval style, from the host's own log): ready exactly once and before any answer; every answer after ready;
 * done exactly once, only after the grader reported complete, and nothing graded after done.
 * @returns {[boolean, unknown]}
 */
export function stateGraph(log) {
  const why = [];
  const idx = (t) => log.findIndex((e) => e.type === t);
  const ready = log.filter((e) => e.type === "ready").length;
  if (ready !== 1) why.push(`ready x${ready}`);
  const firstAns = idx("answer");
  if (firstAns >= 0 && idx("ready") > firstAns) why.push("answer before ready");
  const doneAt = idx("done");
  if (doneAt < 0) why.push("never done");
  if (log.some((e) => e.type === "done_again")) why.push("done twice");
  const completeAt = log.findIndex((e) => e.type === "answer" && e.complete && e.correct);
  if (doneAt >= 0 && (completeAt < 0 || completeAt > doneAt)) why.push("done before the last item was right");
  if (doneAt >= 0 && log.slice(doneAt + 1).some((e) => e.type === "answer" && e.correct)) why.push("graded after done");
  return [why.length === 0, why];
}
