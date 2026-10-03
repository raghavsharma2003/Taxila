// Q2-lite + Q4-lite for G1 engine fills (FACTORY.md §5.1: G1 "Q2 boot & hygiene: sampled 5 % async"; QA R15: the
// live path must not skip the solver). Boots the REAL production frame (dist/modules.html, its meta CSP, the real
// fraction-bars@1 chunk) in an opaque-origin iframe exactly as the ModuleHost mounts it, then replays the gate's
// solution by pointer and one wrong path (assets get CORS "*" as server/serve.mjs serves them to the opaque-origin frame), and checks the engine's own verdicts agree with the gate's key.
// Dev/eval/forge-validator only: needs playwright + a Chromium binary; never imported by the request path.
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
 * @param {{ fillKey: string, renderer: string, payload: any, grade: any, itemId: string }[]} fills  engine fills only
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

async function waitFrame(page, mid, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const fr = page.frames().find((x) => !x.isDetached() && x.url().includes(`/modules.html#${encodeURIComponent(mid)}`));
    if (fr) return fr;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("frame did not attach");
}
