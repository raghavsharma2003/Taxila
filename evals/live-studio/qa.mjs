// Live Studio probe QA gate: headless Chromium, production-like sandbox (meta CSP, every request recorded and
// refused), 360x640, REAL pointer clicks at element centres, checks against host truth in code. Strict: a build
// passes only if EVERY hard check passes (rj-mean-check-pass-as-quality). Perf runs under 4x CPU throttle.
import { KINDS, wrap } from "./kinds.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boxes(page, sel) {
  return page.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return { x: r.x, y: r.y, w: r.width, h: r.height, vis: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05,
      attrs: Object.fromEntries([...e.attributes].filter((a) => a.name.startsWith("data-")).map((a) => [a.name, a.value])) }; }));
}
const centre = (b) => [b.x + b.w / 2, b.y + b.h / 2];
async function tap(page, sel, idx = 0) {
  const bs = (await boxes(page, sel)).filter((b) => b.vis);
  if (!bs[idx]) return false;
  const [x, y] = centre(bs[idx]); await page.mouse.click(x, y); await sleep(120); return true;
}
const hostLog = (page) => page.evaluate(() => window.__host.log.slice());

/** Visible text strings (HTML text nodes + SVG text), for the words-only-from-the-table check. */
async function visibleTexts(page) {
  return page.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      const s = n.nodeValue.trim(); if (!s) continue; const p = n.parentElement; if (!p || /^(SCRIPT|STYLE)$/.test(p.tagName)) continue;
      const cs = getComputedStyle(p); const r = p.getBoundingClientRect();
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05 || r.width === 0) continue;
      out.push(s);
    }
    return out;
  });
}
function strayWords(texts, strings) {
  const vals = Object.values(strings).sort((a, b) => b.length - a.length);
  const stray = [];
  for (const t of texts) {
    let r = t; for (const v of vals) r = r.split(v).join(" ");
    if (/\p{L}{2,}/u.test(r.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ""))) stray.push(t.slice(0, 60));
  }
  return stray;
}

async function common(page, kindId, checks) {
  const k = KINDS[kindId];
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  checks.push({ id: "no_hscroll", pass: overflow <= 1, detail: overflow });
  const texts = await visibleTexts(page);
  const stray = strayWords(texts, k.strings);
  checks.push({ id: "words_from_table", pass: stray.length === 0, detail: stray.slice(0, 4) });
  const taps = (await boxes(page, "[data-action],[data-part],[data-option],[data-bar]")).filter((b) => b.vis);
  const small = taps.filter((b) => Math.min(b.w, b.h) < 40);
  const out = taps.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > 361 || b.y + b.h > 641);
  checks.push({ id: "targets_ge_40px", pass: small.length === 0, detail: small.slice(0, 3).map((b) => [Math.round(b.w), Math.round(b.h), JSON.stringify(b.attrs)]) });
  checks.push({ id: "targets_in_viewport", pass: out.length === 0, detail: out.slice(0, 3).map((b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)]) });
}

