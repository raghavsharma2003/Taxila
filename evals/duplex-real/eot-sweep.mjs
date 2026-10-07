// duplex-real E1 SWEEP: the open-turn silence wait (config.ts OPEN_TURN_WAIT) and the copula projection cue
// (server/duplex/understand.js LEX_OPTS) on the recorded real-STT runs of BOTH lanes, scored on the TRAIN half of
// eot-bench Hindi (even row ids) so the choice never sees TEST (odd ids). Prints one row per variant and lane.
//   node evals/duplex-real/eot-sweep.mjs <eot_dir> --cache <frames dir> [--split train|test|all] [--grid default|final]
import path from "node:path";
import { loadEnv, ROOT } from "./lib.mjs";
import { replayAll } from "./eot-replay.mjs";
import { aggregate } from "./eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const { OPEN_TURN_WAIT } = await import(ROOT + "src/duplex/config.ts");
const { LEX_OPTS } = await import(ROOT + "server/duplex/understand.js");
const { contextFromUi } = await import(ROOT + "src/duplex/live.ts");
const HERE = path.dirname(new URL(import.meta.url).pathname);
const dir = argv[0], cache = opt("--cache", null), split = opt("--split", "train");
const idx = JSON.parse((await import("node:fs")).readFileSync(path.join(argv[0], "index.json"), "utf8")).rows;
/** The engine context each turn starts in (her previous line's shape; no Director ui in this corpus). */
export const ctxOf = new Map(idx.map((r) => { const c = contextFromUi({}, (r.herPrev || "जी, बताइए।").slice(0, 400), "B4"); return [r.id, c.exchange + (c.expected ? `:${c.expected.form}` : "")]; }));
const inSplit = (id) => split === "all" || (parseInt(id.replace(/\D/g, ""), 10) % 2 === 0) === (split === "train");
const GRIDS = {
  default: [
    { name: "none", w: [0, 0, 0], cop: false },
    { name: "copula", w: [0, 0, 0], cop: true },
    ...[300, 500, 700, 900, 1100].map((w) => ({ name: `u${w}+cop`, w: [w, w, w], cop: true })),
    ...[[300, 600, 1000], [500, 900, 1400]].map((w) => ({ name: `w${w.join("/")}+cop`, w, cop: true })),
  ],
  final: [{ name: "none", w: [0, 0, 0], cop: false }, { name: "chosen", w: null, cop: true }],
};
const grid = GRIDS[opt("--grid", "default")];
const rows = [];
for (const lane of (opt("--lanes", "D4,MAI")).split(",")) {
  for (const v of grid) {
    const saved = { ...OPEN_TURN_WAIT };
    if (v.w) [OPEN_TURN_WAIT.prosodyFinal, OPEN_TURN_WAIT.neutral, OPEN_TURN_WAIT.prosodyContinue] = v.w;
    LEX_OPTS.copulaProjection = v.cop;
    const { per } = await replayAll({ dir, rec: path.join(HERE, "results", `eot-${lane}-before.stt.json.gz`), shards: 8, cacheDir: cache, DuplexLive });
    Object.assign(OPEN_TURN_WAIT, saved);
    const a = aggregate(per.filter((p) => inSplit(p.id)));
    const r = { lane, split, variant: v.name, wait: v.w ?? [OPEN_TURN_WAIT.prosodyFinal, OPEN_TURN_WAIT.neutral, OPEN_TURN_WAIT.prosodyContinue], turns: a.turns,
      cut500: `${a.pauseCutoff_500.k}/${a.pauseCutoff_500.n} ${(100 * a.pauseCutoff_500.rate).toFixed(1)}%`, cutAll: `${a.pauseCutoff_all100.k}/${a.pauseCutoff_all100.n}`,
      inSpeech: a.inSpeechCommits, turnsCut: `${(100 * a.turnsWithAnyCutoff.rate).toFixed(1)}%`, gapP50: a.decisionGap.p50, gapP90: a.decisionGap.p90, missed: a.decisionGap.missed,
      within350: a.decisionGap.within350,
      byCtx: Object.fromEntries([...new Set(per.map((p) => ctxOf.get(p.id)))].map((k) => { const b = aggregate(per.filter((p) => inSplit(p.id) && ctxOf.get(p.id) === k)); return [k, `cut ${b.pauseCutoff_500.k}/${b.pauseCutoff_500.n} gap ${b.decisionGap.p50}`]; })),
      byReason: a.gapByReason.map((x) => `${x.why}:${x.n}@${x.p50}`).join(" ") };
    rows.push(r);
    console.log(JSON.stringify(r));
  }
}
LEX_OPTS.copulaProjection = true;
