// SYNTHETIC pilot rows (PILOT-FORMAT.md) from a stated generative model. It proves that the harness, the adapter and the
// statistics run end to end, and it estimates the PRECISION a pilot of a given size can reach. It proves nothing about
// children's voices: every effect size below is an assumption [E], not a finding. Results from it are labelled
// "simulated" everywhere they are written.
//
//   node evals/voicesig/simulate-pilot.mjs --children 30 --effect 1 --seed 1 > rows.jsonl
//   node evals/voicesig/simulate-pilot.mjs --power --children 30 --effect 1 --reps 20     (precision / power table)
import { rng } from "./metrics.mjs";

/** Knowledge-state model [E]. shift = onset shift in child-SD units at effect 1; filler = P(leading filler). */
export const STATES = {
  solid: { shift: -0.4, filler: 0.08, hedge: 0.03, O1: 0.88 },
  fragile: { shift: 0.6, filler: 0.35, hedge: 0.25, O1: 0.45 },
  misconception: { shift: -0.3, filler: 0.1, hedge: 0.05, O3: 0.65 },
  retrievable: { shift: 0.9, filler: 0.5, hedge: 0.05, O2: 0.85 },
  absent: { shift: -0.4, filler: 0.1, hedge: 0.05, O2: 0.45, O3: 0.15 },
};
const BASE_FILLER = 0.18;