async function qaFraction(page, checks) {
  const items = KINDS.fraction_game.params.items;
  const parts0 = (await boxes(page, "[data-part]")).filter((b) => b.vis);
  checks.push({ id: "starts_unshaded", pass: parts0.length > 0 && parts0.every((b) => b.attrs["data-shaded"] !== "true"), detail: parts0.filter((b) => b.attrs["data-shaded"] === "true").length });
  let ok = true; const detail = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const parts = (await boxes(page, "[data-part]")).filter((b) => b.vis);
    if (parts.length !== it.d) { ok = false; detail.push(`item${i}: ${parts.length} parts, want ${it.d}`); break; }
    // wrong path first: shade n+1 (or n-1 when n = d), check, expect wrong + no advance
    const wrongN = it.n < it.d ? it.n + 1 : it.n - 1;
    for (let p = 0; p < wrongN; p++) await tap(page, "[data-part]", p);
    const shadedW = (await boxes(page, "[data-part]")).filter((b) => b.vis && b.attrs["data-shaded"] === "true").length;
    if (shadedW !== wrongN) { ok = false; detail.push(`item${i}: tapped ${wrongN}, shaded ${shadedW}`); break; }
    await tap(page, "[data-action=check]"); await sleep(500);
    let log = await hostLog(page); let last = log.filter((e) => e.type === "answer").pop();
    if (!last || last.correct !== false || last.value?.n !== wrongN || last.value?.d !== it.d) { ok = false; detail.push(`item${i}: wrong answer posted as ${JSON.stringify(last?.value)}`); break; }
    const stillParts = (await boxes(page, "[data-part]")).filter((b) => b.vis).length;
    if (stillParts !== it.d) { ok = false; detail.push(`item${i}: advanced on wrong`); break; }
    // fix: toggle one part (un-shade the last if over, shade next if under)
    if (wrongN > it.n) {
      const cur = (await boxes(page, "[data-part]")).filter((b) => b.vis);
      const idx = cur.findIndex((b) => b.attrs["data-part"] === String(wrongN - 1)); await tap(page, "[data-part]", idx >= 0 ? idx : wrongN - 1);
    } else await tap(page, "[data-part]", wrongN);
    const shadedR = (await boxes(page, "[data-part]")).filter((b) => b.vis && b.attrs["data-shaded"] === "true").length;
    if (shadedR !== it.n) { ok = false; detail.push(`item${i}: toggle broken (${shadedR} shaded, want ${it.n})`); break; }
    await tap(page, "[data-action=check]"); await sleep(1800);
    log = await hostLog(page); last = log.filter((e) => e.type === "answer").pop();
    if (!last || last.correct !== true) { ok = false; detail.push(`item${i}: right answer posted as ${JSON.stringify(last?.value)}`); break; }
  }
  checks.push({ id: "play_all_items_truth", pass: ok, detail });
  const log = await hostLog(page);
  checks.push({ id: "done_called", pass: log.some((e) => e.type === "done"), detail: "" });
}

