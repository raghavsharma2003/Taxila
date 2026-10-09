// duplex r3: split an eot-bench replay result by the engine's exchange context at the turn end (read from the pause table):
// free (her line was not a question), open_explanation (her open wh-question: wait time II by design), question_to_her,
// closed_answer (her yes/no question, short answer). REAL-ADULT; the tutor's contexts come from the Director, not her text.
//   node evals/duplex-r3/by-context.mjs <table.json.gz> <result.json> [...]
import fs from "node:fs";
import { loadTable } from "./eot-policy.mjs";
import { endEpisode } from "./eot-sem-ceiling.mjs";
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return Math.round(z[Math.floor((z.length - 1) * p)]); };
const T = loadTable(process.argv[2]);
const ctx = new Map();
for (const S of T.sessions) for (const tr of S.turns) { const e = endEpisode(S, tr); const r = e?.rows.find((x) => x.text && x.unseen <= 120) ?? e?.rows.at(-1); if (r) ctx.set(tr.id, r.exchange); }
for (const f of process.argv.slice(3)) {
  const R = JSON.parse(fs.readFileSync(f, "utf8"));
  const by = {};
  for (const p of R.perTurn) { const k = ctx.get(p.id) ?? "unknown"; (by[k] ??= []).push(p); }
  for (const [k, ps] of Object.entries(by)) {
    const g = ps.map((p) => p.gap).filter((x) => x !== null), h = ps.flatMap((p) => p.holds.filter((x) => x.ms >= 500));
    console.log(f.split("/").pop().padEnd(22), k.padEnd(17), `turns ${String(ps.length).padStart(3)}  cut500 ${h.filter((x) => x.cut).length}/${h.length}  gap p50/p90 ${q(g, 0.5)}/${q(g, 0.9)}`);
  }
}
