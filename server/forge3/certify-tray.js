// Certificates for the tray gate's two remaining kinds (round 4, stream 2 content): the Studio SKELETONS (the code
// skeleton-as-activity of every W2 frame archetype) and the Director's MODULE ENGINES (src/modules frame engines). Both are
// rendered offline in Chromium at the stage box contract's boxes (docs/design/round4/build/box-contract.json, measured
// from the real Desk) and judged by the forge3 checks (server/forge3/qa/checks.js); the verdict tables are what
// server/forge3/tray-gate.js reads at reveal time.
//
//   FORGE3_QA_LOCAL=1 node server/forge3/certify-tray.js --skeletons [--per 10] [--shots DIR]
//   FORGE3_QA_LOCAL=1 node server/forge3/certify-tray.js --modules [--per 8] [--dist dist] [--shots DIR]
//
// Samples are the pieces a child actually gets, never hand-picked: skeletons from seam.candidateIntents over every kit
// (classes 1-9, the lesson-start prefetch's own params), each with the chrome words ({} strings) AND a long strings table
// (the planner's 80-char cap); engines from shared/engine-catalog.js planEngine over every kit item, in the modes the
// Director mounts (show, predict), deduplicated, up to --per per (engine, mode, band), spread across topics.
// A cell passes at a size only when EVERY sample passes there (a family cell fails on any sample: rj-mean-check-pass-as-quality).
// Serving rule (certify.js servesView): a classes 1-4 / 4-5 view whose only failure is the 16 px young floor with every word
// ≥ 14 px may be served.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { serveHarness, buildHarness, openJudge, launchLocal, REPO } from "./qa/render.js";
import { measureDocument } from "./qa/measure.js";
import { judgeFrame, QA_VERSION } from "./qa/checks.js";
import { servesView } from "./certify.js";
import { VP_CLASSES, contractBox, SKELETON_CERT_FILE, MODULE_CERT_FILE } from "./tray-gate.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const VIEWPORT = { p360: { width: 360, height: 800 }, p412: { width: 412, height: 915 }, l1366: { width: 1366, height: 768 } };
const hash = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 12);

/** The judged views for a band: the contract's tray boxes at the three classes. */
export function trayViewports(young) {
  return VP_CLASSES.map((vp) => ({ vp, viewport: VIEWPORT[vp], tray: contractBox(vp, { young }) })).filter((v) => v.tray);
}

function kitTopics() {
  const dir = path.join(REPO, "data", "kits");
  return fs.readdirSync(dir).filter((f) => /^c\d-[a-z]+\.json$/.test(f)).sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).topics ?? []);
}
const classOf = (topicId) => Number(String(topicId).match(/^c(\d)/)?.[1] ?? 6);
/** Spread k picks over a list (deterministic): first, last and evenly between. */
function spread(xs, k) {
  if (xs.length <= k) return xs;
  return Array.from({ length: k }, (_, i) => xs[Math.round((i * (xs.length - 1)) / Math.max(1, k - 1))]);
}

