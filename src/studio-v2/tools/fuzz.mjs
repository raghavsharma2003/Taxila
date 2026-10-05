// Bad-spec fuzz + injected faults in a real browser (STUDIO-V2 §14 M5 method, now a per-engine release gate).
// For each engine: N seeded mutated specs (src/studio-v2/core/mutate.ts) + 2 controls, each mounted and played by
// the bot for a few seconds. A VISIBLE FAILURE is any of: a page error, no `ready` within 6 s, a blank stage, or
// failure-shaped text in the child-visible chrome. Then three injected faults: transient (held on the last good frame),
// permanent (engine_failed → board), boot (board from the start).
//   node src/studio-v2/tools/fuzz.mjs [--only <archetype>] [--n 32] [--play-ms 2500]
import fs from "node:fs";
import path from "node:path";
import { docs, launch, runBot, serve, sleep, stagePainted, visibleFailureText, waitReady } from "./pw.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const only = opt("--only", null), N = +opt("--n", 32), playMs = +opt("--play-ms", 2500);
const measuredFile = path.join(docs, "measured.json");
const { server, base } = await serve();
const browser = await launch();
const ids = await (async () => { const p = await browser.newPage(); await p.goto(base); const l = await p.evaluate(() => [...document.querySelectorAll(".card")].map((c) => c.dataset.archetype)); await p.close(); return only ? l.filter((x) => x === only) : l; })();

async function probe(url, { faultWaitMs = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 500 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
  let ready = true;
  try { await page.goto(url); await waitReady(page, 6000); } catch { ready = false; }
  if (ready) { await runBot(page, { maxMs: playMs }); if (faultWaitMs) await sleep(faultWaitMs); }
  const painted = ready ? await stagePainted(page) : { painted: false, reason: "not-ready" };
  const bad = ready ? await visibleFailureText(page) : null;
  const info = ready ? await page.evaluate(() => { const h = window.__sv2; return { rung: h.rung(), repairs: h.repairs.length, fellBack: h.fellBack, frameErr: h.log.some((m) => m.name === "frame_error"), failed: h.log.some((m) => m.k === "engine_failed" || m.k === "fallback"), tooSmall: h.tooSmall.length, safeHits: h.safeHits.length, answers: h.log.filter((m) => m.k === "answer").length }; }) : {};
  await ctx.close();
  const visibleFailure = errors.length > 0 || !ready || !painted.painted || !!bad;
  return { visibleFailure, errors, ready, painted: painted.painted, sd: painted.sd, bad, ...info };
}

const measured = fs.existsSync(measuredFile) ? JSON.parse(fs.readFileSync(measuredFile, "utf8")) : { engines: {} };
measured.engines ??= {};
for (const id of ids) {
  const enc = encodeURIComponent(id);
  const rows = [];
  for (let s = 0; s < N + 2; s++) {
    const url = s < N ? `${base}?engine=${enc}&mut=${s + 1}&sound=off` : `${base}?engine=${enc}&sound=off`;
    const r = await probe(url);
    rows.push({ seed: s < N ? s + 1 : "control", ...r });
    if (r.visibleFailure) console.log("  VISIBLE FAILURE", id, s + 1, JSON.stringify(r));
  }
  const faults = {};
  faults.transient = await probe(`${base}?engine=${enc}&fault=transient&sound=off`, { faultWaitMs: 500 });
  faults.permanent = await probe(`${base}?engine=${enc}&fault=permanent&sound=off`, { faultWaitMs: 1500 });
  faults.boot = await probe(`${base}?engine=${enc}&fault=boot&sound=off`);
  const mut = rows.filter((r) => r.seed !== "control");
  const summary = {
    n: mut.length, controls: rows.length - mut.length,
    visibleFailures: rows.filter((r) => r.visibleFailure).length,
    repaired: mut.filter((r) => r.repairs > 0 && !r.fellBack).length, fellBack: mut.filter((r) => r.fellBack).length,
    boardRung: mut.filter((r) => r.rung === "board").length, frameErrors: mut.filter((r) => r.frameErr).length,
    tooSmallMax: Math.max(0, ...rows.map((r) => r.tooSmall ?? 0)), safeHitsMax: Math.max(0, ...rows.map((r) => r.safeHits ?? 0)),
    faults: {
      transientHeld: faults.transient.rung === "engine" && faults.transient.frameErr && !faults.transient.visibleFailure,
      permanentToBoard: faults.permanent.rung === "board" && faults.permanent.failed && !faults.permanent.visibleFailure,
      bootToBoard: faults.boot.rung === "board" && !faults.boot.visibleFailure,
    },
    playMs, date: new Date().toISOString(),
  };
  console.log(id, JSON.stringify(summary));
  const fresh = fs.existsSync(measuredFile) ? JSON.parse(fs.readFileSync(measuredFile, "utf8")) : { engines: {} };
  fresh.engines ??= {}; fresh.engines[id] = { ...(fresh.engines[id] ?? {}), fuzz: summary };
  fs.writeFileSync(measuredFile, JSON.stringify(fresh, null, 1));
  fs.mkdirSync(path.join(docs, "fuzz"), { recursive: true });
  fs.writeFileSync(path.join(docs, "fuzz", id.replace(/[^a-z0-9-]/gi, "_") + ".json"), JSON.stringify({ summary, rows, faults }, null, 1));
}
await browser.close();
server.close();
