// Overlap feature probe (TRAIN + DEV only): what the device knows 100-300 ms into a voiced burst over her, per class
// (F7 barge-in, F8 continuer, F9 background, F12 echo). Used to design the fast-yield rule; never run on TEST.
//   TAXILA_FDB_STREAMS=<dir> node evals/p1-duplex/overlap-probe.mjs > /tmp/probe.json
import fs from "node:fs";
import path from "node:path";
import { listStreams, loadStream, runStream, STREAMS } from "../duplex/taxilafdb/world.mjs";
import { RulesEngine } from "../../src/duplex/engineRules.ts";

const lanes = (process.argv[2] || "FAST,D4").split(",");
const ids = listStreams().filter((id) => {
  const m = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")).meta;
  return (m.split === "train" || m.split === "dev") && ["F7", "F8", "F9", "F12"].includes(m.family);
});
const rows = [];
for (const id of ids) {
  const d = loadStream(id);
  for (const lane of lanes) {
    const samples = [];
    const engine = () => {
      const e = new RulesEngine({ supportsProbe: lane !== "FAST" });
      const tick = e.tick.bind(e);
      e.tick = (t) => {
        if (t.overlap && (t.phase === "overlap" || t.phase === "her_turn")) {
          const o = t.overlap, c = t.child;
          samples.push({ t: t.t, dur: Math.round(o.durMs), voicing: c.voicing, lvl: o.levelOverEchoDb === null ? null : +o.levelOverEchoDb.toFixed(1), f0rel: o.onsetF0Rel === null ? null : +o.onsetF0Rel.toFixed(2),
            bnd: o.atHerBoundary, yn: o.herAskedYesNo, echo: o.echoLikelihood, words: o.words, lk: o.lexicalKind, db: +c.prosody.energyDb.toFixed(1), slope: c.prosody.f0SlopeStPerS, f0: c.prosody.f0Hz, run: c.voicedRunMs });
        }
        return tick(t);
      };
      return e;
    };
    const r = await runStream(d, { name: "probe", lane, engine });
    const ov = d.sc.gold.overlap;
    rows.push({ id, lane, fam: d.sc.family, sub: d.sc.sub, kind: ov?.kind ?? null, expected: ov?.expected ?? null, onset: r.g.childOnset ?? r.g.overlays[0]?.start ?? null,
      yields: r.yields, samples });
  }
}
process.stdout.write(JSON.stringify(rows));
