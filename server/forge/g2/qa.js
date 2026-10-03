// The G2 QA gate (FACTORY.md §5.1, G2 column, in the form this kit supports). Code oracles only; nothing here asks a
// model whether the game is right. One call = one gate run over ONE bundle (the bytes that would ship):
//   Q0  levels   every LevelSpec item re-derived from the verified kit (levels.js truth) — done before this runs
//   Q1  static   lint.js allowlist + size budget (agent bytes, bundle bytes)
//   Q2  boot     production-parity host page (opaque-origin iframe, sandbox="allow-scripts", init + MessagePort),
//                ready ≤ 8 s, 0 console errors, 0 page errors, 0 CSP violations, 0 requests beyond the bundle
//                (route-recorded, dead proxy, resolver rules, WebRTC policy), and a CSP probe: fetch from inside the
//                frame must be refused (the network-free check runs on the shipped bytes, not on a promise)
//   Q3  binding  0 kit ForgeContract refusals / Agent.threw / Budget findings during play
//   Q4  play     scripted play to goal_met with REAL pointer clicks at target centres: one wrong path per level
//                (a distractor, or wrong units then clear), then the key; goal_met exactly once; determinism
//                (a second run with the same seed gives the same host-side event trace)
//   Q5  truth    every answer the HOST received is re-derived host-side (choice: the ref resolved against the
//                server's own LevelSpec; build: the unit counts replayed × the server's unit values) and re-graded
//                against the raw kit (data/kits, not the LevelSpec); frame `correct` must equal the re-grade, and the
//                misconception id must be the kit's
//   Q6  geometry targets on screen, ≥ the band's hit size in CSS px, font ≥ 14 px, no horizontal overflow
//   leak         pre-commit text (kit prompt + every agent-drawn word) never reveals the key (director revealsAnswer),
//                and the key's position in the option row is not constant across items, and the key is not DECORATED
//                differently from every distractor in the same way on every item (leak.key_styled: agent-drawn marks
//                nearest each option, position-free; with opaque refs this is defence in depth)
// Q8 (strings) runs in safety.js; Q7 perf and Q9 judged quality are NOT in this gate (open items in the inbox).
import { chromium } from "playwright-core";
import { lintMechanic } from "./lint.js";
import { SIZE_BUDGET } from "./bundle.js";
import { frameLevels, loadTopic } from "./levels.js";
import { revealsAnswer } from "../../director/items.js";
import { sameV, fold, kitTruth, regrade, rederive, solveUnits } from "./truth.js";
export { kitTruth, rederive, solveUnits };

export const QA_VERSION = "g2-qa@2";
const HOST = "http://forge-host.test/";
const PLAY = "http://forge-play.test/b/index.html";
const MODULE_ID = "g2m";

const HOST_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}iframe{display:block;width:100%;height:600px;border:0}</style></head><body>
<iframe id="f" sandbox="allow-scripts" referrerpolicy="no-referrer" src="${PLAY}#${MODULE_ID}"></iframe>
<script>
window.__hostEvents=[]; window.__pageReady=0; let port=null; const f=document.getElementById("f");
window.addEventListener("message",(e)=>{ if(e.source!==f.contentWindow) return; const d=e.data||{};
  if(port){ window.__hostEvents.push({type:"protocol_violation",at:performance.now()}); return; }
  if(d.type!=="ready"||d.moduleId!=="${MODULE_ID}") return; window.__pageReady++;
  const ch=new MessageChannel(); port=ch.port1; port.onmessage=(m)=>window.__hostEvents.push({...m.data, at:performance.now()});
  f.contentWindow.postMessage(window.__init,"*",[ch.port2]); });
