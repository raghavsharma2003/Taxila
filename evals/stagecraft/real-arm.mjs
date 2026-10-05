// E-ST4: the small real-build arm (STAGECRAFT.md §7.2). The ONLY Stagecraft eval that spends money.
// Question: do 3-wide concurrent specs + flare-low images + live races meet their p90 under real Foundry load WITHOUT
// hurting the reply lane? Everything goes through the production builders (server/stagecraft/builders.js) and the real
// Studio race (server/studio/build.js buildRace + the local gate), on Foundry Direct deployments only.
//
//   phase A  reply-lane baseline: streamed replies on taxila-fast (effort none, ≤ 80 tokens), no Stagecraft load
//   phase B  the same reply load WHILE: 20 turns × 3 concurrent generated specs (alternating taxila-fast-bg and
//            taxila-gpt6-luna), flare-low images (serial, ≥ 16 s apart: 4 RPM subscription-wide), live races (2 at a time)
//
// Writes evals/stagecraft/results/real-arm-<date>.json and evals/stagecraft/calibration.json (the simulator's CDFs).
// Never prints a key; prompts carry kit ids and kit text only (no child words). Spend guard: --max-usd (default 6).
//   STUDIO_QA_LOCAL=1 NODE_USE_ENV_PROXY=1 node evals/stagecraft/real-arm.mjs [--turns 20] [--images 10] [--races 12] [--replies 30]
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "../live-studio/models.mjs";
loadEnv();
process.env.STUDIO_QA_LOCAL = process.env.STUDIO_QA_LOCAL ?? "1";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const TURNS = +arg("turns", 20), IMAGES = +arg("images", 10), RACES = +arg("races", 12), REPLIES = +arg("replies", 30), MAX_USD = +arg("max-usd", 6);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const DATE = new Date().toISOString().slice(0, 10);

const azure = await import("../../server/azure.js");
const { laneEndpoint, laneKey } = await import("../../server/endpoints.js");
const S = await import("../../shared/studio-spec.ts");
const { createBuilders } = await import("./../../server/stagecraft/builders.js");
const { buildRace } = await import("../../server/studio/build.js");
const { routeFor } = await import("../../server/studio/router.js");
const { localGate } = await import("../../server/studio/qa/pool.js");
const { archetype } = await import("../../server/studio/archetypes/index.js");
const { setSink } = await import("../../server/studio/telemetry.js");
setSink(() => {});
const keepAlive = setInterval(() => {}, 1000);
const origInfo = console.info; console.info = () => {};          // azure.js logs one line per call (no keys); keep the run readable

let usd = 0;
const spend = (x) => { usd += x || 0; };
const q = (xs, p) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const usdOf = (dep, u) => azure.usdOf(dep.replace(/-bg$/, ""), u);
const builders = createBuilders({ chat: azure.chat, usdOf, normUsage: azure.normUsage });

// ── the reply lane probe ──
const REPLY_MSGS = [
  { role: "system", content: "You are a warm Hinglish maths teacher for a class 6 child. Reply in at most 25 words, end on a short question." },
  { role: "user", content: "Mujhe lagta hai 3/8 bada hai 3/4 se kyunki 8 bada hai." },
];
async function replyCall() {
  const t0 = performance.now();
  try {
    const r = await azure.chatStream(azure.DEPLOY.reply, REPLY_MSGS, { effort: "none", maxTokens: 80, quotaLane: "hot", timeoutMs: 30_000, stallMs: 15_000, kind: "stagecraft_reply_probe" });
    spend(r.usd);
    return { ok: true, ttftMs: r.ttftMs, ms: Math.round(performance.now() - t0) };
  } catch (e) { return { ok: false, status: e?.status ?? 0, code: String(e?.code ?? e?.message ?? e).slice(0, 40) }; }
}
async function replyLoad(n, conc = 2) {
  const rows = []; let next = 0;
  await Promise.all(Array.from({ length: conc }, async () => { while (next < n) { next++; rows.push(await replyCall()); await new Promise((r) => setTimeout(r, 400)); } }));
  return rows;
}

