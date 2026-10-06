// VALUES-100 V3.1 coverage, honestly counted (ship5 p4-content): for every class 4-7 topic in data/kits (385), does the
// shipped catalogue (data/studio-catalogue, re-validated by server/stagecraft/catalogue.js: validator without fallback,
// code-checked kit ids, blind cross-check "pass") hold a real-time game or simulation, a scene explainer, and a whiteboard
// plan for EVERY explanation beat? Nothing here calls a model.
//   node evals/p4-content/coverage.mjs [--write]   → prints the counts; --write saves evals/p4-content/results/coverage-<date>.json
import fs from "node:fs";
import path from "node:path";
import { loadCatalogue } from "../../server/stagecraft/catalogue.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const SUBJECTS = ["maths", "science", "evs", "sst", "english", "hindi"];

export function allTopics() {
  const out = [];
  for (const s of SUBJECTS) for (const c of [4, 5, 6, 7]) {
    const p = path.join(ROOT, `data/kits/c${c}-${s}.json`);
    if (!fs.existsSync(p)) continue;
    for (const t of JSON.parse(fs.readFileSync(p, "utf8")).topics ?? []) out.push({ topicId: t.topicId, subject: s, cls: c });
  }
  return out;
}

export function coverageReport() {
  const cat = loadCatalogue({ fresh: true });
  const rows = allTopics().map((t) => {
    const e = cat.get(t.topicId);
    const boardsAll = !!e && e.status.boardsTotal > 0 && e.status.boards === e.status.boardsTotal;
    return { ...t, game: !!e?.game, explainer: !!e?.explainer, boards: boardsAll, boardsOk: e?.status.boards ?? 0, boardsTotal: e?.status.boardsTotal ?? 0,
      status: e?.status ?? { game: "missing", explainer: "missing", check: "missing" } };
  });
  const by = (f) => rows.filter(f).length;
  const why = {};
  for (const r of rows) for (const k of ["game", "explainer"]) if (!r[k]) { const w = `${k}:${r.status[k]}`; why[w] = (why[w] ?? 0) + 1; }
  const perSubject = {};
  for (const s of SUBJECTS) { const xs = rows.filter((r) => r.subject === s); perSubject[s] = { topics: xs.length, all3: xs.filter((r) => r.game && r.explainer && r.boards).length }; }
  return {
    total: rows.length,
    counts: { game: by((r) => r.game), explainer: by((r) => r.explainer), boards: by((r) => r.boards), all3: by((r) => r.game && r.explainer && r.boards),
      excluded: by((r) => r.status.game === "safety_excluded"), checkPass: by((r) => r.status.check === "pass") },
    perSubject, why,
    missing: rows.filter((r) => !(r.game && r.explainer && r.boards)).map((r) => ({ topicId: r.topicId, game: r.status.game, explainer: r.status.explainer, boards: `${r.boardsOk}/${r.boardsTotal}`, check: r.status.check })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const c = coverageReport();
  console.log(JSON.stringify({ total: c.total, counts: c.counts, perSubject: c.perSubject, why: c.why }, null, 1));
  if (process.argv.includes("--write")) {
    const f = path.join(ROOT, `evals/p4-content/results/coverage-${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), method: "evals/p4-content/coverage.mjs over data/studio-catalogue via server/stagecraft/catalogue.js (code re-validation; blind cross-check verdict pass required)", ...c }, null, 1));
    console.log(f);
  }
}
