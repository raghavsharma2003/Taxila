// game-stealth-sim.mjs — two computed checks behind docs/research/comprehension/game-stealth.md (§6, §8).
// Run: node docs/research/comprehension/game-stealth-sim.mjs  (deterministic, seeded; no network, no deps)
//
// A. "Dumb-policy bots": how often policies that hold NO understanding pass a numberline-jump level pack,
//    with and without randomised pad layout. Save Patch (Kerr & Chung 2012) found 19% of all errors came from an
//    "everything in order" exploit; this measures the analogous risk for our own archetype.
// B. Posterior arithmetic: how far game-only evidence can move pL under LEARNER-MODEL §6.1 rules
//    (LR table, per-class 1/j session weights, ±log 50 clamp), at game weight w_game = 0.5 vs 1.0.

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fr = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
const val = ([n, d]) => n / d;

// ---------- A. level pack: a/b + c/d on a 0..2 line, 4 pads: key, add-across misc, whole-number-bias misc, filler
let FILLER = "naive";
function makeLevel(r) {
  for (;;) {
    const b = 2 + Math.floor(r() * 5), d = 2 + Math.floor(r() * 5);
    if (b === d) continue;
    const a = 1 + Math.floor(r() * (b - 1)), c = 1 + Math.floor(r() * (d - 1));
    const key = fr(a * d + c * b, b * d);
    const across = fr(a + c, b + d);                                   // MC.FRAC.ADD_ACROSS
    const wnb = fr(a + c, Math.min(b, d));                             // whole-number-ish: add tops, keep a bottom
    // filler: authored naively (key + 1/den, always above the key) or rank-balanced (above or below at random)
    const below = FILLER === "balanced" && key[0] > 1 && r() < 0.5;
    const filler = fr(below ? key[0] - 1 : key[0] + 1, key[1]);
    const pads = [key, across, wnb, filler].map((f) => ({ f, v: val(f) }));
    const vs = pads.map((p) => p.v.toFixed(4));
    if (new Set(vs).size < 4 || pads.some((p) => p.v > 2)) continue;
    return { pads, keyV: val(key), acrossV: val(across) };
  }
}
const policies = {
  random: (L, order, r) => order[Math.floor(r() * order.length)],
  first_pad: (L, order) => order[0],                                   // positional exploit
  leftmost: (L, order) => order.reduce((m, i) => (L.pads[i].v < L.pads[m].v ? i : m), order[0]),
  rightmost: (L, order) => order.reduce((m, i) => (L.pads[i].v > L.pads[m].v ? i : m), order[0]),
  second_from_left: (L, order) => [...order].sort((i, j) => L.pads[i].v - L.pads[j].v)[1],   // rank exploit
  add_across: (L, order) => order.find((i) => Math.abs(L.pads[i].v - L.acrossV) < 1e-9),
  understands: (L, order) => order.find((i) => Math.abs(L.pads[i].v - L.keyV) < 1e-9),
};
function runPack(layout, seed, nLevels = 4, nKids = 20000) {
  const r = rng(seed), out = {};
  for (const [name, pol] of Object.entries(policies)) {
    let perLevel = 0, gate = 0;
    for (let k = 0; k < nKids; k++) {
      let ok = 0;
      for (let l = 0; l < nLevels; l++) {
        const L = makeLevel(r);
        // authored layout: pads listed in authoring order (key first) and drawn in that order on screen
        let order = [0, 1, 2, 3];
        if (layout === "shuffled") for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        const pick = pol(L, order, r);
        if (pick === 0) ok++;
      }
      perLevel += ok / nLevels; if (ok >= 3) gate++;
    }
    out[name] = { firstTryCorrect: +(perLevel / nKids).toFixed(3), passes3of4: +(gate / nKids).toFixed(3) };
  }
  return out;
}

// ---------- B. posterior under LEARNER-MODEL §6.1 (rules 2, 5, 6; no transitions, R = 1, code grader)
function posterior(pL0, events) {             // events: [{cls, LR, w}]
  const nByCls = {}; let sumLog = 0; const LOG50 = Math.log(50);
  let odds = pL0 / (1 - pL0);
  const trace = [];
  for (const e of events) {
    const j = (nByCls[e.cls] = (nByCls[e.cls] || 0) + 1);
    let step = (1 / j) * e.w * Math.log(e.LR);
    const next = Math.max(-LOG50, Math.min(LOG50, sumLog + step));
    step = next - sumLog; sumLog = next;
    odds *= Math.exp(step);
    trace.push(+(odds / (1 + odds)).toFixed(3));
  }
  return trace;
}

const A = { authored_order: runPack("authored", 7), shuffled: runPack("shuffled", 7) };
FILLER = "balanced";
A.shuffled_rank_balanced_filler = runPack("shuffled", 7);
const pL0 = 0.39; // LEARNER-MODEL §6.1 rule 5 example prior
const predictRight = (w) => ({ cls: "probe.predict", LR: 1.7, w });
const firstTryC0 = (w) => ({ cls: "item.open", LR: 8.0, w });
const farPass = (w) => ({ cls: "probe.transfer.far", LR: 8.1, w });
const whyFull = { cls: "probe.why", LR: 7.5, w: 1 };
const B = {
  "8 game predictions right, w=1.0": posterior(pL0, Array(8).fill(predictRight(1))),
  "8 game predictions right, w=0.5": posterior(pL0, Array(8).fill(predictRight(0.5))),
  "4 game first-try builds (C0), w=0.5": posterior(pL0, Array(4).fill(firstTryC0(0.5))),
  "4 predictions + far-transfer level pass, w=0.5": posterior(pL0, [...Array(4).fill(predictRight(0.5)), farPass(0.5)]),
  "4 predictions w=0.5 then teacher why (full)": posterior(pL0, [...Array(4).fill(predictRight(0.5)), whyFull]),
};
console.log(JSON.stringify({ date: "2026-10-02", A_dumb_policy_bots_4_pads_4_levels_n20000: A, B_posterior_from_pL0_0_39: B }, null, 1));