async function qaPhoto(page, checks) {
  const S = KINDS.photosynthesis_anim.strings;
  const labels = (await boxes(page, "[data-label]")).filter((b) => b.vis);
  const need = ["sun", "leaf", "roots", "water", "co2", "o2", "glucose"];
  const have = new Set(labels.map((b) => b.attrs["data-label"]));
  const missing = need.filter((k) => !have.has(k));
  checks.push({ id: "labels_present", pass: missing.length === 0, detail: missing });
  const texts = await visibleTexts(page);
  const missingText = need.filter((k) => !texts.some((t) => t.includes(S[k])));
  checks.push({ id: "label_text_from_table", pass: missingText.length === 0, detail: missingText });
  let overlaps = [];
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i], b = labels[j];
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    if (ix * iy > 0.15 * Math.min(a.w * a.h, b.w * b.h)) overlaps.push(`${a.attrs["data-label"]}~${b.attrs["data-label"]}`);
  }
  const outside = labels.filter((b) => b.x < 0 || b.x + b.w > 361).map((b) => b.attrs["data-label"]);
  checks.push({ id: "labels_no_overlap_in_view", pass: overlaps.length === 0 && outside.length === 0, detail: [...overlaps, ...outside.map((o) => "out:" + o)] });
  // semantic motion: centroid of each flow's particles relative to the leaf, over 700 ms while playing
  const snap = () => page.evaluate(() => {
    const c = (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
    const leaf = document.querySelector("[data-entity=leaf]"); const L = leaf ? c(leaf) : null;
    const f = {}; for (const k of ["water", "co2", "o2"]) f[k] = [...document.querySelectorAll(`[data-flow=${k}]`)].map(c);
    return { L, f };
  });
  const s1 = await snap(); await sleep(350); const s2 = await snap();
  const motion = { ok: true, why: [] };
  if (!s1.L) { motion.ok = false; motion.why.push("no leaf"); }
  for (const k of ["water", "co2", "o2"]) {
    const a = s1.f[k], b = s2.f[k];
    if (a.length < 3 || b.length !== a.length) { motion.ok = false; motion.why.push(`${k}: ${a.length} particles`); continue; }
    const dy = [], dd = [];
    for (let i = 0; i < a.length; i++) {
      const step = Math.hypot(b[i][0] - a[i][0], b[i][1] - a[i][1]); if (step > 80 || step < 0.5) continue; // respawn or idle
      dy.push(b[i][1] - a[i][1]);
      if (s1.L) dd.push(Math.hypot(b[i][0] - s1.L[0], b[i][1] - s1.L[1]) - Math.hypot(a[i][0] - s1.L[0], a[i][1] - s1.L[1]));
    }
    const med = (x) => (x.length ? x.slice().sort((p, q) => p - q)[x.length >> 1] : NaN);
    if (dy.length < 2) { motion.ok = false; motion.why.push(`${k}: not moving`); continue; }
    if (k === "water" && !(med(dy) < 0)) { motion.ok = false; motion.why.push(`water not moving up (dy ${med(dy).toFixed(1)})`); }
    if (k === "co2" && !(med(dd) < 0)) { motion.ok = false; motion.why.push(`co2 not moving into leaf (dd ${med(dd).toFixed(1)})`); }
    if (k === "o2" && !(med(dd) > 0)) { motion.ok = false; motion.why.push(`o2 not moving out of leaf (dd ${med(dd).toFixed(1)})`); }
  }
  checks.push({ id: "science_direction_of_flows", pass: motion.ok, detail: motion.why });
  // pause freezes
  await tap(page, "[data-action=play]"); await sleep(300);
  const p1 = await snap(); await sleep(400); const p2 = await snap();
  const moved = ["water", "co2", "o2"].some((k) => p1.f[k].some((pt, i) => p2.f[k][i] && Math.hypot(p2.f[k][i][0] - pt[0], p2.f[k][i][1] - pt[1]) > 1));
  checks.push({ id: "pause_freezes", pass: !moved, detail: moved ? "particles still moving after pause" : "" });
  await tap(page, "[data-action=play]");
  // steps update the caption to the table text
  let stepOk = true; const stepWhy = [];
  for (const s of [3, 5]) {
    if (!(await tap(page, `[data-action=step-${s}]`))) { stepOk = false; stepWhy.push(`no step-${s}`); continue; }
    await sleep(250);
    const cap = await page.$eval("[data-caption]", (e) => e.textContent.trim()).catch(() => "");
    if (!cap.includes(S[`step${s}`])) { stepOk = false; stepWhy.push(`step-${s} caption "${cap.slice(0, 40)}"`); }
  }
  checks.push({ id: "steps_drive_caption", pass: stepOk, detail: stepWhy });
  // the check question: wrong then right
  let qOk = true; const qWhy = [];
  if (!(await tap(page, "[data-option=co2]"))) { qOk = false; qWhy.push("no option co2 visible"); }
  else {
    await sleep(500); let last = (await hostLog(page)).filter((e) => e.type === "answer").pop();
    if (!last || last.value !== "co2" || last.correct !== false) { qOk = false; qWhy.push(`co2 posted ${JSON.stringify(last?.value)}`); }
    if (process.env.STUDIO_BRIEF_V2) await sleep(700);
    await tap(page, "[data-option=o2]"); await sleep(800); last = (await hostLog(page)).filter((e) => e.type === "answer").pop();
    if (!last || last.value !== "o2" || last.correct !== true) { qOk = false; qWhy.push(`o2 posted ${JSON.stringify(last?.value)}`); }
  }
  checks.push({ id: "check_question_truth", pass: qOk, detail: qWhy });
  checks.push({ id: "done_called", pass: (await hostLog(page)).some((e) => e.type === "done"), detail: "" });
}

