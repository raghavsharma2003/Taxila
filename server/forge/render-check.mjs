// Q2-lite + Q4-lite for G1 fills (FACTORY.md §5.1: G1 "Q2 boot & hygiene: sampled 5 % async"; QA R15: the live path
// must not skip the solver). Boots the REAL production frame (dist/modules.html, its meta CSP, the real engine chunk)
// in an opaque-origin iframe exactly as the ModuleHost mounts it, then replays the gate's solution by pointer and one
// wrong path (assets get CORS "*" as server/serve.mjs serves them to the opaque-origin frame), and checks the engine's
// own verdicts agree with the gate's key.
//   fraction-bars@1: shade / compare, wrong tap then the solution, in one mount.
//   scene@1 (W1-B #5): choice-card@1 and sequence-steps@1, a wrong commit and the solution in TWO mounts (a committed
//     probe is final in the frame). Each committed answer is also re-graded by the SERVER's grader (grade.js
//     gradeEvent over the stored binding): the frame's verdict and the server's must agree, and every control must lie
//     inside the frame at 360 x 640 (no clipped Check).
// Dev/eval/forge-validator only: needs playwright + a Chromium binary; never imported by the request path.
import { gradeEvent } from "./grade.js";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
const HOST = `<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe id="f" sandbox="allow-scripts" style="width:360px;height:640px;border:0"></iframe>
<script>
window.__ev = []; window.__ready = 0;
addEventListener("message", (e) => {
  const f = document.getElementById("f");
  if (e.source !== f.contentWindow || !e.data || e.data.type !== "ready") return;
  window.__ready++;
  const ch = new MessageChannel();
  ch.port1.onmessage = (m) => window.__ev.push(m.data);
  f.contentWindow.postMessage({ type: "init", moduleId: window.__mid, engine: window.__engine, params: window.__params, goal: window.__goal, lang: window.__lang, ageBand: "10-15" }, "*", [ch.port2]);
});
// A fresh iframe per mount, as ModuleHost does (a hash change alone would keep the old document).
window.__mount = (mid, engine, params, goal, lang) => { Object.assign(window, { __mid: mid, __engine: engine, __params: params, __goal: goal, __lang: lang, __ev: [], __ready: 0 });
  const old = document.getElementById("f"); const f = document.createElement("iframe");
  f.id = "f"; f.setAttribute("sandbox", "allow-scripts"); f.style.cssText = old.style.cssText; f.src = "/modules.html#" + encodeURIComponent(mid); old.replaceWith(f); };
</script>`;

