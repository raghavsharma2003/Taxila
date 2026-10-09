// duplex r3: the TEXT-ONLY CEILING for end of turn on real Hindi pauses. For every annotated thinking pause >= 500 ms and
// every turn end in eot-bench Hindi (real adult speech, the real STT text the engine had at the moment its words first
// covered the audio, from the pause table), ask Azure models, OFFLINE and with no latency budget, "has the speaker finished
// or paused mid-turn?" and measure how well the answer separates the two (AUC; and the cut-off / wait trade-off it would
// buy). It answers one question: is the information in the words at all? If the strongest model cannot separate them,
// no semantic estimator in the loop can, whatever its speed.
//   node evals/duplex-r3/eot-sem-ceiling.mjs <table.json.gz> --cache <answers.json> [--deps grok-4-1-fast-non-reasoning,taxila-fast] [--conc 3]
import fs from "node:fs";
import { loadEnv, ROOT, pool } from "../duplex-real/lib.mjs";
import { loadTable } from "./eot-policy.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

/** The device silence that is the turn's end: the longest one starting within [end - 600, end + 400]. */
export function endEpisode(S, tr) {
  const ee = S.eps.filter((e) => e.offAt >= tr.end - 600 && e.offAt <= tr.end + 400);
  return ee.length ? ee.reduce((x, y) => (y.rows.at(-1).sil > x.rows.at(-1).sil ? y : x)) : null;
}

/** The points: { key, id, label (1 hold, 0 end), text, her, row } at the first covered tick of the episode. */
export function points(T) {
  const out = [];
  for (const S of T.sessions) for (const tr of S.turns) {
    const her = S.her.find((h) => h.end <= tr.start + 10 && h.end > tr.start - 1000);
    const add = (e, label, holdMs) => {
      const r = e.rows.find((x) => x.unseen <= 120 && x.text);
      if (!r) return;
      out.push({ key: `${tr.id}@${e.offAt}`, id: tr.id, label, holdMs, text: r.text, her: her?.text ?? "", row: r });
    };
    for (const [a, b] of tr.spans.slice(0, -1)) {
      if (b - a < 500) continue;
      const eps = S.eps.filter((e) => e.offAt >= a - 400 && e.offAt <= b);
      if (eps.length) add(eps.reduce((x, y) => (y.rows.at(-1).sil > x.rows.at(-1).sil ? y : x)), 1, b - a);
    }
    const ee = endEpisode(S, tr);
    if (ee) add(ee, 0, null);
  }
  return out;
}

// a classifier prompt (never spoken): notes, not lines
const SYSTEM = [
  "Task: turn-taking judgement for a spoken conversation (Hindi / English / Hinglish).",
  "Input: the other party's last line, and the speaker's words so far as a speech recogniser heard them (its punctuation is a guess). The speaker is silent right now.",
  "Question: has the speaker FINISHED their turn (expects a reply now), or paused mid-turn and will go on?",
  'Output JSON only: {"p": n} where n in [0,1] is the probability the turn is finished.',
].join("\n");

export async function ask(dep, p) {
  const { chat } = await import(ROOT + "server/azure.js");
  const words = String(p.text).split(/\s+/).filter(Boolean).slice(-60).join(" ");
  const t0 = performance.now();
  const r = await chat(dep, [{ role: "system", content: SYSTEM }, { role: "user", content: `other party's last line: "${String(p.her).slice(-300)}"\nspeaker's words so far: "${words}"` }], { json: true, maxTokens: 30, effort: "none", timeoutMs: 8000 });
  const v = Number(r.json?.p);
  return { p: Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : null, latMs: Math.round(performance.now() - t0) };
}

export function auc(scores, labels) { // P(score of an END > score of a HOLD), i.e. p(finished) ranks ends above holds
  const e = scores.filter((s, i) => labels[i] === 0 && s !== null), h = scores.filter((s, i) => labels[i] === 1 && s !== null);
  let s = 0; for (const a of e) for (const b of h) s += a > b ? 1 : a === b ? 0.5 : 0;
  return e.length && h.length ? +(s / (e.length * h.length)).toFixed(3) : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  await import(ROOT + "server/net.js");
  const T = loadTable(argv[0]);
  const cacheFile = opt("--cache");
  const cache = cacheFile && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};
  const deps = opt("--deps", "grok-4-1-fast-non-reasoning,taxila-fast").split(",");
  const P = points(T);
  console.log(`points: ${P.length} (holds ${P.filter((p) => p.label).length}, ends ${P.filter((p) => !p.label).length})`);
  for (const dep of deps) {
    const todo = P.filter((p) => !(cache[dep]?.[p.key]?.p >= 0));
    let n429 = 0;
    await pool(todo.map((p) => async () => {
      for (let a = 0; a < 4; a++) {
        try { const r = await ask(dep, p); (cache[dep] ??= {})[p.key] = r; return; }
        catch (e) { if (/429/.test(String(e?.status ?? e?.message))) { n429++; await new Promise((r) => setTimeout(r, 2000 * 2 ** a)); } else { (cache[dep] ??= {})[p.key] = { p: null, err: String(e?.message ?? e).slice(0, 80) }; return; } }
      }
    }), Number(opt("--conc", 3)));
    if (cacheFile) fs.writeFileSync(cacheFile, JSON.stringify(cache));
    const sc = P.map((p) => cache[dep]?.[p.key]?.p ?? null), lb = P.map((p) => p.label);
    const lat = P.map((p) => cache[dep]?.[p.key]?.latMs).filter(Boolean).sort((a, b) => a - b);
    console.log(dep, `answered ${sc.filter((x) => x !== null).length}/${P.length}, 429s ${n429}, AUC ${auc(sc, lb)}, lat p50 ${lat[Math.floor(lat.length / 2)]} ms`);
  }
}