// ───────────────────────────── skeleton samples ─────────────────────────────
const LONG = {
  title: "Barabar hisse pehchano aur sahi rang bharo", instr: "Har tukde ko dhyan se dekho, phir utne hi hisson mein rang bharo jitne sawaal mein likhe hain.",
  check: "Jaanch karo", right: "Bilkul sahi! Tumne dhyan se gina.", wrong: "Ek baar phir gino, hisse barabar hain na?", done: "Shabash, saare sawaal ho gaye!", hint: "Pehle neeche wali sankhya dekho.",
};
export async function skeletonSamples(per = 10) {
  const { candidateIntents } = await import("../studio/seam.js");
  const { stringKeys, archetype } = await import("../studio/archetypes/index.js");
  const by = new Map(); // `${archetype}|${band}` → [{ topicId, params }]
  for (const kit of kitTopics()) {
    const cl = classOf(kit.topicId);
    let cands = [];
    try { cands = candidateIntents({ lessonId: "qa", kit, topicId: kit.topicId, child: { class_level: cl, language_pref: "hinglish" } }); } catch { continue; }
    for (const c of cands) {
      const a = archetype(c.archetype);
      if (a.build === "script" || !a.skeleton) continue;
      const band = cl <= 4 ? "young" : "older";
      const key = `${a.id}|${band}`;
      const list = by.get(key) ?? [];
      if (!list.some((x) => hash(x.params) === hash(c.params))) list.push({ topicId: kit.topicId, params: c.params, keys: stringKeys(a, c.params) });
      by.set(key, list);
    }
  }
  const out = [];
  for (const [key, list] of by) {
    const [id, band] = key.split("|");
    const a = archetype(id);
    for (const s of spread(list, per)) {
      const longStrings = Object.fromEntries(s.keys.map((k) => [k, LONG[k] ?? (k.length > 3 ? "Yeh wala hissa dhyan se dekho" : "Haan")]));
      for (const [variant, strings] of [["chrome", {}], ["long", longStrings]]) {
        out.push({ archetype: id, band, topicId: s.topicId, variant, artifact: { kind: "skeleton", stage: a.stage, skeleton: a.skeleton, archetype: id, intentId: `qa:${id}`, params: s.params, strings } });
      }
    }
  }
  return out;
}

// ───────────────────────────── module samples ─────────────────────────────
export async function moduleSamples(per = 8) {
  const { planEngine, ENGINES } = await import("../../shared/engine-catalog.js");
  const { validModes } = await import("../../shared/engine-catalog.js");
  const { engineConfigError } = await import("../director/engine-check.js");
  const topicMap = JSON.parse(fs.readFileSync(path.join(REPO, "shared", "engine-topic-map.json"), "utf8"));
  const by = new Map();
  for (const kit of kitTopics()) {
    const cl = classOf(kit.topicId);
    const band = cl <= 4 ? "young" : "older";
    const ageBand = cl <= 4 ? "6-9" : "10-15";
    for (const item of [...(kit.items ?? []), null]) {
      for (const mode of ["show", "predict"]) {
        let p = null;
        try { p = planEngine({ kit, item, lang: "hinglish", mode, topicMap, ageBand }); } catch { p = null; }
        if (!p?.engine || !ENGINES[p.engine] || p.engine === "explainer@1") continue;
        // only what the Director would mount (modules.js mountable: valid modes, a config the frame accepts)
        p = { ...p, params: validModes(p.engine, p.params) };
        if (engineConfigError(p.engine, p.params)) continue;
        const m = String(p.params?.mode ?? "*");
        const key = `${p.engine}|${m}|${band}`;
        const list = by.get(key) ?? [];
        const params = p.params ?? {};
        if (!list.some((x) => hash(x.params) === hash(params))) list.push({ topicId: kit.topicId, params, goal: p.goal ?? null, ageBand });
        by.set(key, list);
      }
    }
  }
  const out = [];
  for (const [key, list] of by) {
    const [engine, mode, band] = key.split("|");
    for (const s of spread(list, per)) out.push({ engine, mode, band, ...s });
  }
  return out;
}

