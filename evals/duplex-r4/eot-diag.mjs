// duplex r4: WHY each thinking pause >= 500 ms is still cut. Replays the recorded real-STT events (as eot-replay.mjs) with
// the engine's tick wrapped, and prints, for every commit that lands inside a hold, the covered words, the pause class,
// the markers and the silence at the SPEAK. Diagnostic only (REAL RECORDED ADULT SPEECH, eot-bench Hindi CC BY 4.0).
//   node evals/duplex-r4/eot-diag.mjs <eot_dir> --rec eot-MAI-after [--cache dir] [--all]  (--all: every turn end too)
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../duplex-real/lib.mjs";
import { replayAll } from "../duplex-real/eot-replay.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const rules = await import(ROOT + "src/duplex/engineRules.ts");
const speaks = [];
const orig = rules.RulesEngine.prototype.tick;
rules.RulesEngine.prototype.tick = function (input) {
  const d = orig.call(this, input);
  if (d.action === "SPEAK" || d.action === "CUT_IN") {
    const m = input.markers;
    speaks.push({ t: input.t, act: d.action, why: d.detail?.reason, text: input.transcript.text, cls: rules.pauseClass(input), sil: input.child.silenceRunMs,
      unseen: input.transcript.unseenVoicedMs, end: m.endShape, cue: m.cue, values: m.values?.length, form: m.form, lexP: +(+m.lexP).toFixed(2), pc: +d.pComplete.toFixed(2), ph: +d.pHoldWanted.toFixed(2), ex: input.context.exchange });
  }
  return d;
};
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const dir = argv[0];
const rec = path.join(ROOT, "evals/duplex-real/results", `${opt("--rec", "eot-MAI-after")}.stt.json.gz`);
// one shard per session so the speaks list stays in session order (replayAll runs shards concurrently: conc 1)
const { per } = await replayAll({ dir, rec, shards: 8, cacheDir: opt("--cache", null), DuplexLive, conc: 1 });
const { buildSession } = await import(ROOT + "evals/duplex-real/eot.mjs");
const rows = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8")).rows.slice(0, 400);
// split the speaks by session (the clock restarts at 0 for each shard; shards ran one at a time)
const bySession = [[]];
for (const s of speaks) { const cur = bySession.at(-1); if (cur.length && s.t < cur.at(-1).t) bySession.push([]); bySession.at(-1).push(s); }
const per8 = Math.ceil(rows.length / 8);
const out = [];
for (let sh = 0; sh < 8; sh++) {
  const S = buildSession(dir, rows.slice(sh * per8, (sh + 1) * per8));
  const sp = bySession[sh] ?? [];
  for (const tr of S.turns) {
    const row = rows.find((r) => r.id === tr.id);
    tr.spans.slice(0, -1).forEach(([a, b], k) => {
      if (b - a < 500) return;
      const hit = sp.find((s) => s.t > a + 20 && s.t < b);
      if (!hit) return;
      const ra = row.spans[k][0], rb = row.spans[k][1];
      out.push({ id: tr.id, hold: b - a, at: Math.round(hit.t - a), before: row.words.filter((w) => w[1] <= ra + 50).map((w) => w[2]).slice(-6).join(" "), after: row.words.filter((w) => w[0] >= rb - 50).map((w) => w[2]).slice(0, 4).join(" "), ...hit, t: undefined });
    });
    if (argv.includes("--all")) { const e = sp.find((s) => s.t >= tr.end - 200 && s.t < tr.windowEnd); if (e) out.push({ id: tr.id, END: true, gap: Math.round(e.t - tr.end), ...e, t: undefined }); }
  }
}
if (opt("--json", null)) fs.writeFileSync(opt("--json"), JSON.stringify(out));
for (const o of out.filter((o) => !o.END)) console.log(JSON.stringify(o));
console.log(JSON.stringify({ speaks: speaks.length, turns: per.length, cutHolds: out.filter((o) => !o.END).length }));