// ── generated specs through the production builder ──
const TOPICS = Object.entries(S.ENGINE_SPECS).flatMap(([a, d]) => d.outcomes.topics.map((t) => ({ a, t, mis: d.outcomes.misconceptions.find((m) => m.startsWith(t)) ?? null })));
async function specBuild(i, dep) {
  const pick = TOPICS[(i * 7) % TOPICS.length];
  const need = i % 3 === 0 && pick.mis ? "contrast_misconception" : i % 3 === 1 ? "practice" : "explain";
  const c = { id: `real:${i}`, archetype: pick.a, kind: S.ENGINE_SPECS[pick.a].kind, need, premise: { misconceptionId: need === "contrast_misconception" ? pick.mis : null } };
  const key = { lessonId: "real-arm", topicId: pick.t, skillId: `${pick.t}-s1`, band: "B3", lang: "hinglish", beat: "explain" };
  const t0 = performance.now();
  try {
    const r = await builders.generatedSpec(c, dep, undefined, key);
    spend(r.usd);
    return { i, dep, archetype: pick.a, need, ms: Math.round(performance.now() - t0), ok: r.ok, usd: +(r.usd ?? 0).toFixed(6), why: r.why ?? null };
  } catch (e) { return { i, dep, archetype: pick.a, need, ms: Math.round(performance.now() - t0), ok: false, status: e?.status ?? 0, error: String(e?.code ?? e?.message ?? e).slice(0, 60) }; }
}

// ── images: text-free art on the image lane, flare low → gpt-image-2 low on a 429 ──
async function imageCall(dep, prompt) {
  const t0 = performance.now();
  const res = await fetch(`${laneEndpoint("IMAGE")}/images/generations`, { method: "POST", headers: { "api-key": laneKey("IMAGE"), "content-type": "application/json" },
    body: JSON.stringify({ model: dep, prompt, n: 1, size: "1024x1024", quality: "low" }) });
  const ms = Math.round(performance.now() - t0);
  if (!res.ok) { await res.text().catch(() => ""); return { ok: false, status: res.status, ms }; }
  const j = await res.json();
  return { ok: !!j?.data?.[0]?.b64_json, status: 200, ms, bytes: Math.round((j?.data?.[0]?.b64_json?.length ?? 0) * 0.75) };
}
async function imageLane(n) {
  const rows = [];
  for (let i = 0; i < n && usd < MAX_USD; i++) {
    const prompt = "Children's picture-book watercolour of a sunny Indian courtyard with potted plants and a water pot, warm palette, plain background, absolutely no text, letters, numbers or symbols.";
    const tStart = performance.now();
    let r = await imageCall("taxila-image25-flare", prompt).catch((e) => ({ ok: false, status: 0, ms: 0, error: String(e?.message).slice(0, 40) }));
    let dep = "taxila-image25-flare", failover = false;
    if (!r.ok && (r.status === 429 || r.status >= 500)) { failover = true; dep = "taxila-image"; r = await imageCall(dep, prompt).catch((e) => ({ ok: false, status: 0, ms: 0, error: String(e?.message).slice(0, 40) })); }
    if (r.ok) spend(0.0066);
    rows.push({ i, dep, failover, ok: r.ok, status: r.status, ms: r.ms, totalMs: Math.round(performance.now() - tStart) });
    console.log(`image ${i} ${dep} ${r.status} ${r.ms} ms${failover ? " (failover)" : ""}`);
    await new Promise((res) => setTimeout(res, 16_000));
  }
  return rows;
}

// ── live races through the real Studio race + local gate ──
const G = JSON.parse(fs.readFileSync(path.join(HERE, "../live-studio/goldens/goldens.json"), "utf8"));
const LIVE = Object.keys(G).filter((id) => routeFor(id).live);
async function races(n, conc = 2) {
  const gate = localGate({ concurrency: 2 });
  const rows = []; let next = 0;
  await Promise.all(Array.from({ length: conc }, async () => {
    while (next < n && usd < MAX_USD) {
      const i = next++, id = LIVE[i % LIVE.length], g = G[id], which = i % 2 && g.alt ? "alt" : "params";
      const plan = { planId: `stagecraft-real:${i}`, intentId: `stagecraft-real:${i}`, archetype: id, kind: archetype(id).kind, skeleton: archetype(id).skeleton, params: g[which],
        strings: g[`${which}Strings`] ?? g.strings, craft: { mood: "warm", motion: "lively" }, teacherCue: "", seam: {}, checks: [], budgets: { bytes: 60000, ms: 90000 } };
      let r;
      try { r = await buildRace(plan, { band: g.band ?? "B3", gate: (job) => gate.gate(job), deadlineMs: 180_000 }); }
      catch (e) { r = { ok: false, records: [], ms: 0, usd: 0, reason: String(e?.message ?? e).slice(0, 60) }; }
      spend(r.usd);
      const row = { i, archetype: id, ok: r.ok, ms: r.ms, toPlayableMs: r.ok ? r.winner?.record?.timings?.toPlayableMs ?? r.ms : null, usd: r.usd, reason: r.reason, winner: r.winner?.arm ?? null };
      rows.push(row);
      console.log(`race ${i} ${id} ${r.ok ? "PASS " + row.winner : "FAIL " + r.reason} ${r.ms} ms $${r.usd}`);
    }
  }));
  await gate.close();
  return rows;
}