async function qaBars(page, checks) {
  const data = KINDS.bar_chart_viz.params.data;
  await sleep(1500); // let grow-in animations finish
  const bars = (await boxes(page, "[data-bar]")).filter((b) => b.vis);
  const byKey = Object.fromEntries(bars.map((b) => [b.attrs["data-bar"], b]));
  const missing = data.filter((d) => !byKey[d.key]).map((d) => d.key);
  checks.push({ id: "all_bars_present", pass: missing.length === 0 && bars.length === data.length, detail: { missing, n: bars.length } });
  if (missing.length) return;
  const ratios = data.map((d) => byKey[d.key].h / d.value); const r0 = ratios.reduce((a, b) => a + b) / ratios.length;
  const maxErrPx = Math.max(...data.map((d) => Math.abs(byKey[d.key].h - r0 * d.value)));
  checks.push({ id: "heights_proportional", pass: maxErrPx <= 1.5, detail: `max err ${maxErrPx.toFixed(2)} px` });
  const bottoms = data.map((d) => byKey[d.key].y + byKey[d.key].h);
  checks.push({ id: "common_baseline", pass: Math.max(...bottoms) - Math.min(...bottoms) <= 1.5, detail: bottoms.map((b) => b.toFixed(1)) });
  const ticks = (await boxes(page, "[data-tick]")).filter((b) => b.vis);
  const base = Math.max(...bottoms);
  const tickErr = ticks.map((t) => { const v = +t.attrs["data-tick"]; const cy = t.y + t.h / 2; return Math.abs(cy - (base - r0 * v)); });
  const worst = tickErr.length ? Math.max(...tickErr) : Infinity;
  checks.push({ id: "axis_ticks_tell_truth", pass: ticks.length >= 3 && worst <= 6, detail: `${ticks.length} ticks, worst ${worst.toFixed(1)} px` });
  const fills = await page.$$eval("[data-bar]", (els) => els.map((e) => getComputedStyle(e).fill + "|" + getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).opacity));
  checks.push({ id: "no_answer_hint_before_tap", pass: new Set(fills).size === 1, detail: [...new Set(fills)].slice(0, 3) });
  // wrong then right with real taps
  const keys = bars.map((b) => b.attrs["data-bar"]);
  const top = data.reduce((a, b) => (b.value > a.value ? b : a)).key;
  await tap(page, "[data-bar]", keys.indexOf("guava")); await sleep(500);
  let last = (await hostLog(page)).filter((e) => e.type === "answer").pop();
  const wrongOk = last && last.value === "guava" && last.correct === false;
  await tap(page, "[data-bar]", keys.indexOf(top)); await sleep(800);
  last = (await hostLog(page)).filter((e) => e.type === "answer").pop();
  checks.push({ id: "tap_answer_truth", pass: wrongOk && last?.value === top && last?.correct === true, detail: last?.value });
  checks.push({ id: "done_called", pass: (await hostLog(page)).some((e) => e.type === "done"), detail: "" });
}

const PLAY = { fraction_game: qaFraction, photosynthesis_anim: qaPhoto, bar_chart_viz: qaBars };

