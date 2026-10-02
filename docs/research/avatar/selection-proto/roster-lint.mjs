// Tutor-picker roster lint + choice-bias simulation (research prototype, tutor-selection-ux.md §6, §11).
// Run: node docs/research/avatar/selection-proto/roster-lint.mjs
// Deterministic (seeded). No deps. Exit code 1 if the PROPOSED roster fails any rule; the CURRENT roster is the
// negative control and is expected to fail (that is how we know the rules can fire).

const BAND_OF_CLASS = c => (c <= 2 ? "B1" : c <= 4 ? "B2" : c <= 7 ? "B3" : "B4");
// choices.max from kids-ux-ages.md row 15 / onboarding-flow C1; min 2 = a real choice exists (Patall 2008: 2-4).
const CHOICE = { B1: [2, 2], B2: [2, 3], B3: [2, 4], B4: [2, 4] };

// CURRENT = character-creation.md §3.2 launch cast exactly as written ("default fit" column).
const CURRENT = [
  { id: "anaya",   g: "F", mst: 6, classes: [1, 5] },
  { id: "kabir",   g: "M", mst: 7, classes: [3, 8] },
  { id: "nandini", g: "F", mst: 8, classes: [4, 9] },
  { id: "arjun",   g: "M", mst: 5, classes: [5, 9] },
];
// PROPOSED = same four faces and voices, fit widened (§6.3): Kabir down to class 1, Anaya up to class 6.
const PROPOSED = [
  { id: "anaya",   g: "F", mst: 6, classes: [1, 6] },
  { id: "kabir",   g: "M", mst: 7, classes: [1, 8] },
  { id: "nandini", g: "F", mst: 8, classes: [4, 9] },
  { id: "arjun",   g: "M", mst: 5, classes: [5, 9] },
];

function eligible(roster, cls, allow = null) {
  return roster.filter(t => cls >= t.classes[0] && cls <= t.classes[1] && (!allow || allow.includes(t.id)));
}
function lint(name, roster) {
  const out = [];
  for (let cls = 1; cls <= 9; cls++) {
    const band = BAND_OF_CLASS(cls), [lo, hi] = CHOICE[band], el = eligible(roster, cls);
    const shown = el.slice(0, hi); // picker caps at choices.max; extra eligible tutors rotate (§6.4)
    const errs = [];
    if (el.length < lo) errs.push(`only ${el.length} eligible (< ${lo})`);
    if (shown.length >= 2 && new Set(shown.map(t => t.g)).size < 2) errs.push("single gender shown");
    if (!shown.some(t => t.mst >= 6)) errs.push("no MST>=6 option");
    out.push({ cls, band, eligible: el.map(t => t.id).join(","), n: el.length, errs });
  }
  const fails = out.filter(r => r.errs.length);
  console.log(`\n== ${name}: ${fails.length} failing classes of 9`);
  for (const r of out) console.log(`  class ${r.cls} ${r.band}  n=${r.n}  [${r.eligible}]  ${r.errs.join("; ") || "ok"}`);
  return fails.length;
}

// ---- choice-bias simulation (why order and default are randomised, §6.4) ----
// Assumptions [U]: all tutors equally appealing; first tile gets weight `prim` (primacy), and a pre-highlighted
// default is kept outright by fraction `stick` of children (default effect). Measured outcome: share per tutor,
// and whether M-AV-6 ("no tutor < 10% share") would falsely fire.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function simulate({ n = 4000, k = 4, prim = 1.6, stick = 0.3, shuffle, randDefault, seed = 7 }) {
  const r = rng(seed), share = Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    const order = [...Array(k).keys()];
    if (shuffle) for (let j = k - 1; j > 0; j--) { const x = Math.floor(r() * (j + 1)); [order[j], order[x]] = [order[x], order[j]]; }
    const def = randDefault ? Math.floor(r() * k) : 0;               // fixed default = tutor 0
    if (r() < stick) { share[def]++; continue; }
    const w = order.map((t, pos) => (pos === 0 ? prim : 1)), tot = w.reduce((a, b) => a + b);
    let u = r() * tot, pick = order[k - 1];
    for (let p = 0; p < k; p++) { if ((u -= w[p]) < 0) { pick = order[p]; break; } }
    share[pick]++;
  }
  return share.map(s => +(100 * s / n).toFixed(1));
}

const fCur = lint("CURRENT roster (character-creation §3.2) - negative control", CURRENT);
const fProp = lint("PROPOSED roster (fit widened)", PROPOSED);

console.log("\n== choice-bias simulation, 4 equally appealing tutors, n=4000 children per arm, seed 7");
for (const [label, cfg] of [
  ["fixed order + fixed default", { shuffle: false, randDefault: false }],
  ["fixed order + random default", { shuffle: false, randDefault: true }],
  ["shuffled order + random default", { shuffle: true, randDefault: true }],
  ["shuffled, no default highlight (stick=0)", { shuffle: true, randDefault: true, stick: 0 }],
]) {
  const s = simulate(cfg);
  console.log(`  ${label.padEnd(42)} shares % = ${s.join(" / ")}   max/min = ${(Math.max(...s) / Math.min(...s)).toFixed(2)}`);
}
// sensitivity: what primacy + stickiness make a fixed-order picker trip the <10% rule on equal tutors
console.log("\n== sensitivity (fixed order + fixed default): min share % by primacy x stickiness");
for (const stick of [0, 0.2, 0.4, 0.6]) {
  const row = [1.0, 1.3, 1.6, 2.0].map(prim => Math.min(...simulate({ shuffle: false, randDefault: false, prim, stick })));
  console.log(`  stick=${stick}  prim 1.0/1.3/1.6/2.0 -> min share ${row.join(" / ")}`);
}

console.log(`\nresult: current fails ${fCur} classes (expected > 0), proposed fails ${fProp} classes (expected 0)`);
process.exit(fCur > 0 && fProp === 0 ? 0 : 1);
