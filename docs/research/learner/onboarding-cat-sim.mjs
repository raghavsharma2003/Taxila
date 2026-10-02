// onboarding-cat-sim.mjs: simulation behind onboarding-diagnostic.md §4 (item counts and stopping rules).
// Reproducible: `node docs/research/learner/onboarding-cat-sim.mjs` (seeded 20261002; about 45 s; output byte-identical across runs).
// Scale: grade-equivalent (GE), as in kt-algorithms.md §3.1: theta = 6.0 means "like a start-of-Class-6 child".
// Item model: P = c + (1-c)*sigmoid(a*(theta-b)), a_nominal = 1.5/GE. Open oral items carry ASR noise and dropouts.
// What is simulated is a MODEL of children, not children. Every input marked [U] in the doc is an input here.

function mulberry32(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rnd = mulberry32(20261002);
const randn = () => { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const sig = (x) => 1 / (1 + Math.exp(-x));

const GRID = []; for (let t = -2; t <= 12.0001; t += 0.05) GRID.push(+t.toFixed(2));

// ASR noise, in the model and in "truth" (truth can be worse than the model assumes)
const NOISE = { model: { fn: 0.08, fp: 0.02, drop: 0.15 }, young: { fn: 0.12, fp: 0.03, drop: 0.25 }, older: { fn: 0.08, fp: 0.02, drop: 0.12 } };

function pObs(theta, it, noise) {
  const p = it.c + (1 - it.c) * sig(it.a * (theta - it.b));
  return it.fmt === "open" ? (1 - noise.fn) * p + noise.fp * (1 - p) : p;
}
function infoAt(theta, it) {                                  // Fisher information of the observed binary response
  const h = 1e-3, p = pObs(theta, it, NOISE.model), d = (pObs(theta + h, it, NOISE.model) - pObs(theta - h, it, NOISE.model)) / (2 * h);
  return (d * d) / (p * (1 - p));
}
function makeBank(fmtMix, mis) {                              // nominal params (what the engine believes) + true params
  const bank = [];
  for (let b = -0.5; b <= 10.01; b += 0.25) for (let k = 0; k < 4; k++) {
    const fmt = fmtMix === "open" ? "open" : fmtMix === "tap3" ? "tap3" : (k % 2 ? "tap3" : "open");
    const c = fmt === "tap3" ? 1 / 3 : 0;
    const nom = { a: 1.5, b: +b.toFixed(2), c, fmt };
    const tru = { a: mis ? 1.5 * Math.exp(0.25 * randn()) : 1.5, b: mis ? b + 0.4 * randn() : b, c, fmt };
    bank.push({ nom, tru, id: bank.length });
  }
  return bank;
}
function summarise(post) { let m = 0, v = 0; for (let i = 0; i < GRID.length; i++) m += post[i] * GRID[i];
  for (let i = 0; i < GRID.length; i++) v += post[i] * (GRID[i] - m) ** 2; return { mean: m, sd: Math.sqrt(v) }; }
function prior(mu, sd, mix) {                                // mix = [{w, mu, sd}, ...] overrides (mu, sd) when given
  const comps = mix ?? [{ w: 1, mu, sd }];
  const p = GRID.map(t => comps.reduce((s, c) => s + c.w * Math.exp(-0.5 * ((t - c.mu) / c.sd) ** 2) / c.sd, 0));
  const z = p.reduce((a, b) => a + b); return p.map(x => x / z); }
function quantile(post, q) { let acc = 0; for (let i = 0; i < GRID.length; i++) { acc += post[i]; if (acc >= q) return GRID[i]; } return GRID.at(-1); }
function update(post, it, y) { const q = post.map((w, i) => { const p = pObs(GRID[i], it, NOISE.model); return w * (y ? p : 1 - p); });
  const z = q.reduce((a, b) => a + b); return q.map(x => x / z); }

// one simulated child, one strand
function runChild(cfg, bank, thetaTrue) {
  let post = prior(cfg.priorMu, cfg.priorSd, cfg.priorMix);
  const used = new Set(), hist = []; let secs = 0, wrongRun = 0, maxWrongRun = 0, evid = 0, pcSum = 0;
  let rung = cfg.ladderStart, rungItems = []; const passed = new Set(), failed = new Set();
  const truthNoise = cfg.young ? NOISE.young : NOISE.older;
  for (let n = 0; n < cfg.nMax; n++) {
    const { mean, sd } = summarise(post);
    if (cfg.policy !== "ladder" && evid >= cfg.nMin && sd < cfg.sdStop) break;
    // select
    let cand = bank.filter(x => !used.has(x.id)), it;
    if (cfg.policy === "maxinfo") it = cand.reduce((best, x) => infoAt(mean, x.nom) > infoAt(mean, best.nom) ? x : best);
    else if (cfg.policy === "target") {
      const last = hist.at(-1); const tp = !last ? cfg.tFirst : last.y ? cfg.tAfterRight : cfg.tAfterWrong;
      it = cand.reduce((best, x) => Math.abs(pObs(mean, x.nom, NOISE.model) - tp) < Math.abs(pObs(mean, best.nom, NOISE.model) - tp) ? x : best);
    } else {                                                 // ASER-style ladder: rungs at class centres b = k - 0.5, k = 1..9
      const bR = rung + 0.5; it = cand.filter(x => Math.abs(x.nom.b - bR) < 0.13).at(0) ?? cand[0];
    }
    used.add(it.id);
    const fmt = it.nom.fmt;
    secs += fmt === "open" ? (cfg.young ? 25 : 18) : (cfg.young ? 18 : 14);
    if (fmt === "open" && rnd() < truthNoise.drop) { secs += 10; continue; }   // low ASR confidence: no evidence, re-ask by tap costs time
    const pT = pObs(thetaTrue, it.tru, truthNoise), y = rnd() < pT ? 1 : 0;
    pcSum += it.tru.c + (1 - it.tru.c) * sig(it.tru.a * (thetaTrue - it.tru.b));
    post = update(post, it.nom, y); evid++; hist.push({ y });
    wrongRun = y ? 0 : wrongRun + 1; maxWrongRun = Math.max(maxWrongRun, wrongRun);
    if (cfg.policy === "ladder") {
      rungItems.push(y);
      if (rungItems.length === 2) {                          // pass = 2 of 2 (onboarding-flow C4 rule)
        const pass = rungItems[0] && rungItems[1]; rungItems = [];
        if (pass) { passed.add(rung); if (failed.has(rung + 1)) break; rung++; if (rung > 9) break; }
        else { failed.add(rung); if (passed.has(rung - 1)) break; rung--; if (rung < 0) break; }
      }
    }
  }
  const { mean, sd } = summarise(post);
  const est = cfg.estQ ? quantile(post, cfg.estQ) : mean;   // conservative placement: a posterior quantile, not the mean
  return { est, sd, n: used.size, evid, secs, pc: evid ? pcSum / evid : NaN, maxWrongRun };
}

function runConfig(cfg, N = 3000) {
  const r = { err: [], n: 0, evid: 0, secs: 0, pc: 0, w3: 0, sd: 0 };
  for (let s = 0; s < N; s++) {
    const bank = makeBank(cfg.fmt, cfg.mis);
    const th = Math.max(-0.5, cfg.popMu + cfg.popSd * randn());
    const o = runChild(cfg, bank, th);
    r.err.push(o.est - th); r.n += o.n; r.evid += o.evid; r.secs += o.secs; r.pc += isNaN(o.pc) ? 0 : o.pc; r.sd += o.sd;
    if (o.maxWrongRun >= 3) r.w3++;
  }
  const e = r.err, rmse = Math.sqrt(e.reduce((a, x) => a + x * x, 0) / N);
  const f = (pred) => (100 * e.filter(pred).length / N).toFixed(0) + "%";
  return { rmse: rmse.toFixed(2), within05: f(x => Math.abs(x) <= 0.5), within1: f(x => Math.abs(x) <= 1), tooHigh1: f(x => x > 1), tooLow1: f(x => x < -1),
    items: (r.n / N).toFixed(1), evid: (r.evid / N).toFixed(1), min: (r.secs / N / 60).toFixed(1), pCorrect: (r.pc / N).toFixed(2), wrong3: (100 * r.w3 / N).toFixed(0) + "%", postSd: (r.sd / N).toFixed(2) };
}

const STOPS = { "sd<.35|12": { sdStop: 0.35, nMax: 12 }, "sd<.5|8": { sdStop: 0.5, nMax: 8 }, "sd<.6|6": { sdStop: 0.6, nMax: 6 }, "fixed4": { sdStop: 0, nMax: 4 }, "fixed6": { sdStop: 0, nMax: 6 } };
const POL = { maxinfo: { policy: "maxinfo" }, target: { policy: "target", tFirst: 0.85, tAfterRight: 0.7, tAfterWrong: 0.8 }, ladder: { policy: "ladder" } };
const base6 = { priorMu: 5.0, priorSd: 1.5, nMin: 3, fmt: "mixed", mis: true, young: false, ladderStart: 5 - 1 };   // Class 6; ladder starts on Class-5 rung
const base2 = { priorMu: 1.0, priorSd: 1.0, nMin: 3, fmt: "mixed", mis: true, young: true, ladderStart: 1 };        // Class 2; ladder starts on Class-2 rung

const print = (title, rows) => { console.log("\n### " + title); const keys = Object.keys(rows[0][1]);
  console.log("| config | " + keys.join(" | ") + " |"); console.log("|" + "---|".repeat(keys.length + 1));
  for (const [k, v] of rows) console.log("| " + k + " | " + keys.map(x => v[x]).join(" | ") + " |"); };

// T1: Class 6 maths strand, population matched to prior vs 2.5 GE behind (government-school-like)
// GE origin (onboarding-diagnostic.md §3.1): 0 = start of Class 1, so start of Class 6 = 5.0 and Class-k skills sit near b = k - 0.5.
for (const [popName, popMu] of [["matched N(5.0,1.5)", 5.0], ["Delhi-like N(2.5,1.5)", 2.5]]) {
  const rows = [];
  for (const [pn, p] of Object.entries(POL)) for (const [sn, s] of Object.entries(STOPS)) {
    if (pn === "ladder" && sn !== "sd<.5|8" && sn !== "sd<.35|12") continue;
    rows.push([`${pn} ${pn === "ladder" ? "bracket|" + s.nMax : sn}`, runConfig({ ...base6, ...p, ...s, popMu, popSd: 1.5 })]);
  }
  print(`T1 Class 6, one strand, mixed open/tap items, misspecified bank, population ${popName}`, rows);
}
// T2: formats (target policy, sd<.5|8)
{ const rows = []; for (const fmt of ["open", "tap3", "mixed"]) rows.push([fmt, runConfig({ ...base6, ...POL.target, ...STOPS["sd<.5|8"], fmt, popMu: 5.0, popSd: 1.5 })]);
  rows.push(["mixed, exact bank", runConfig({ ...base6, ...POL.target, ...STOPS["sd<.5|8"], mis: false, popMu: 5.0, popSd: 1.5 })]);
  print("T2 Class 6, target policy, sd<.5|8: response format and bank calibration", rows); }
// T3: Class 2 (B1), young-child ASR noise
{ const rows = []; for (const [pn, p] of Object.entries(POL)) for (const sn of ["sd<.5|8", "sd<.6|6", "fixed4"]) {
    if (pn === "ladder" && sn !== "sd<.5|8") continue;
    rows.push([`${pn} ${pn === "ladder" ? "bracket|8" : sn}`, runConfig({ ...base2, ...p, ...STOPS[sn], popMu: 0.8, popSd: 1.0 })]); }
  print("T3 Class 2 (age 7), one strand, young-child ASR noise, population N(0.8,1.0)", rows); }

// T6: robustness to a wrong prior. Target policy, 8 items. Priors: single N(5,1.5); wide N(4.5,2); mixture of
// "on track" N(5,1.5) w .6 and "far behind" N(2.5,1.5) w .4. Placement read as the posterior mean or the 30th/20th percentile.
{ const rows = [];
  const PRI = { "N(5,1.5)": { priorMu: 5, priorSd: 1.5 }, "N(4.5,2)": { priorMu: 4.5, priorSd: 2 },
    "mix .6/.4": { priorMix: [{ w: 0.6, mu: 5, sd: 1.5 }, { w: 0.4, mu: 2.5, sd: 1.5 }] } };
  for (const [popName, popMu] of [["matched", 5.0], ["Delhi-like", 2.5]]) for (const [pn, pr] of Object.entries(PRI)) for (const q of [0, 0.4, 0.3, 0.2]) {
    rows.push([`${popName} · prior ${pn} · ${q ? "q" + q * 100 : "mean"}`, runConfig({ ...base6, ...POL.target, ...STOPS["sd<.5|8"], ...pr, estQ: q || undefined, popMu, popSd: 1.5 }, 2000)]); }
  print("T6 Class 6, target policy, 8 items: prior shape and conservative placement quantile", rows); }

// T7: posterior SD and error as total evidence accumulates (first session + JIT items in later lessons), target policy, mixture prior
{ const rows = []; for (const n of [4, 6, 8, 12, 16, 20, 24])
    rows.push([`${n} items`, runConfig({ ...base6, ...POL.target, sdStop: 0, nMax: n, nMin: 0, priorMix: [{ w: 0.6, mu: 5, sd: 1.5 }, { w: 0.4, mu: 2.5, sd: 1.5 }], popMu: 4.0, popSd: 1.8 }, 1500)]);
  print("T7 Class 6, target policy, mixture prior, population N(4.0,1.8): precision vs total items", rows); }

// T4: analytic. Targeting cost (2PL open item, no noise): information at success probability P relative to the maximum
console.log("\n### T4 information retained when targeting success probability P (2PL), and items needed relative to P = 0.5");
console.log("| P | " + [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9].join(" | ") + " |\n|---|---|---|---|---|---|---|---|");
console.log("| I(P)/Imax | " + [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9].map(p => (4 * p * (1 - p)).toFixed(2)).join(" | ") + " |");
console.log("| item multiplier | " + [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9].map(p => (1 / (4 * p * (1 - p))).toFixed(2)).join(" | ") + " |");
// T5: analytic. Borrowing strength across correlated strands (bivariate normal prior, equal prior SD 1.5)
console.log("\n### T5 prior SD of an UNPLACED strand B after placing strand A (prior SD 1.5 GE each, correlation rho)");
console.log("| rho | sdA=1.5 (none) | sdA=0.6 | sdA=0.5 | sdA=0.4 |\n|---|---|---|---|---|");
for (const rho of [0.5, 0.6, 0.7, 0.8]) console.log(`| ${rho} | ` + [1.5, 0.6, 0.5, 0.4].map(sA => Math.sqrt(1.5 ** 2 * (1 - rho ** 2) + rho ** 2 * sA ** 2).toFixed(2)).join(" | ") + " |");