/** A static server for the product build (dist/: modules.html + assets) with the frame's CSP, and a host page. */
function serveDist(dist) {
  const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
  const HOST = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#tray{position:absolute;left:16px;top:120px;overflow:hidden}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><div id="tray"></div><script>
    window.events=[];let port=null;window.mount=(o)=>{window.events=[];port=null;const t=document.getElementById('tray');t.innerHTML='';t.style.width=o.w+'px';t.style.height=o.h+'px';
    const f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts');f.src='/modules.html#qa';t.appendChild(f);
    const init={type:'init',moduleId:'qa',engine:o.engine,params:o.params,goal:o.goal||undefined,lang:o.lang||'hinglish',ageBand:o.ageBand||'10-15'};
    const on=(e)=>{if(e.source!==f.contentWindow||!e.data||e.data.type!=='ready'||port)return;const ch=new MessageChannel();port=ch.port1;port.onmessage=(m)=>window.events.push(m.data);f.contentWindow.postMessage(init,'*',[ch.port2]);};
    window.addEventListener('message',on);};</script></body></html>`;
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/host.html") { res.writeHead(200, { "content-type": TYPES[".html"] }); return res.end(HOST); }
    for (const root of [dist, path.join(REPO, "public")]) {
      const p = path.normalize(path.join(root, decodeURIComponent(u.pathname)));
      if (!p.startsWith(root) || !fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
      const h = { "content-type": TYPES[path.extname(p)] || "application/octet-stream" };
      if (u.pathname.startsWith("/assets/")) h["access-control-allow-origin"] = "*";
      if (u.pathname === "/modules.html") h["content-security-policy"] = "sandbox allow-scripts; frame-ancestors 'self'";
      res.writeHead(200, h); fs.createReadStream(p).pipe(res); return;
    }
    res.writeHead(404).end();
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

/** One engine sample at each judged box: mount it in a sandboxed frame of the tray's size, measure inside the frame. */
async function judgeModule(page, s, young, shotDir) {
  const views = [];
  for (const v of trayViewports(young)) {
    await page.setViewportSize(v.viewport);
    await page.evaluate((o) => window.mount(o), { engine: s.engine, params: s.params, goal: s.goal, ageBand: s.ageBand, w: v.tray.w, h: v.tray.h });
    let fr = null;
    for (let k = 0; k < 40 && !fr; k++) {
      await page.waitForTimeout(150);
      fr = page.frames().find((f) => f !== page.mainFrame() && /modules\.html/.test(f.url())) ?? null;
      if (fr && !(await fr.evaluate(() => !!document.querySelector("[data-engine]")).catch(() => false))) fr = k > 30 ? fr : null;
    }
    await page.waitForTimeout(700);
    const d = fr ? await fr.evaluate(measureDocument).catch(() => null) : null;
    const events = await page.evaluate(() => window.events.slice());
    const err = events.find((e) => e?.type === "error");
    const verdict = judgeFrame(d ?? {}, { young });
    const minPx = d?.texts?.length ? Math.min(...d.texts.map((t) => t.px).filter((x) => x > 0)) : null;
    if (err) { verdict.pass = false; verdict.fails = [...verdict.fails, "Q6.clean"]; }
    const serve = servesView({ pass: verdict.pass, fails: verdict.fails, minPx });
    if (shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${s.engine.replace("@", "_")}-${s.mode}-${s.band}-${hash(s.params)}-${v.vp}.png`) }).catch(() => {}); }
    views.push({ vp: v.vp, pass: verdict.pass, serve, fails: verdict.fails, minPx, detail: verdict.hard.filter((x) => !x.pass).map((x) => `${x.id} ${x.detail ?? ""}`).slice(0, 3), err: err ? String(err.message ?? err.reason ?? "error").slice(0, 80) : null });
  }
  return views;
}

