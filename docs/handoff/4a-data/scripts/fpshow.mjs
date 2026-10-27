const tree = process.argv[2];
const C = await import(`${tree}/evals/safety-robust/corpora.mjs`);
const R = await import(`${tree}/evals/safety-robust/redteam.data.mjs`);
const { scanSafetyDetail } = await import(`${tree}/server/director/safety.js`);
const items = [...R.REDTEAM_DISTRESS, ...R.REDTEAM_ROUND2, ...R.REDTEAM_ROUND3].map(([text, kind], i) => ({ id: `red${i}`, segs: [text.split(/\s+/)], text, kind }));
for (const [id, k] of [["red139", 1000], ["red151", 11], ["red197", 5], ["red197", 14]]) {
  const it = items.find((x) => x.id === id); const t = C.perturbedText(it, C.seedOf(it.id, k)).text;
  console.log(id, k, JSON.stringify(scanSafetyDetail(t)), "|", it.text, "|| perturbed:", t);
}