function serve(dist) {
  const root = resolve(dist);
  const server = http.createServer(async (req, res) => {
    const path = decodeURIComponent((req.url || "/").split("?")[0]);
    if (path === "/__host.html") { res.writeHead(200, { "content-type": "text/html" }); return res.end(HOST); }
    const file = join(root, path === "/" ? "index.html" : path);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    try { const b = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "access-control-allow-origin": "*" }); res.end(b); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

/**
 * @param {{ fillKey: string, renderer: string, payload: any, grade: any, itemId: string }[]} fills  fraction-bars@1 and scene@1 fills
 * @returns {Promise<{ fillKey: string, ok: boolean, bootMs: number, failures: string[] }[]>}
 */
export async function renderCheck(fills, { dist = "dist", executablePath = process.env.FORGE_CHROMIUM || "/opt/pw-browsers/chromium", timeoutMs = 6000 } = {}) {
  const { chromium } = await import("playwright");
  const server = await serve(dist);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath });
  const out = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 360, height: 700 } })).newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120)); });
    page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 120)));
    const outside = [];
    await page.route("**/*", (route) => { const u = route.request().url(); if (!u.startsWith(base)) { outside.push(u); return route.abort(); } return route.continue(); });
    await page.goto(`${base}/__host.html`);
    for (const f of fills) {
      if (f.renderer === "scene@1") { out.push(await checkScene(page, f, { timeoutMs, consoleErrors, outside })); continue; }
      if (f.renderer !== "fraction-bars@1") { out.push({ fillKey: f.fillKey, ok: false, bootMs: 0, failures: ["renderer_not_checkable"] }); continue; }
      const failures = []; consoleErrors.length = 0; outside.length = 0;
      const mid = `g1-${f.fillKey.slice(-8)}`; const goal = `g1:${f.itemId}`;
      const t0 = Date.now();
      await page.evaluate(([m, e, p, g]) => window.__mount(m, e, p, g, "hinglish"), [mid, f.renderer, f.payload, goal]);
      const frame = await waitFrame(page, mid, timeoutMs);
      const p = f.payload;
      let bootMs = 0;
      try {
        await frame.waitForSelector(".fb-svg", { timeout: timeoutMs });
        bootMs = Date.now() - t0;
        const svgs = await frame.$$eval(".fb-svg", (els) => els.map((e) => e.getAttribute("aria-label")));
        if (svgs.length !== p.denominators.length) failures.push(`bars_rendered:${svgs.length}`);
        p.denominators.forEach((d, i) => { if (svgs[i] !== `${p.numerators[i] ?? 0} of ${d} parts shaded`) failures.push(`bar_${i}_label:${svgs[i]}`); });
        if (await frame.$("[data-card]")) failures.push("fallback_card_shown");
        if (p.mode === "compare") {
          const fr = p.denominators.map((d, i) => [p.numerators[i], d]);
          const same = f.grade.key === "same";
          const keyIdx = same ? -1 : fr.findIndex(([n, d]) => { const [kn, kd] = f.grade.key.split("/").map(Number); return n * kd === kn * d; });
          const wrongIdx = same ? 0 : fr.findIndex((_, i) => i !== keyIdx);
          await frame.click(`button[data-bar="${wrongIdx}"]`, { timeout: timeoutMs });           // the negative path first: one wrong tap
          await frame.click(same ? "button.fb-same" : `button[data-bar="${keyIdx}"]`, { timeout: timeoutMs });
        } else {
          const [tn, td] = p.target.split("/").map(Number); const d = p.denominators[p.targetBar ?? 0];
          const parts = (tn * d) / td;
          for (let k = 0; k < parts; k++) await frame.click('button[aria-label="shade one part more"]', { timeout: timeoutMs });
        }
        await page.waitForFunction((g) => window.__ev.some((e) => e.type === "goal_met" && e.goal === g), goal, { timeout: timeoutMs }).catch(() => failures.push("solution_did_not_reach_goal"));
        const ev = await page.evaluate(() => window.__ev);
        if (ev.some((e) => e.type === "error")) failures.push(`engine_error:${ev.find((e) => e.type === "error").message.slice(0, 60)}`);
        if (ev.some((e) => e.type === "interaction" && e.name === "params_adjusted")) failures.push("params_adjusted");
        if (p.mode === "compare") {
          const answers = ev.filter((e) => e.type === "answer");
          if (answers.length !== 2 || answers[0].correct !== false || answers[1].correct !== true) failures.push(`engine_verdicts_disagree_with_gate:${answers.map((a) => a.correct).join(",")}`);
        }
        if ((await page.evaluate(() => window.__ready)) !== 1) failures.push("ready_count");
      } catch (e) { failures.push(`boot:${String(e.message).slice(0, 80)}`); }
      if (consoleErrors.length) failures.push(`console:${consoleErrors[0]}`);
      if (outside.length) failures.push(`network:${outside[0].slice(0, 60)}`);
      out.push({ fillKey: f.fillKey, ok: failures.length === 0, bootMs, failures });
    }
  } finally { await browser.close(); server.close(); }
  return out;
}