window.__send=(m)=>port&&port.postMessage(m);
</script></body></html>`;

/** Static half of the gate (no browser). */
export function staticGate({ mechanicSrc, design, bundle }) {
  const gates = [];
  const lint = lintMechanic(mechanicSrc, { stringKeys: (design?.strings || []).map((s) => s.key) });
  gates.push({ id: "Q1.lint", status: lint.ok ? "pass" : "fail", detail: lint.errors.slice(0, 8).map((e) => `${e.code} ${e.detail} @${e.line}`).join("; ") });
  gates.push({ id: "Q1.size", status: bundle.agentBytes <= SIZE_BUDGET.agentBytes && bundle.bytes <= SIZE_BUDGET.bundleBytes ? "pass" : "fail",
    detail: `agent ${bundle.agentBytes} B (≤ ${SIZE_BUDGET.agentBytes}), bundle ${bundle.bytes} B (≤ ${SIZE_BUDGET.bundleBytes})` });
  return { gates, lint };
}

/** Chromium with its own sandbox when the host allows it (FACTORY.md §2.8 "sandbox attempted, fallback recorded"). */
export let browserInfo = { sandboxed: null, version: null };
export async function launchBrowser() {
  const want = process.env.FORGE_CHROMIUM_SANDBOX !== "0";
  try {
    const b = await launchWith(want);
    browserInfo = { sandboxed: want, version: b.version() };
    return b;
  } catch (e) {
    if (!want) throw e;
    const b = await launchWith(false);
    browserInfo = { sandboxed: false, version: b.version(), sandboxError: String(e.message).split("\n")[0].slice(0, 160) };
    return b;
  }
}
function launchWith(sandbox) {
  return chromium.launch({
    headless: true,
    chromiumSandbox: sandbox,
    args: ["--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>", "--host-resolver-rules=MAP * ~NOTFOUND",
      "--force-webrtc-ip-handling-policy=disable_non_proxied_udp", "--disable-background-networking", "--no-first-run", "--disable-sync"],
  });
}

/**
 * One scripted play of a bundle. → { events, external, consoleErrors, pageErrors, seamFindings, violations, checks, frames, ms }
 */
async function playOnce(browser, { html, levels, init, wrongPaths = true, capture = false, timeoutMs = 60_000 }) {
  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, serviceWorkers: "block", javaScriptEnabled: true });
  const external = [], consoleErrors = [], pageErrors = [], frames = {}, checks = [];
  const t0 = Date.now();
  await context.addInitScript(() => {
    if (location.hostname === "forge-play.test") Object.defineProperty(window, "__forgeSeamInstall", { value: (api) => { Object.defineProperty(window, "__forgeSeam", { value: api }); }, configurable: false, writable: false });
  });
  await context.route("**/*", (route) => {
    const u = route.request().url();
    if (u === HOST) return route.fulfill({ status: 200, contentType: "text/html", body: HOST_HTML });
    if (u.split("#")[0] === PLAY) return route.fulfill({ status: 200, contentType: "text/html", body: html });
    external.push(u.slice(0, 160));
    return route.abort();
  });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
  const deadline = Date.now() + timeoutMs;
  const left = () => Math.max(1, deadline - Date.now());
  try {
    await page.addInitScript((i) => { if (location.hostname === "forge-host.test") window.__init = i; }, init);
    await page.goto(HOST, { waitUntil: "load", timeout: left() });
    const frameHandle = await page.waitForSelector("#f", { timeout: left() });
    const frame = await frameHandle.contentFrame();
    await page.waitForFunction(() => window.__pageReady === 1, null, { timeout: Math.min(8000, left()) });
    checks.push({ id: "Q2.ready", status: "pass", detail: `${Date.now() - t0} ms` });
    await frame.waitForFunction(() => window.__forgeSeam && (window.__forgeSeam.targets().length > 0 || window.__forgeSeam.state().failed), null, { timeout: Math.min(8000, left()) });
    const seam = (fn, arg) => frame.evaluate(fn, arg);
    const box = await frameHandle.boundingBox();
    const answersSeen = () => page.evaluate(() => window.__hostEvents.filter((e) => e.type === "answer" || e.type === "error").length);
    const waitAnswer = (n) => page.waitForFunction((k) => window.__hostEvents.filter((e) => e.type === "answer" || e.type === "error").length > k, n, { timeout: Math.min(5000, left()) });
    const tap = async (t) => { await page.mouse.click(box.x + t.bbox.x + t.bbox.w / 2, box.y + t.bbox.y + t.bbox.h / 2); };
    const targets = () => seam(() => window.__forgeSeam.targets());
    const st = () => seam(() => window.__forgeSeam.state());
    const geometry = [];
    const textIssues = new Set();
    const keyPositions = [], keyMarks = [];
    let level = -1, guard = 0;
    if (capture) frames.intro = await page.screenshot({ type: "png" });
    while (guard++ < 40) {
      const s = await st();
      if (s.won || s.failed) break;
      const ts = await targets();
      // geometry, every item (CSS px inside the 360-wide frame)
      const vw = await seam(() => ({ w: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, h: innerHeight }));
      const min = init.ageBand === "6-9" ? 48 : 38;
      for (const t of ts) {
        if (!t.bbox) { geometry.push(`${t.id}: no bbox`); continue; }
        if (t.bbox.x < -0.5 || t.bbox.y < -0.5 || t.bbox.x + t.bbox.w > vw.w + 0.5 || t.bbox.y + t.bbox.h > vw.h + 0.5) geometry.push(`${t.id}: off-screen`);
        if (t.bbox.w < min || t.bbox.h < min) geometry.push(`${t.id}: ${Math.round(t.bbox.w)}x${Math.round(t.bbox.h)} px < ${min}`);
        if (t.font < 14) geometry.push(`${t.id}: font ${t.font}px`);
      }
      if (vw.sw > vw.w + 1) geometry.push(`horizontal overflow ${vw.sw} > ${vw.w}`);
      // drawn words: inside the world, not on each other, not under a target (where the child cannot read them)
      const texts = await seam(() => window.__forgeSeam.textBoxes());
      const rects = await seam(() => window.__forgeSeam.targetRects());
      const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      for (const t of texts) {
        if (t.x < -2 || t.y < -2 || t.x + t.w > 362 || t.y + t.h > 402) textIssues.add(`text "${t.text}" clipped at the world edge`);
        for (const r of rects) if (inter(t, r) > 0.25 * t.w * t.h) textIssues.add(`text "${t.text}" under target ${r.id}`);
      }
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], b = texts[j];
        if (inter(a, b) > 0.25 * Math.min(a.w * a.h, b.w * b.h)) textIssues.add(`text "${a.text}" overlaps "${b.text}"`);
      }
      // leak: before any action on this item, nothing pre-commit names the key
      const spec = levels[s.li].items[s.ii];
      const pre = await seam(() => window.__forgeSeam.prePromptText());
      const leakItem = spec.truthItem || { answer: spec.key.v, acceptable: spec.acceptable || [], prompt_en: spec.prompt.en, prompt_hi: spec.prompt.hi };
      const drawn = pre.split("\n").slice(1).join(" ");
      if (drawn.trim() && revealsAnswer(drawn, leakItem)) checks.push({ id: "leak.drawn_text", status: "fail", detail: `${spec.id}: drawn words name the key` });
      if (spec.mode !== "build") {
        const opts = ts.filter((t) => t.slot);
        keyPositions.push(opts.findIndex((t) => t.slot === "key"));
        const marks = await seam(() => window.__forgeSeam.optionMarks());
        const km = marks.find((x) => x.slot === "key");
        if (km) { const others = new Set(marks.filter((x) => x.slot !== "key").flatMap((x) => x.marks)); keyMarks.push(new Set(km.marks.filter((mk) => !others.has(mk)))); }
      }
      const first = s.li !== level;
      level = s.li;
      if (spec.mode === "build") {
        const counts = solveUnits(spec);
        if (!counts) { checks.push({ id: "Q4.solver", status: "fail", detail: `${spec.id}: no unit solution` }); break; }
        const add = (k) => ts.find((t) => t.op === "add" && t.slot === `u:${k}`);
        const confirm = ts.find((t) => t.control === "confirm"), clear = ts.find((t) => t.control === "clear");
        if (wrongPaths && first) {
          const small = spec.units.map((u, k) => ({ k, v: +u.v })).sort((a, b) => a.v - b.v)[0];
          // negative-path sweep: every remove at zero (the shadow refuses it), then add ×2 / remove ×1 of the smallest
          // unit, so a reducer that removes the wrong kind or goes below zero diverges from the shadow here
          for (const r of ts.filter((t) => t.op === "remove")) await tap(r);
          const rem = (k) => ts.find((t) => t.op === "remove" && t.slot === `u:${k}`);
          // one of every kind on, then off in the other order: a remove that hits another kind diverges here
          for (let k = 0; k < spec.units.length; k++) if (add(k)) await tap(add(k));
          for (let k = 0; k < spec.units.length; k++) if (rem(k)) await tap(rem(k));
          const sh = await st();
          if (sh.shadow && sh.shadow.some((c) => c !== 0) && !sh.failed) checks.push({ id: "Q4.remove_sweep", status: "fail", detail: `${spec.id}: remove after add left ${JSON.stringify(sh.shadow)}` });
          if (+spec.key.v !== small.v && add(small.k)) {
            const n0 = await answersSeen();
            await tap(add(small.k)); await tap(add(small.k));
            if (rem(small.k)) await tap(rem(small.k)); else await tap(add(small.k)).then(() => {});
            await tap(confirm);
            await waitAnswer(n0).catch(() => {});
            if (capture && !frames.after_wrong) frames.after_wrong = await page.screenshot({ type: "png" });
            if (clear) await tap(clear); else { checks.push({ id: "Q4.clear", status: "fail", detail: "no clear control" }); break; }
          }
        }
        const fresh = await targets();
        for (let k = 0; k < counts.length; k++) {
          const t = fresh.find((x) => x.op === "add" && x.slot === `u:${k}`);
          for (let c = 0; c < counts[k]; c++) { if (!t) break; await tap(t); }
        }
        const n1 = await answersSeen();
        const conf2 = (await targets()).find((t) => t.control === "confirm");
        if (!conf2) { checks.push({ id: "Q4.confirm", status: "fail", detail: "confirm vanished" }); break; }
        await tap(conf2);
        await waitAnswer(n1).catch(() => {});
      } else {
        if (wrongPaths && first) {
          // always the SAME distractor (d:0), so two runs post the same trace whatever order the kit shuffled
          const d = ts.find((t) => t.slot === "d:0") || ts.find((t) => t.slot && t.slot.startsWith("d:"));
          if (d) {
            const n0 = await answersSeen(); await tap(d); await waitAnswer(n0).catch(() => {});
            if (capture && !frames.after_wrong) frames.after_wrong = await page.screenshot({ type: "png" });
          }
        }
        const k = (await targets()).find((t) => t.slot === "key");
        if (!k) { checks.push({ id: "Q4.key_target", status: "fail", detail: `${spec.id}: key not on screen` }); break; }
        const n1 = await answersSeen(); await tap(k); await waitAnswer(n1).catch(() => {});
      }
      // advance (kit waits 700 ms after a correct commit)
      await frame.waitForFunction((prev) => { const x = window.__forgeSeam.state(); return x.won || x.failed || x.li !== prev.li || x.ii !== prev.ii; }, { li: s.li, ii: s.ii }, { timeout: Math.min(4000, left()) })
        .catch(() => checks.push({ id: "Q4.advance", status: "fail", detail: `${spec.id}: no advance after the key` }));
      if (checks.some((c) => c.status === "fail" && c.id.startsWith("Q4"))) break;
    }
    if (capture) frames.goal = await page.screenshot({ type: "png" });
    checks.push({ id: "Q6.geometry", status: geometry.length ? "fail" : "pass", detail: geometry.slice(0, 6).join("; ") });
    checks.push({ id: "Q6.text_layout", status: textIssues.size ? "fail" : "pass", detail: [...textIssues].slice(0, 6).join("; ") });
    if (keyPositions.length >= 3 && new Set(keyPositions).size === 1) checks.push({ id: "leak.key_position", status: "fail", detail: `key always at option ${keyPositions[0]}` });
    // a mark only the key carries, on EVERY choice item (a crypto shuffle makes a positional coincidence ~ (1/n)^items)
    const keyOnly = keyMarks.length >= 3 ? [...keyMarks[0]].filter((mk) => keyMarks.every((set) => set.has(mk))) : [];
    if (keyOnly.length) checks.push({ id: "leak.key_styled", status: "fail", detail: `the key option alone carries "${keyOnly[0].slice(0, 60)}" on ${keyMarks.length}/${keyMarks.length} items` });
    // network-free: a fetch from inside the shipped frame must be refused by its CSP
    const probe = await frame.evaluate(async () => { try { await fetch("https://example.org/forge-probe"); return "allowed"; } catch (e) { return "blocked"; } });
    checks.push({ id: "Q2.csp_blocks_fetch", status: probe === "blocked" ? "pass" : "fail", detail: probe });
    const seamFindings = await seam(() => window.__forgeSeam.findings());
    const violations = (await seam(() => window.__forgeSeam.violations())).filter((v) => !/forge-probe/.test(v.uri));
    const events = await page.evaluate(() => window.__hostEvents.map(({ at, ...e }) => e));
    const finalState = await st();
    return { events, external: external.filter((u) => !/forge-probe/.test(u)), consoleErrors: consoleErrors.filter((c) => !/forge-probe|Content Security Policy|Failed to fetch/.test(c)), pageErrors, seamFindings, violations, checks, frames, ms: Date.now() - t0, finalState };
  } catch (e) {
    checks.push({ id: "Q2.harness", status: "fail", detail: String(e.message).split("\n")[0].slice(0, 200) });
    const events = await page.evaluate(() => (window.__hostEvents || []).map(({ at, ...e }) => e)).catch(() => []);
    return { events, external, consoleErrors, pageErrors, seamFindings: [], violations: [], checks, frames, ms: Date.now() - t0, finalState: null };
  } finally {
    await context.close();
  }
}

/**
 * The browser half of the gate.
 * @param {{ html: string, levels: object[] (server LevelSpecs, with truth), topicId: string, ageBand: string, lang?: string, seed?: number, capture?: boolean, browser?: import("playwright-core").Browser }} o
 * @returns {Promise<{ gates: object[], metrics: object, frames: object, trace: object[] }>}
 */
export async function browserGate(o) {
  const own = !o.browser;
  const browser = o.browser || await launchBrowser();
  const topic = loadTopic(o.topicId);
  const init = { type: "init", moduleId: MODULE_ID, engine: "g2", params: { levels: frameLevels(o.levels), seed: o.seed ?? 7 }, goal: "g2_complete", lang: o.lang || "hinglish", ageBand: o.ageBand || "10-15" };
  try {
    const a = await playOnce(browser, { html: o.html, levels: o.levels, init, capture: !!o.capture });
    const b = await playOnce(browser, { html: o.html, levels: o.levels, init });
    const gates = [...a.checks];
    gates.push({ id: "Q2.console", status: a.consoleErrors.length + a.pageErrors.length ? "fail" : "pass", detail: [...a.pageErrors, ...a.consoleErrors].slice(0, 4).join(" | ") });
    gates.push({ id: "Q2.network", status: a.external.length ? "fail" : "pass", detail: a.external.slice(0, 4).join(" ") });
    gates.push({ id: "Q2.csp_violations", status: a.violations.length ? "fail" : "pass", detail: a.violations.slice(0, 3).map((v) => `${v.dir} ${v.uri}`).join("; ") });
    gates.push({ id: "Q2.protocol", status: a.events.some((e) => e.type === "protocol_violation") ? "fail" : "pass", detail: "" });
    const blockers = a.seamFindings.filter((f) => /^(ForgeContract|Agent|Budget)\./.test(f.code));
    gates.push({ id: "Q3.binding", status: blockers.length ? "fail" : "pass", detail: blockers.slice(0, 4).map((f) => `${f.code} ${f.detail}`).join("; ") });
    const errs = a.events.filter((e) => e.type === "error");
    gates.push({ id: "Q3.no_error_events", status: errs.length ? "fail" : "pass", detail: errs.slice(0, 3).map((e) => e.message).join("; ") });
    // Q4 goal
    const goals = a.events.filter((e) => e.type === "goal_met");
    const expected = o.levels.reduce((n, l) => n + l.items.length, 0);
    const answers = a.events.filter((e) => e.type === "answer");
    const corrects = answers.filter((e) => e.correct === true);
    gates.push({ id: "Q4.goal_met_once", status: goals.length === 1 && goals[0].goal === "g2_complete" && a.finalState?.won ? "pass" : "fail", detail: `goal_met ×${goals.length}, won=${a.finalState?.won}` });
    gates.push({ id: "Q4.all_items_correct", status: corrects.length === expected ? "pass" : "fail", detail: `${corrects.length}/${expected} items committed correct` });
    gates.push({ id: "Q4.wrong_path_seen", status: answers.some((e) => e.correct === false) ? "pass" : "fail", detail: `${answers.filter((e) => e.correct === false).length} wrong commits graded wrong` });
    const sig = (evs) => JSON.stringify(evs.map((e) => [e.type, e.name, e.value, e.correct, e.goal]));
    gates.push({ id: "Q4.determinism", status: sig(a.events) === sig(b.events) ? "pass" : "fail", detail: `${a.events.length} vs ${b.events.length} events` });
    // Q5 truth + binding: host re-derivation and raw-kit re-grade of every answer
    const specById = new Map(o.levels.flatMap((l) => l.items).map((s) => [s.id, s]));
    const truthFails = [];
    for (const ev of answers) {
      const p = ev.value || {};
      const spec = specById.get(p.item);
      if (!spec) { truthFails.push(`unknown item ${p.item}`); continue; }
      const re = rederive(spec, p);
      if (re.error) { truthFails.push(`${p.item}: ${re.error}`); continue; }
      if (!sameV(re.value, p.value)) truthFails.push(`${p.item}: frame value ${p.value} ≠ host ${re.value}`);
      const truth = topic && kitTruth(topic, p.item);
      if (!truth) { truthFails.push(`${p.item}: not in the kit`); continue; }
      const ok = regrade(truth, re.value);
      if (ok !== ev.correct) truthFails.push(`${p.item}: frame correct=${ev.correct}, kit says ${ok}`);
      const kitMisc = truth.misc[fold(re.value)] ?? re.misc ?? null;
      if (!ok && (p.misc || null) !== (kitMisc || null)) truthFails.push(`${p.item}: misc ${p.misc} ≠ kit ${kitMisc}`);
    }
    gates.push({ id: "Q5.answer_key", status: answers.length && !truthFails.length ? "pass" : "fail", detail: truthFails.slice(0, 4).join("; ") || `${answers.length} answers re-graded against the kit` });
    const metrics = { playMs: a.ms, events: a.events.length, answers: answers.length, items: expected, findings: a.seamFindings.length };
    return { gates, metrics, frames: a.frames, trace: a.events };
  } finally {
    if (own) await browser.close();
  }
}

/** Ship decision over gate results (FACTORY.md §5.4, reduced: no partial ship in v0). */
export function decide(gates) {
  const failed = gates.filter((g) => g.status !== "pass");
  if (failed.some((g) => g.id.startsWith("Q8"))) return { kind: "reject_unsafe", failed };
  return failed.length ? { kind: "repair", failed } : { kind: "to_review", failed };
}

/** The builder-facing summary: first failure on top, ≤ 1.5k chars, never the held-out items or thresholds' internals. */
export function summarise(gates) {
  const failed = gates.filter((g) => g.status !== "pass");
  if (!failed.length) return `PASS (${gates.length} checks)`;
  return `FAIL ${failed.length}/${gates.length}\n` + failed.map((g) => `- ${g.id}: ${g.detail}`).join("\n").slice(0, 1500);
}