// ── run ──
console.log(`E-ST4: turns ${TURNS} × 3 specs, ${IMAGES} images, ${RACES} races, ${REPLIES} reply probes per phase; spend guard $${MAX_USD}`);
const A = await replyLoad(REPLIES);
console.log(`phase A reply TTFT p50 ${q(A.filter((r) => r.ok).map((r) => r.ttftMs), 0.5)} ms (n ${A.length})`);
const specRows = [];
const specTurns = (async () => {
  for (let t = 0; t < TURNS && usd < MAX_USD; t++) {
    const dep = t % 2 ? "taxila-gpt6-luna" : "taxila-fast-bg";
    const rows = await Promise.all([0, 1, 2].map((j) => specBuild(t * 3 + j, dep)));
    specRows.push(...rows);
    console.log(`turn ${t} ${dep}: ${rows.map((r) => `${r.ok ? "ok" : "x"}:${r.ms}`).join(" ")}  $${usd.toFixed(3)}`);
    await new Promise((r) => setTimeout(r, 2500));
  }
})();
const imgP = imageLane(IMAGES);
const raceP = races(RACES);
const B = await replyLoad(REPLIES);
await specTurns;
const imgRows = await imgP;
const raceRows = await raceP;
clearInterval(keepAlive);
console.info = origInfo;

const summ = (rows, dep) => { const r = rows.filter((x) => !dep || x.dep === dep); const ok = r.filter((x) => x.ok); return { n: r.length, valid: ok.length, p50: q(r.filter((x) => x.ms && !x.status).map((x) => x.ms), 0.5), p90: q(r.filter((x) => x.ms && !x.status).map((x) => x.ms), 0.9), usd: +r.reduce((a, x) => a + (x.usd ?? 0), 0).toFixed(4), errors: r.filter((x) => x.status).map((x) => x.status) }; };
const replyStats = (rows) => ({ n: rows.length, ok: rows.filter((r) => r.ok).length, p50: q(rows.filter((r) => r.ok).map((r) => r.ttftMs), 0.5), p90: q(rows.filter((r) => r.ok).map((r) => r.ttftMs), 0.9), r429: rows.filter((r) => r.status === 429).length });
const out = {
  date: DATE, method: "server/stagecraft/builders.js generatedSpec (JSON mode, effort low, kit-slice prompt, validateSpec; ok = not fallen back) 3-wide per turn alternating deployments; flare-low 1024 serial ≥16 s apart with gpt-image-2 low failover; buildRace + local gate, 2 concurrent; reply probe chatStream taxila-fast effort none ≤80 tok, 2 concurrent, phase A alone vs phase B under all Stagecraft load",
  spend: +usd.toFixed(4),
  specs: { all: summ(specRows), "taxila-fast-bg": summ(specRows, "taxila-fast-bg"), "taxila-gpt6-luna": summ(specRows, "taxila-gpt6-luna"), rows: specRows },
  images: { n: imgRows.length, ok: imgRows.filter((r) => r.ok).length, p50: q(imgRows.filter((r) => r.ok).map((r) => r.ms), 0.5), p90: q(imgRows.filter((r) => r.ok).map((r) => r.ms), 0.9), r429: imgRows.filter((r) => r.status === 429 || r.failover).length, rows: imgRows },
  races: { n: raceRows.length, ok: raceRows.filter((r) => r.ok).length, p50: q(raceRows.filter((r) => r.ok).map((r) => r.toPlayableMs), 0.5), p90: q(raceRows.filter((r) => r.ok).map((r) => r.toPlayableMs), 0.9), usd: +raceRows.reduce((a, r) => a + (r.usd ?? 0), 0).toFixed(4), rows: raceRows },
  reply: { A: replyStats(A), B: replyStats(B) },
};
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
fs.writeFileSync(path.join(HERE, "results", `real-arm-${DATE}.json`), JSON.stringify(out, null, 1));
// the simulator's calibration (only rungs measured here; the rest stay config.js BUILD_MS)
const cal = { date: DATE, source: `evals/stagecraft/results/real-arm-${DATE}.json`, generated_spec: { _default: { p50: out.specs.all.p50, p90: out.specs.all.p90 } },
  ...(out.images.p50 ? { image: { p50: out.images.p50, p90: out.images.p90 } } : {}), ...(out.races.p50 ? { live_codegen: { _default: { p50: out.races.p50, p90: out.races.p90 } } } : {}) };
fs.writeFileSync(path.join(HERE, "calibration.json"), JSON.stringify(cal, null, 1));
console.log(JSON.stringify({ spend: out.spend, specs: { all: out.specs.all, fastbg: out.specs["taxila-fast-bg"], luna: out.specs["taxila-gpt6-luna"] }, images: { ...out.images, rows: undefined }, races: { ...out.races, rows: undefined }, reply: out.reply }, null, 1));
process.exit(0);
