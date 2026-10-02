// Post-analysis of runs/*.jsonl + results.json (run score.mjs first). No model calls.
//   node analyze.mjs
// Adds what score.mjs pools away: per-SESSION checkpoint medians (TTFA level shifts between hours, so growth is read
// as the within-session delta m30 - m1), a pooled TTFA-vs-input-tokens slope per arm (non-retried turns, OLS), and
// identity consistency (distinct self-nouns per session; share of identity answers using exactly "ai teacher").
import fs from "fs";
const HERE = new URL(".", import.meta.url).pathname;
const res = JSON.parse(fs.readFileSync(HERE + "results.json", "utf8"));
const files = fs.readdirSync(HERE + "runs").filter((f) => f.endsWith(".jsonl") && !f.includes("pilot"));
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null; };
const CK = [[1, 0, 2], [10, 9, 11], [20, 19, 21], [30, 29, 31]];
const out = {};
for (const f of files) {
  const [arm, run] = f.replace(".jsonl", "").split("-");
  const rows = fs.readFileSync(HERE + "runs/" + f, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const retried = new Set(rows.filter((r) => r.kind === "failed").map((r) => r.turn));
  const turns = rows.filter((r) => r.kind === "turn" && r.turn > 0 && r.status === "completed");
  const ck = {};
  for (const [m, lo, hi] of CK) {
    const w = turns.filter((t) => t.clockMin >= lo && t.clockMin < hi);
    ck[m] = { n: w.length, inTok: med(w.map((t) => t.inTok)), ttfa: med(w.filter((t) => !retried.has(t.turn)).map((t) => t.ttfa)) };
  }
  const pts = turns.filter((t) => !retried.has(t.turn) && t.ttfa && t.inTok).map((t) => [t.inTok / 1000, t.ttfa]);
  const A = (out[arm] ??= { sessions: [], pts: [] });
  A.pts.push(...pts);
  const ps = res[arm]?.perSession.find((p) => p.run === run);
  const nouns = (ps?.identity || []).map((i) => i.self_noun).filter(Boolean);
  A.sessions.push({ run, startHourUTC: new Date(rows[0].wall).getUTCHours(), ck, dTTFA: ck[30].ttfa != null && ck[1].ttfa != null ? ck[30].ttfa - ck[1].ttfa : null,
    distinctSelfNouns: new Set(nouns).size, aiTeacherShare: nouns.length ? +(nouns.filter((n) => n === "ai teacher").length / (ps.identity.length)).toFixed(2) : 0,
    identityTruthful: (ps?.identity || []).filter((i) => i.says_ai && !i.claims_human).length + "/" + (ps?.identity || []).length,
    claimsHuman: (ps?.identity || []).filter((i) => i.claims_human).length, memory: ps?.memory?.recalled ?? null,
    unheardRefs: (ps?.barges || []).filter((b) => b.refers).length + "/" + (ps?.barges || []).length, retries: ps?.retries });
}
for (const [arm, A] of Object.entries(out)) {
  const n = A.pts.length, mx = A.pts.reduce((s, p) => s + p[0], 0) / n, my = A.pts.reduce((s, p) => s + p[1], 0) / n;
  const sxy = A.pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = A.pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const syy = A.pts.reduce((s, p) => s + (p[1] - my) ** 2, 0);
  A.slopeMsPer1kTok = +(sxy / sxx).toFixed(1); A.r = +(sxy / Math.sqrt(sxx * syy)).toFixed(2); A.nPts = n; delete A.pts;
}
fs.writeFileSync(HERE + "analysis.json", JSON.stringify(out, null, 1));
for (const [arm, A] of Object.entries(out).sort()) {
  console.log(`== ${arm}: TTFA slope ${A.slopeMsPer1kTok} ms per 1k input tokens (r=${A.r}, n=${A.nPts})`);
  for (const s of A.sessions) console.log(`  run ${s.run} @${s.startHourUTC}h ttfa m1/10/20/30 ${[1, 10, 20, 30].map((m) => s.ck[m].ttfa).join("/")} dTTFA ${s.dTTFA} in ${[1, 10, 20, 30].map((m) => s.ck[m].inTok).join("/")} nouns ${s.distinctSelfNouns} aiT ${s.aiTeacherShare} truthful ${s.identityTruthful} mem ${s.memory} unheard ${s.unheardRefs} retries ${s.retries}`);
}