/** One scene@1 mount: the wrong path (first = true) or the solution. → { bootMs, answers, failures } */
async function sceneRun(page, f, b, { wrong, timeoutMs }) {
  const failures = [];
  const mid = `g1-${f.fillKey.slice(-8)}`; const goal = `g1:${f.itemId}`;
  const t0 = Date.now();
  await page.evaluate(([m, p, g]) => window.__mount(m, "scene@1", p, g, "hinglish"), [mid, f.payload, goal]);
  const frame = await currentFrame(page, timeoutMs);   // the NEW iframe (a second mount reuses the moduleId and URL)
  await frame.waitForSelector(".sc-stage", { timeout: timeoutMs });
  const bootMs = Date.now() - t0;
  if (await frame.$("[data-card]")) failures.push("fallback_card_shown");
  // every control inside the frame's view (the tray clips nothing the child must press)
  const off = await frame.$$eval("button, input", (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < -1 || r.left < -1); }).length);
  if (off) failures.push(`controls_outside_frame:${off}`);
  if (b.template === "choice-card@1") {
    const ids = Object.keys(b.options);
    const pick = wrong ? ids.find((id) => id !== b.correctId) : b.correctId;
    await frame.click(`button[data-choice="${pick}"]`, { timeout: timeoutMs });
  } else {
    const order = f.payload.scene.nodes.find((n) => n.kind === "order" && n.id === b.orderNode);
    let cur = [...(order?.start ?? [])];
    if (!wrong) {
      for (let i = 0; i < b.correctOrder.length; i++) {
        if (cur[i] === b.correctOrder[i]) continue;
        await frame.click(`button[data-order-item="${cur[i]}"]`, { timeout: timeoutMs });
        await frame.click(`button[data-order-item="${b.correctOrder[i]}"]`, { timeout: timeoutMs });
        const j = cur.indexOf(b.correctOrder[i]); [cur[i], cur[j]] = [cur[j], cur[i]];
      }
    }
    await frame.click('button[data-target="check"]', { timeout: timeoutMs });
  }
  await page.waitForFunction(() => window.__ev.some((e) => e.type === "answer"), null, { timeout: timeoutMs }).catch(() => failures.push("no_answer_event"));
  const ev = await page.evaluate(() => window.__ev);
  if (ev.some((e) => e.type === "error")) failures.push(`engine_error:${ev.find((e) => e.type === "error").message.slice(0, 60)}`);
  if (ev.some((e) => e.type === "interaction" && e.name === "params_adjusted")) failures.push("params_adjusted");
  if ((await page.evaluate(() => window.__ready)) !== 1) failures.push("ready_count");
  return { bootMs, answers: ev.filter((e) => e.type === "answer"), failures };
}

/** A scene@1 fill: wrong path and solution, frame verdicts vs the gate's key vs the server grader. */
async function checkScene(page, f, { timeoutMs, consoleErrors, outside }) {
  const failures = []; consoleErrors.length = 0; outside.length = 0;
  const b = f.grade?.binding;
  let bootMs = 0;
  if (!b || b.engine !== "scene@1") return { fillKey: f.fillKey, ok: false, bootMs: 0, failures: ["no_scene_binding"] };
  const mid = `g1-${f.fillKey.slice(-8)}`;
  for (const wrong of [true, false]) {
    try {
      const r = await sceneRun(page, f, b, { wrong, timeoutMs });
      bootMs = Math.max(bootMs, r.bootMs);
      failures.push(...r.failures.map((x) => `${wrong ? "wrong" : "solution"}.${x}`));
      const a = r.answers;
      if (a.length !== 1 || a[0].correct !== !wrong) failures.push(`${wrong ? "wrong" : "solution"}.engine_verdict_disagrees_with_gate:${a.map((x) => x.correct).join(",")}`);
      const g = a[0] && gradeEvent(f.grade, { moduleId: mid, engine: "scene@1", type: "answer", name: "answer", data: { value: a[0].value, correct: a[0].correct } });
      if (!g) failures.push(`${wrong ? "wrong" : "solution"}.server_grader_null`);
      else if ((g.outcome === "correct") !== !wrong) failures.push(`${wrong ? "wrong" : "solution"}.server_grader_disagrees:${g.outcome}`);
    } catch (e) { failures.push(`${wrong ? "wrong" : "solution"}.boot:${String(e.message).slice(0, 80)}`); }
  }
  if (consoleErrors.length) failures.push(`console:${consoleErrors[0]}`);
  if (outside.length) failures.push(`network:${outside[0].slice(0, 60)}`);
  return { fillKey: f.fillKey, ok: failures.length === 0, bootMs, failures };
}

async function currentFrame(page, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const fr = await (await page.$("#f"))?.contentFrame();
    if (fr && !fr.isDetached() && fr.url().includes("/modules.html")) return fr;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("frame did not attach");
}

async function waitFrame(page, mid, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const fr = page.frames().find((x) => !x.isDetached() && x.url().includes(`/modules.html#${encodeURIComponent(mid)}`));
    if (fr) return fr;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("frame did not attach");
}