/** Run the full gate on one fragment. → { pass, checks, ms, firstReadyMs, perf } */
export async function runQA(browser, kindId, fragment, { shot } = {}) {
  const t0 = performance.now();
  const checks = [];
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const consoleErr = [], pageErr = [], requests = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErr.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => pageErr.push(String(e.message).slice(0, 160)));
  await page.route("**/*", (r) => { requests.push(r.request().url().slice(0, 100)); r.abort(); });
  const bytes = Buffer.byteLength(fragment);
  checks.push({ id: "size_le_60kb", pass: bytes <= 60_000, detail: bytes });
  checks.push({ id: "no_url_in_source", pass: !/https?:\/\//i.test(fragment.replace(/http:\/\/www\.w3\.org\/[^"']*/g, "")), detail: (fragment.match(/https?:\/\/[^\s"')]+/gi) || []).filter((u) => !u.includes("w3.org")).slice(0, 3) });
  checks.push({ id: "no_eval_storage", pass: !/\beval\s*\(|new\s+Function|localStorage|sessionStorage|indexedDB|\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(fragment), detail: "" });
  let firstReadyMs = null, perf = null;
  try {
    const cdp = await ctx.newCDPSession(page);
    await page.setContent(wrap(kindId, fragment), { waitUntil: "load", timeout: 10_000 });
    const tr = performance.now();
    await page.waitForFunction(() => window.__host && window.__host.ready, null, { timeout: 5000 }).catch(() => {});
    const ready = await page.evaluate(() => window.__host?.ready);
    firstReadyMs = ready ? Math.round(performance.now() - tr) : null;
    checks.push({ id: "boot_ready_le_5s", pass: !!ready, detail: firstReadyMs });
    const badKeys = (await hostLog(page)).filter((e) => e.type === "bad_key").map((e) => e.key);
    if (shot) await page.screenshot({ path: shot + "-first.png" });
    await common(page, kindId, checks);
    // perf: rAF intervals over 1.5 s at 4x CPU throttle
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    perf = await page.evaluate(() => new Promise((res) => { const ts = []; const lt = []; let po;
      try { po = new PerformanceObserver((l) => l.getEntries().forEach((e) => lt.push(e.duration))); po.observe({ entryTypes: ["longtask"] }); } catch {}
      const t0 = performance.now(); const f = (t) => { ts.push(t); if (t - t0 < 1500) requestAnimationFrame(f); else { po?.disconnect(); const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res({ p95: Math.round(d[Math.floor(d.length * 0.95)] || 0), frames: d.length, longTasks: lt.length }); } }; requestAnimationFrame(f); }));
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    checks.push({ id: "perf_p95_frame_le_50ms_4x", pass: perf.p95 <= 50, detail: perf });
    await PLAY[kindId](page, checks);
    const bad2 = (await hostLog(page)).filter((e) => e.type === "bad_key" || e.type === "cb_threw").map((e) => e.key || e.message);
    checks.push({ id: "only_table_keys", pass: badKeys.length + bad2.length === 0, detail: [...new Set([...badKeys, ...bad2])].slice(0, 4) });
    if (shot) await page.screenshot({ path: shot + "-end.png" });
  } catch (e) {
    checks.push({ id: "harness_completed", pass: false, detail: String(e.message).slice(0, 200) });
  }
  checks.push({ id: "no_console_errors", pass: consoleErr.length === 0 && pageErr.length === 0, detail: [...pageErr, ...consoleErr].slice(0, 3) });
  checks.push({ id: "no_network", pass: requests.length === 0, detail: requests.slice(0, 3) });
  await ctx.close();
  return { pass: checks.every((c) => c.pass), checks, ms: Math.round(performance.now() - t0), firstReadyMs, perf };
}

/**
 * Streaming first paint: replay prefixes of the stream (every 500 ms of wall time) and find the first prefix whose
 * render covers >= 15% of the viewport with visible boxes. → ms since request start, or null.
 */
export async function streamFirstPaint(browser, kindId, text, chunks, unfence) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await ctx.newPage(); await page.route("**/*", (r) => r.abort());
  let found = null;
  try {
    const tEnd = chunks.at(-1)?.t || 0;
    for (let t = chunks[0]?.t || 0; t <= tEnd; t += 500) {
      const n = chunks.filter((c) => c.t <= t).at(-1)?.n || 0;
      let pre = unfence(text.slice(0, n));
      const si = pre.lastIndexOf("<script"); if (si >= 0 && pre.indexOf("</script>", si) < 0) pre = pre.slice(0, si); // a half-written script is held back
      await page.setContent(wrap(kindId, pre), { waitUntil: "load", timeout: 5000 }).catch(() => {});
      const cover = await page.evaluate(() => {
        let a = 0; for (const e of document.body.querySelectorAll("*")) { if (e.children.length && e.tagName !== "svg" && e.tagName !== "g") continue;
          const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none") continue;
          a += Math.max(0, Math.min(r.right, 360) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, 640) - Math.max(r.top, 0)); }
        return a / (360 * 640);
      }).catch(() => 0);
      if (cover >= 0.15) { found = t; break; }
    }
  } finally { await ctx.close(); }
  return found;
}
