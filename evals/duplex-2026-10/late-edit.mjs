// Round 5, main's 14.5 measurement for the full undo (dc-r143-edit-full-undo): how often a child's correction reaches the
// server AFTER the turn it corrects has landed, on the live D5 lane at today's R. Reads arms-d5 runs (live Voice Live on
// the owner recordings; evals/duplex-real/lib.mjs records each commit's revoked words):
//   t1     the first commit (the runtime POSTs the turn now; it lands at t1 + L)
//   t2     the merged commit that carries revokeOf = t1's words (the runtime sends it as an EDIT of that turn, same turnSeq)
//   late   t2 − t1 > L: the edit arrives after the turn landed (undo off today: replayed, the landed grade stands, the new
//          words go as a separate turn; undo on: superseded)
//   L      commit → the turn's transaction committed ≈ the /api/lesson/turn time. Given as --land (ms, repeatable list);
//          hold-cost.mjs's `director` column is this sandbox's distribution (--land-from <hold-cost.json> uses it whole)
// A correction the engine kept INSIDE the utterance (no commit before it) is "inside": the turn carries the corrected words.
//   node evals/duplex-2026-10/late-edit.mjs --bake <dir> --arms ce1,ce2 [--variant owner] [--land 1500,2100,2700] [--land-from f.json]
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARMS = arg("--arms", "ce1").split(","), VAR = arg("--variant", "owner");
const LANDS = arg("--land", "1500,2100,2700,3500").split(",").map(Number);
const FROM = arg("--land-from");
const sample = FROM ? JSON.parse(fs.readFileSync(FROM, "utf8")).rows.map((r) => r.director).filter((x) => typeof x === "number") : null;

const rows = [];
for (const arm of ARMS) {
  for (const f of fs.readdirSync(path.join(BAKE, "runs")).filter((x) => x.startsWith(`${arm}.${VAR}.`))) {
    const run = JSON.parse(fs.readFileSync(path.join(BAKE, "runs", f), "utf8"));
    const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${run.id}.json`), "utf8"));
    const p = meta.gold.pauses.find((x) => x.cls === "repair");
    const commits = run.acts.filter((a) => a[1] === "commit");
    const edit = commits.find((a) => a[5]);
    const first = edit ? commits.find((a) => a[2] === edit[5] && a[0] < edit[0]) ?? commits[0] : commits[0];
    rows.push({
      arm, id: run.id, pauseMs: p ? Math.round(p.end - p.start) : null, trueEnd: meta.gold.trueEnd,
      t1: first?.[0] ?? null, t2: edit?.[0] ?? null, gap: edit && first ? edit[0] - first[0] : null,
      // when the child's correction ended, after the first commit: the edit cannot go sooner than this, whatever the ear does
      endAfterCommit: first ? Math.round(meta.gold.trueEnd - first[0]) : null,
      kind: !commits.length ? "no_commit" : edit ? "edit" : first && first[0] < meta.gold.trueEnd - 300 ? "split" : "inside",
      text1: first?.[2] ?? null, text2: edit?.[2] ?? null,
    });
  }
}
const n = rows.length, edits = rows.filter((r) => r.kind === "edit");
const lateAt = (L) => edits.filter((r) => r.gap > L).length;
const summary = {
  runs: n, kinds: Object.fromEntries(["inside", "edit", "split", "no_commit"].map((k) => [k, rows.filter((r) => r.kind === k).length])),
  editGap: edits.map((r) => r.gap).sort((a, b) => a - b),
  late: Object.fromEntries(LANDS.map((L) => [L, lateAt(L)])),
  ...(sample ? { lateShareOverSandboxL: edits.length ? +(edits.reduce((s, r) => s + sample.filter((L) => r.gap > L).length / sample.length, 0) / edits.length).toFixed(3) : null, sandboxL: { n: sample.length, p50: [...sample].sort((a, b) => a - b)[Math.floor(sample.length / 2)] } } : {}),
};
for (const r of rows) console.log(`${r.arm} ${r.id} pause=${r.pauseMs} ${r.kind}${r.gap !== null ? ` gap=${r.gap}` : ""} endAfterCommit=${r.endAfterCommit} "${r.text1}"${r.text2 ? ` → "${r.text2}"` : ""}`);
console.log(JSON.stringify(summary, null, 1));
const out = arg("--out");
if (out) fs.writeFileSync(out, JSON.stringify({ method: { date: new Date().toISOString().slice(0, 10), arms: ARMS, variant: VAR, lands: LANDS }, summary, rows }, null, 1));
