// Round 5 (main 2026-10-21, the owner's failure census F5): the EMPTY child turns the live D5 lane posts, and whether a
// child was speaking behind each. An empty commit reaches the server as "" with asrConfidence 0 → cls.source "empty" →
// isSilentTurn (server/director/state.js): the silence hold, and in 14.4's safeguard check-in a second silence escalates to
// the full helpline script. So an empty turn the child did not leave silent is a false silence. Per empty commit:
//   hold_offer   the floor's own offer after "wait" (cut_in hold_offer): the server reads it as a hold check-in, not silence
//   unheard      the ear's item covered the child's speech (gold childSegs overlap ≥ 150 ms) and returned no words
//   echo         the item covered only her playback (gold herSpan): her echo opened an item — a phantom
//   noise        the item covered neither — a phantom (room, breath, a door)
//   no_item      no ear item behind it — a phantom made by the engine
// Reads arms-d5 runs (audio times a0/a1 on the stream clock = the scenario clock; the VAD's 300 ms pre-roll is allowed).
//   node evals/duplex-2026-10/phantom-empty.mjs --bake <dir> --arms pe0 --variants owner,phone [--out f.json]
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARMS = arg("--arms", "pe0").split(","), VARS = arg("--variants", "owner").split(",");
const PRE_ROLL = 300, MIN_CHILD = 150;
const overlap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

export function classify(run, meta) {
  const items = new Map();
  for (const e of run.stt) {
    if (!e.item) continue;
    const it = items.get(e.item) ?? { id: e.item };
    if (e.type === "input_audio_buffer.speech_started" && e.a0 !== undefined) it.a0 = e.a0 + PRE_ROLL;
    if (e.type === "input_audio_buffer.speech_stopped" && e.a1 !== undefined) it.a1 = e.a1;
    if (/transcription\.(completed|failed)$/.test(e.type)) { it.final = e.t; it.text = String(e.text ?? "").trim(); it.failed = e.type.endsWith("failed"); }
    items.set(e.item, it);
  }
  const out = [];
  const commits = run.acts.filter((a) => a[1] === "commit");
  for (const a of commits) {
    if (String(a[2] ?? "").trim()) continue;
    const reason = a[3] ?? null;
    const unheardFlag = a[6] === true;
    if (reason === "cut_in:hold_offer") { out.push({ t: a[0], reason, kind: "hold_offer", unheardFlag }); continue; }
    // the ear item behind it: the latest EMPTY final before the commit
    const it = [...items.values()].filter((x) => x.final !== undefined && x.final <= a[0] && !x.text).sort((x, y) => y.final - x.final)[0];
    if (!it || it.a0 === undefined || it.a1 === undefined) { out.push({ t: a[0], reason, kind: "no_item", unheardFlag }); continue; }
    const child = meta.gold.childSegs.reduce((s, c) => s + overlap(it.a0, it.a1, c.start, c.end), 0);
    const her = meta.gold.herSpan ? overlap(it.a0, it.a1, meta.gold.herSpan.start, meta.gold.herSpan.end) : 0;
    out.push({ t: a[0], reason, kind: child >= MIN_CHILD ? "unheard" : her > 0 ? "echo" : "noise", a0: it.a0, a1: it.a1, childMs: Math.round(child), herMs: Math.round(her), failed: !!it.failed, unheardFlag });
  }
  return { commits: commits.length, empty: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = [];
  const byVar = {};
  for (const arm of ARMS) for (const v of VARS) {
    const files = fs.readdirSync(path.join(BAKE, "runs")).filter((x) => x.startsWith(`${arm}.${v}.`));
    const agg = { runs: files.length, commits: 0, empty: 0, kinds: {} };
    for (const f of files) {
      const run = JSON.parse(fs.readFileSync(path.join(BAKE, "runs", f), "utf8"));
      const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${run.id}.json`), "utf8"));
      const c = classify(run, meta);
      agg.commits += c.commits; agg.empty += c.empty.length;
      for (const e of c.empty) { agg.kinds[e.kind] = (agg.kinds[e.kind] ?? 0) + 1; all.push({ arm, variant: v, id: run.id, sub: meta.sub, ...e }); }
    }
    // read as SILENCE by the server: every empty commit but the hold offer and a turn marked unheard (census F5 fix)
    agg.readAsSilence = all.filter((e) => e.arm === arm && e.variant === v && e.kind !== "hold_offer" && !e.unheardFlag).length;
    agg.markedUnheard = all.filter((e) => e.arm === arm && e.variant === v && e.unheardFlag).length;
    // a child who spoke, read as silence: the false silence the check-in tier would count
    agg.falseSilence = all.filter((e) => e.arm === arm && e.variant === v && e.kind === "unheard" && !e.unheardFlag).length;
    agg.phantom = (agg.kinds.echo ?? 0) + (agg.kinds.noise ?? 0) + (agg.kinds.no_item ?? 0);
    byVar[`${arm}.${v}`] = agg;
  }
  for (const e of all) console.log(`${e.arm}.${e.variant} ${e.id} (${e.sub}) t=${e.t} ${e.kind}${e.childMs !== undefined ? ` child=${e.childMs} her=${e.herMs}` : ""} ${e.reason ?? ""}`);
  console.log(JSON.stringify(byVar, null, 1));
  const out = arg("--out");
  if (out) fs.writeFileSync(out, JSON.stringify({ method: { date: new Date().toISOString().slice(0, 10), arms: ARMS, variants: VARS, preRollMs: PRE_ROLL, minChildMs: MIN_CHILD }, byVar, rows: all }, null, 1));
}