function cellOf(table, keyPath) {
  let o = table;
  for (const k of keyPath.slice(0, -1)) o = o[k] ??= {};
  const last = keyPath.at(-1);
  return (o[last] ??= { byViewport: Object.fromEntries(VP_CLASSES.map((v) => [v, true])), serveByViewport: Object.fromEntries(VP_CLASSES.map((v) => [v, true])), n: 0, fails: [] });
}
function addViews(cell, views) {
  cell.n++;
  for (const v of views) {
    if (!v.pass) cell.byViewport[v.vp] = false;
    if (!v.serve) cell.serveByViewport[v.vp] = false;
    for (const f of v.fails ?? []) if (cell.fails.length < 12 && !cell.fails.includes(`${v.vp}:${f}`)) cell.fails.push(`${v.vp}:${f}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const shots = arg("shots", null);
  const only = arg("only", null);
  const browser = await launchLocal();
  try {
    if (argv.includes("--skeletons")) {
      const per = Number(arg("per", "10")) || 10;
      const samples = (await skeletonSamples(per)).filter((s) => !only || s.archetype === only);
      const dir = await buildHarness(path.join(arg("harness", path.join(here, "..", "..", "node_modules", ".cache", "forge3-harness"))));
      const { server, base } = await serveHarness(dir);
      const judge = await openJudge({ browser, base });
      const table = { v: 1, qa: QA_VERSION, at: new Date().toISOString(), viewports: VP_CLASSES, boxes: "docs/design/round4/build/box-contract.json tray boxes (b3 older, b2 young)",
        source: "seam.candidateIntents over every kit (classes 1-9), chrome and long strings tables", archetypes: {}, samples: [] };
      let i = 0;
      for (const s of samples) {
        const young = s.band === "young";
        const r = await judge.judge(s.artifact, { viewports: trayViewports(young), young, lang: "hinglish", ...(shots && i % 5 === 0 ? { shotDir: path.join(shots, "skeletons"), shotTag: `${s.archetype}-${s.band}-${i}` } : {}) });
        i++;
        const views = r.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, serve: servesView({ pass: v.verdict.pass, fails: v.verdict.fails, minPx: v.verdict.stats?.minPx }), fails: v.verdict.fails }));
        addViews(cellOf(table, ["archetypes", s.archetype, s.band]), views);
        table.samples.push({ archetype: s.archetype, band: s.band, topicId: s.topicId, variant: s.variant, views: views.map((v) => ({ vp: v.vp, pass: v.pass, serve: v.serve, fails: v.fails })),
          minPx: Object.fromEntries(r.views.map((v) => [v.vp, v.verdict.stats?.minPx ?? null])), detail: r.views.flatMap((v) => v.verdict.hard.filter((x) => !x.pass).map((x) => `${v.vp} ${x.id} ${x.detail ?? ""}`)).slice(0, 4) });
        console.log(`${s.archetype} ${s.band} ${s.variant} ${s.topicId}: ${views.map((v) => `${v.vp}:${v.serve ? "ok" : v.fails.join("+")}`).join(" ")}`);
      }
      await judge.close(); server.close();
      fs.writeFileSync(arg("out", SKELETON_CERT_FILE), JSON.stringify(table, null, 1));
      for (const [id, bands] of Object.entries(table.archetypes)) for (const [b, c] of Object.entries(bands)) console.log(`CELL ${id} ${b} n=${c.n} serve ${JSON.stringify(c.serveByViewport)} ${c.fails.slice(0, 4).join(" ")}`);
    }
    if (argv.includes("--modules")) {
      const per = Number(arg("per", "8")) || 8;
      const dist = path.resolve(arg("dist", path.join(REPO, "dist")));
      if (!fs.existsSync(path.join(dist, "modules.html"))) throw new Error(`no ${dist}/modules.html: run npx vite build first`);
      const samples = (await moduleSamples(per)).filter((s) => !only || s.engine === only);
      const { server, base } = await serveDist(dist);
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto(`${base}/host.html`);
      const table = { v: 1, qa: QA_VERSION, at: new Date().toISOString(), viewports: VP_CLASSES, boxes: "docs/design/round4/build/box-contract.json tray boxes (b3 older, b2 young)",
        source: "shared/engine-catalog.js planEngine over every kit item (show, predict), lang hinglish", engines: {}, samples: [] };
      for (const s of samples) {
        const young = s.band === "young";
        const views = await judgeModule(page, s, young, shots ? path.join(shots, "modules") : null);
        addViews(cellOf(table, ["engines", s.engine, "modes", s.mode, s.band]), views);
        table.samples.push({ engine: s.engine, mode: s.mode, band: s.band, topicId: s.topicId, params: s.params, views });
        console.log(`${s.engine} ${s.mode} ${s.band} ${s.topicId}: ${views.map((v) => `${v.vp}:${v.serve ? "ok" : `${v.fails.join("+")}(${v.minPx}px${v.err ? " " + v.err : ""})`}`).join(" ")}`);
      }
      await ctx.close(); server.close();
      fs.writeFileSync(arg("out", MODULE_CERT_FILE), JSON.stringify(table, null, 1));
      for (const [e, row] of Object.entries(table.engines)) for (const [m, bands] of Object.entries(row.modes)) for (const [b, c] of Object.entries(bands)) console.log(`CELL ${e} ${m} ${b} n=${c.n} serve ${JSON.stringify(c.serveByViewport)} ${c.fails.slice(0, 3).join(" ")}`);
    }
  } finally { await browser.close(); }
}
