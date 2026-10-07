// ROUND 2 — stream duplex-real acceptance: the duplex engine's path out of shadow, against a RUNNING server (local first,
// then taxila.dev).
//   NODE_USE_ENV_PROXY=1 node tests/prod/round2-duplex-real.mjs            (TAXILA_BASE=http://localhost:PORT for local)
//   DUPLEX_REAL_LOG=<server stdout file>  (local only) also proves the line the server wrote is content-blind
// Needs docs/design/round2/duplex-real/APPLY.md applied, built and deployed. Arms, each naming what it proves:
//   config     GET /api/duplex/config answers (on / shadow / off) and says which; the switch criteria apply to "shadow".
//   shadow     POST /api/duplex/shadow exists (404 = patch 01 not deployed) and answers 204 to a well-formed summary, to an
//              off-schema body, to words smuggled into it, and to garbage; never a 4xx/5xx a client could trip on.
//   bundle     the served client carries the telemetry (the schema id "duplex-shadow/1" and the route), so a shadow lesson
//              actually reports what the engine would have done.
//   log        (local, with DUPLEX_REAL_LOG) the server wrote exactly one duplex_shadow line for the valid post, with the lesson
//              id hashed and none of the smuggled words.
//   evidence   the measured switch criteria from the committed result files (evals/duplex-real/criteria.mjs): printed as
//              INFO, never a deploy failure (they are the reason duplex stays in shadow, not a regression of this build).
import fs from "node:fs";
import { ok, warn, done, BASE, isLocal } from "./lib.mjs";

const SCHEMA = "duplex-shadow/1";
const LESSON = "00000000-0000-4000-8000-000000000d17";
const SECRET = "मेरा नाम गुप्त है 98765";
const valid = { lessonId: LESSON, summary: { schema: SCHEMA, mode: "shadow", band: "B3", lane: "live_transcribe", durMs: 61000, frames: 3050,
  turns: [{ eg: 420, sg: 1180, ec: 0, ep: null, sc: 0, r: "turn_end" }, { eg: 610, sg: 1240, ec: 1, ep: 900, sc: 0, r: "backstop_silence" }],
  overlaps: [{ ey: 180, ss: 420, bm: 900 }], safetyRows: 0, fallbacks: [] } };

// ── config ──
const cfgRes = await fetch(BASE + "/api/duplex/config").catch(() => ({ status: 0 }));
const cfg = cfgRes.status === 200 ? await cfgRes.json().catch(() => null) : null;
ok(cfgRes.status === 200 && ["on", "shadow", "off"].includes(cfg?.duplex), `config: GET /api/duplex/config → ${cfgRes.status} ${JSON.stringify(cfg)}`);
if (cfg?.duplex) console.log(`INFO duplex mode on this server: ${cfg.duplex}`);

// ── shadow route ──
const post = async (body, raw = false) => {
  const r = await fetch(BASE + "/api/duplex/shadow", { method: "POST", headers: { "content-type": raw ? "text/plain;charset=UTF-8" : "application/json" }, body: raw ? body : JSON.stringify(body) }).catch(() => ({ status: 0 }));
  return r.status;
};
const s1 = await post(valid);
ok(s1 === 204, `shadow: a well-formed summary → ${s1} (404 = patches/01-register-shadow-route.diff not deployed)`);
const s2 = await post(JSON.stringify(valid), true);
ok(s2 === 204, `shadow: the beacon form (text/plain body, as navigator.sendBeacon sends it) → ${s2}`);
const s3 = await post({ lessonId: LESSON, summary: { schema: "nope" } });
ok(s3 === 204, `shadow: an off-schema summary is dropped quietly → ${s3}`);
const s4 = await post({ lessonId: LESSON, childText: SECRET, summary: { ...valid.summary, text: SECRET, turns: [{ eg: 1, r: SECRET }] } });
ok(s4 === 204, `shadow: words smuggled into a summary → ${s4} (dropped by the sanitizer)`);
const sg = await post("{not json", true);
ok(sg === 204 || sg === 400, `shadow: a malformed body never 5xx (${sg})`);

// ── bundle ──
try {
  const html = await (await fetch(BASE + "/")).text();
  const queue = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => new URL(m[1], BASE + "/").href);
  const seen = new Set();
  let schema = false, route = false;
  for (let i = 0; i < queue.length && i < 200; i++) {
    const u = queue[i];
    if (seen.has(u)) continue;
    seen.add(u);
    const js = await (await fetch(u)).text().catch(() => "");
    if (js.includes(SCHEMA)) schema = true;
    if (js.includes("/api/duplex/shadow")) route = true;
    for (const m of js.matchAll(/["'`](\/?assets\/[A-Za-z0-9_.-]+\.js)["'`]/g)) queue.push(new URL(m[1].replace(/^\/?/, "/"), BASE).href);
  }
  ok(schema && route, `bundle: the client ships the shadow telemetry (schema ${schema}, route ${route}; ${seen.size} chunks read)`);
} catch (e) {
  ok(false, `bundle: could not read the client: ${e.message}`);
}

// ── log (local) ──
const logFile = process.env.DUPLEX_REAL_LOG;
if (isLocal && logFile && fs.existsSync(logFile)) {
  await new Promise((r) => setTimeout(r, 300));
  const lines = fs.readFileSync(logFile, "utf8").split("\n").filter((l) => l.includes('"kind":"duplex_shadow"'));
  const mine = lines.map((l) => JSON.parse(l.slice(l.indexOf("{")))).filter((l) => l.turns?.length === 2 && l.overlaps?.length === 1 && l.durMs === 61000);
  ok(mine.length >= 2, `log: the valid posts wrote duplex_shadow lines (${mine.length})`);
  ok(lines.every((l) => !l.includes(LESSON) && !l.includes("गुप्त") && !l.includes("98765")), "log: no lesson id and none of the smuggled words reach the log");
  ok(mine.every((l) => typeof l.lesson === "string" && l.lesson.length === 12), "log: the lesson id is a 12-char salted hash (joins the access log)");
} else warn(isLocal ? "log: set DUPLEX_REAL_LOG to the server's stdout file to check the written line" : "log: prod stdout is read from Log Analytics (evals/duplex-real/shadow-report.mjs), not from here");

// ── evidence (INFO) ──
try {
  const { criteria } = await import("../../evals/duplex-real/criteria.mjs");
  const R = (f) => { const p = new URL(`../../evals/duplex-real/results/${f}`, import.meta.url); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null; };
  const rows = criteria({ e1: R("eot-MAI-after.json"), e1d4: R("eot-D4-after.json"), e2: R("ami-raw-D4-after-real.json"), shadow: null });
  for (const r of rows) console.log(`INFO criterion ${r.id} ${r.pass === null ? "NO VERDICT" : r.pass ? "MET" : "NOT MET"}: ${r.what} = ${r.value} (n ${r.n}) bar ${r.bar}`);
  if (!rows.length) warn("evidence: no result files found under evals/duplex-real/results");
} catch (e) {
  warn(`evidence: ${e.message}`);
}
done();