function gauss(R) {
  let u = 0, v = 0;
  while (u === 0) u = R();
  while (v === 0) v = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function simulate({ children = 30, effect = 1, seed = 1, safetyRate = 0.03 } = {}) {
  const R = rng(seed);
  const pick = (xs) => xs[Math.floor(R() * xs.length)];
  const rows = [];
  for (let c = 0; c < children; c++) {
    const child = `sim${String(c).padStart(3, "0")}`;
    const theta = gauss(R);
    const mu = Math.log1p(1500 / 100) + 0.25 * gauss(R);
    const sd = 0.35;
    const ageBand = c % 2 ? "9-10" : "11-13";
    const langMode = pick(["hi", "hinglish", "hinglish", "en"]);
    const micClass = pick(["builtin", "builtin", "builtin", "wired", "bt"]);
    const gender = c % 3 === 0 ? "f" : c % 3 === 1 ? "m" : pick(["f", "m"]);
    const homeLang = langMode === "en" ? "en" : "hi";
    const sessions = [["S-A", 0, 48, true], ["S-B", 3, 48, false], ["S-C", 8, 30, false]];
    let turn = 0;
    for (const [session, day, nItems, scored] of sessions) {
      for (let i = 0; i < nItems; i++) {
        turn++;
        const b = gauss(R);
        const known = R() < 1 / (1 + Math.exp(-(theta - b)));
        let st;
        if (known) st = R() < 0.65 ? "solid" : "fragile";
        else { const u = R(); st = u < 0.35 ? "misconception" : u < 0.65 ? "retrievable" : "absent"; }
        const S = STATES[st];
        const rapid = R() < 0.05;
        let verdict, text, words, idk = null;
        const ans = String(Math.floor(R() * 90) + 10);
        const pf = BASE_FILLER + effect * (S.filler - BASE_FILLER);
        const filler = !rapid && R() < pf;
        const fillerLex = filler && R() < 0.4;
        const hedge = !rapid && R() < S.hedge;
        if (st === "solid") verdict = R() < 0.97 ? "correct" : "not_yet";
        else if (st === "fragile") verdict = R() < 0.8 ? "correct" : "not_yet";
        else if (st === "misconception") verdict = "not_yet";
        else if (st === "retrievable") { const u = R(); idk = u < 0.5 ? "cant_recall" : u < 0.65 ? "not_known" : "cant_recall"; verdict = "ungraded"; }
        else { if (R() < 0.7) { idk = "not_known"; verdict = "ungraded"; } else verdict = "not_yet"; }
        if (rapid) { verdict = R() < 0.5 ? "correct" : "not_yet"; idk = null; }
        if (idk === "cant_recall") text = pick(["yaad nahi aa raha", "bhool gaya", "abhi yaad nahi aa raha"]);
        else if (idk === "not_known") text = pick(["pata nahi", "nahi aata", "mujhe nahi pata"]);
        else text = `${fillerLex ? "umm " : ""}${hedge ? "shayad " : ""}${ans}`;
        words = text.split(/\s+/).length;
        const z = rapid ? -2.6 + 0.3 * gauss(R) : gauss(R) + effect * S.shift;
        const onsetMs = Math.max(150, 100 * Math.expm1(mu + sd * z));
        const lead = filler ? 300 + 900 * R() : 0;
        const durationMs = rapid ? 350 + 150 * R() : 600 + 700 * R() + lead;
        const pauseFrac = Math.min(0.9, Math.max(0, 0.08 + 0.06 * gauss(R) + effect * (st === "fragile" || st === "retrievable" ? 0.06 : 0)));
        const qAudio = R() < 0.05 ? 0.4 : 1;
        const safety = R() < safetyRate;
        const outcomes = { O1: null, O2: null, O3: null, O4: null };
        if (scored) {
          if (verdict === "correct") outcomes.O1 = rapid ? (R() < 0.5 ? 1 : 0) : R() < (S.O1 ?? 0.6) ? 1 : 0;
          if (idk) outcomes.O2 = R() < (S.O2 ?? 0.5) ? 1 : 0;
          if (verdict === "not_yet") outcomes.O3 = R() < (S.O3 ?? 0.2) ? 1 : 0;
          if (rapid) outcomes.O4 = R() < 0.5 ? 1 : 0;
        }
        rows.push({
          child, session, day, turn, item: `sim:${session}:${i}`, form: "number", verdict, text: safety ? "mujhe bahut dar lag raha hai ghar pe" : text, words,
          safety, langMode, micClass, ageBand, gender, homeLang, speechDiff: false, pL: 0.5, bt: Math.max(-2, Math.min(2, b - theta)), hintRung: 0,
          kv: {
            v: 1, modelVer: "sim", stage: 0,
            f: { onsetMs: Math.round(onsetMs), contentOnsetMs: Math.round(onsetMs + lead), fillerLeadMs: Math.round(lead), durationMs: Math.round(durationMs), voicedFrac: 0.6, pauseFrac, longestPauseMs: Math.round(pauseFrac * durationMs), flatVoicedRuns: filler ? 1 : 0 },
            q: { audio: qAudio, raw: 0, enc: 0, det: 1, micClass, langMode }, computeMs: 2 + 3 * R(),
          },
          outcomes, coder: { noAttempt: rapid ? (R() < 0.8 ? 1 : 0) : R() < 0.05 ? 1 : 0 },
          sim: { state: st, rapid },
        });
      }
    }
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  const children = opt("--children", 30), effect = opt("--effect", 1), seed = opt("--seed", 1);
  if (args.includes("--power")) {
    const { evaluate } = await import("./harness.mjs");
    const reps = opt("--reps", 20);
    const out = [];
    for (let s = 0; s < reps; s++) {
      const r = evaluate(simulate({ children, effect, seed: 1000 + s }), { B: opt("--B", 200) });
      const a1 = r.metrics["VS-A1"], a3 = r.metrics["VS-A3"];
      out.push({ d: a1.value, lo80: a1.ci80?.[0], hi80: a1.ci80?.[1], lo95: a1.ci95?.[0], hi95: a1.ci95?.[1], pass: a1.pass === true, a3: a3.value, a3lo: a3.ci95?.[0], a3hi: a3.ci95?.[1] });
    }
    const med = (xs) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
    console.log(JSON.stringify({
      simulated: true, children, effect, reps,
      dAurocMedian: med(out.map((o) => o.d)), ci95HalfWidthMedian: med(out.map((o) => (o.hi95 - o.lo95) / 2)), ci80HalfWidthMedian: med(out.map((o) => (o.hi80 - o.lo80) / 2)),
      pPassA1: out.filter((o) => o.pass).length / reps, a3Median: med(out.map((o) => o.a3)), a3Ci95HalfWidthMedian: med(out.map((o) => (o.a3hi - o.a3lo) / 2)),
    }));
  } else {
    for (const r of simulate({ children, effect, seed })) process.stdout.write(JSON.stringify(r) + "\n");
  }
}
