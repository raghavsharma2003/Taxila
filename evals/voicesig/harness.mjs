// VS acceptance harness (SPEC §7): runs pilot-format rows (evals/voicesig/PILOT-FORMAT.md) through the PRODUCT adapter
// (server/voicesig/adapter.js, shadow mode, per-child baselines in turn order) and reports VS-A1..A7, A9, A12 with
// child-clustered intervals. Runnable today on simulated rows (simulate-pilot.mjs); on the real pilot the day it exists.
//
//   node evals/voicesig/harness.mjs <rows.jsonl> [--out results.json] [--B 1000] [--baseline child|session]
//
// It never trains on coder labels (G-VS-LABEL): coder marks are read only by VS-A5 / VS-A8, as evaluation.
import { readFileSync, writeFileSync } from "node:fs";
import { readText } from "../../server/signals/linguistic.js";
import { toSignalInput, updateBaseline } from "../../server/voicesig/adapter.js";
import { VsBaseline } from "../../server/voicesig/baseline.js";
import { fillerLexOf } from "../../server/voicesig/rules.js";
import { fitIsotonic, applyIsotonic } from "../../server/voicesig/calibrate.js";
import { auroc, clusterBoot, clusterFolds, ece, oofLogistic, quantile } from "./metrics.mjs";

const REQUIRED = ["child", "session", "turn", "verdict", "kv", "outcomes"];
const GROUPS = ["langMode", "micClass", "ageBand", "gender", "homeLang", "speechDiff"];

export function validateRows(rows) {
  const errors = [];
  rows.forEach((r, i) => {
    for (const k of REQUIRED) if (r[k] === undefined) errors.push(`row ${i}: missing ${k}`);
    if (r.verdict && !["correct", "partial", "not_yet", "ungraded"].includes(r.verdict)) errors.push(`row ${i}: bad verdict`);
  });
  return errors;
}

function lingOf(r) {
  if (r.ling) return r.ling;
  if (typeof r.text !== "string") return {};
  const L = readText({ childText: r.text, item: r.itemKey ? { key: r.itemKey, kitTerms: [] } : undefined });
  // fillerLex is register-aware ("haan ji" is deference, not hesitation): rules.fillerLexOf over the same tokens.
  return { idk: L.idk?.v ?? null, hedge: !!L.hedge, fillerLex: fillerLexOf(L.toks) === true, toks: L.toks, repairDir: L.repairDir ?? null, thinkAloud: !!L.thinkAloudLex, tFluent: false };
}

/** Run the adapter over every row in per-child turn order. Returns rows annotated with `vs` and `ling`. */
export function runAdapter(rows, { baseline = "child" } = {}) {
  const byChild = new Map();
  for (const r of rows) {
    if (!byChild.has(r.child)) byChild.set(r.child, []);
    byChild.get(r.child).push(r);
  }
  const out = [];
  for (const [, rs] of byChild) {
    rs.sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || String(a.session).localeCompare(String(b.session)) || a.turn - b.turn);
    let base = new VsBaseline();
    let lastSession = null;
    for (const r of rs) {
      if (baseline === "session" && r.session !== lastSession) base = new VsBaseline();
      lastSession = r.session;
      const ling = lingOf(r);
      const ctx = {
        verdict: r.verdict, safety: !!r.safety, ling, words: r.words, o3History: !!r.o3History, context: r.context ?? "answer",
        form: r.form ?? "number", langMode: r.langMode, ageBand: r.ageBand, baseline: base, qSignals: r.qSignals,
        deltaFitted: !!r.deltaFitted, deltaZ: r.deltaZ, mode: "shadow",
      };
      const vs = toSignalInput(r.kv, ctx);
      updateBaseline(base, r.kv, { ...ctx, bargeIn: !!r.bargeIn });
      out.push({ ...r, ling, vs });
    }
  }
  return out;
}

const finite = (x) => typeof x === "number" && Number.isFinite(x);
const metric = (value, extra = {}) => ({ value: finite(value) ? Math.round(value * 1000) / 1000 : value, ...extra });

export function evaluate(rowsIn, { B = 1000, baseline = "child" } = {}) {
  const rows = runAdapter(rowsIn, { baseline });
  const C = (r) => r.child;
  const nChildren = new Set(rows.map(C)).size;
  const res = { n: rows.length, children: nChildren, metrics: {} };
  const M = res.metrics;
  const ok = rows.filter((r) => r.vs && !r.vs.abstain);

  // ── VS-A12: safety turns abstain 100% ──
  const safety = rows.filter((r) => r.safety);
  M["VS-A12"] = metric(safety.length ? safety.filter((r) => r.vs?.abstain && r.vs.lrV === 1 && !r.vs.reasons.length).length / safety.length : NaN, { n: safety.length, bar: "= 1.0", pass: safety.length ? safety.every((r) => r.vs?.abstain) : "insufficient" });

  // ── VS-A1 / A2 on correct answers with a defined O1 ──
  const corr = ok.filter((r) => r.verdict === "correct" && (r.outcomes?.O1 === 0 || r.outcomes?.O1 === 1));
  const y1 = (r) => (r.outcomes.O1 === 0 ? 1 : 0); // positive = delayed-transfer FAILURE (what a probe should catch)
  const zv = (r, k) => (finite(r.vs.z?.[k]) ? r.vs.z[k] : 0);
  const textF = (r) => [r.ling.hedge ? 1 : 0, r.ling.fillerLex ? 1 : 0, r.ling.repairDir === "right_to_wrong" ? 1 : 0, finite(r.pL) ? r.pL : 0.5, finite(r.bt) ? r.bt : 0, (r.hintRung ?? 0) / 4, Math.log1p(r.words ?? 1)];
  const voiceF = (r) => [...textF(r), r.vs.sE.h1, zv(r, "contentOnsetMs") || zv(r, "onsetMs"), zv(r, "pauseFrac"), finite(r.kv.f?.fillerLeadMs) && r.kv.q?.det ? Math.log1p(r.kv.f.fillerLeadMs / 100) : 0, r.kv.q?.raw && finite(r.kv.f?.finalRelDb) ? r.kv.f.finalRelDb / 5 : 0];
  if (corr.length >= 40 && new Set(corr.map(y1)).size === 2) {
    const pT = oofLogistic(corr, textF, y1, C);
    const pV = oofLogistic(corr, voiceF, y1, C);
    corr.forEach((r, i) => { r._pT = pT[i]; r._pV = pV[i]; });
    const fitted = corr.filter((r) => finite(r._pT) && finite(r._pV));
    const d = (rs) => auroc(rs.map((r) => r._pV), rs.map(y1)) - auroc(rs.map((r) => r._pT), rs.map(y1));
    const b95 = clusterBoot(fitted, C, d, { B, alpha: 0.05 });
    const b80 = clusterBoot(fitted, C, d, { B, alpha: 0.2 });
    M["VS-A1"] = metric(b95.est, {
      aurocText: Math.round(auroc(fitted.map((r) => r._pT), fitted.map(y1)) * 1000) / 1000,
      aurocTextVoice: Math.round(auroc(fitted.map((r) => r._pV), fitted.map(y1)) * 1000) / 1000,
      ci80: [b80.lo, b80.hi], ci95: [b95.lo, b95.hi], n: fitted.length, children: b95.clusters, bar: "dAUROC >= 0.03 and 80% CI lower > 0",
      pass: b95.est >= 0.03 && b80.lo > 0,
    });
    // A2: voice-only rule score (−sE.h1: lower predicted success = higher failure risk).
    const a2 = clusterBoot(corr, C, (rs) => auroc(rs.map((r) => -r.vs.sE.h1), rs.map(y1)), { B });
    M["VS-A2"] = metric(a2.est, { ci95: [a2.lo, a2.hi], n: corr.length, bar: "AUROC >= 0.62, lower > 0.55", pass: a2.est >= 0.62 && a2.lo > 0.55 });
  } else {
    M["VS-A1"] = metric(NaN, { n: corr.length, pass: "insufficient" });
    M["VS-A2"] = metric(NaN, { n: corr.length, pass: "insufficient" });
  }

  // ── VS-A3: searching vs absent on IDK turns against O2 ──
  const idk = ok.filter((r) => r.ling.idk && (r.outcomes?.O2 === 0 || r.outcomes?.O2 === 1));
  if (idk.length >= 30 && new Set(idk.map((r) => r.outcomes.O2)).size === 2) {
    const a3 = clusterBoot(idk, C, (rs) => auroc(rs.map((r) => r.vs.h.h2), rs.map((r) => r.outcomes.O2)), { B });
    const slow = (r) => (finite(r.vs.z?.onsetMs) && r.vs.z.onsetMs >= 1) || r.ling.fillerLex || (r.kv.q?.det && (r.kv.f?.fillerLeadMs ?? 0) >= 300);
    const gap = (rs) => {
      const s = rs.filter(slow), f = rs.filter((r) => !slow(r));
      if (!s.length || !f.length) return NaN;
      return s.filter((r) => r.outcomes.O2 === 1).length / s.length - f.filter((r) => r.outcomes.O2 === 1).length / f.length;
    };
    const g = clusterBoot(idk, C, gap, { B });
    M["VS-A3"] = metric(a3.est, { ci95: [a3.lo, a3.hi], gap: metric(g.est, { ci95: [g.lo, g.hi] }), n: idk.length, bar: "AUROC >= 0.70; gap >= 0.15 with n >= 200 IDK per band", pass: idk.length < 200 ? "insufficient" : a3.est >= 0.7 && g.est >= 0.15 });
  } else M["VS-A3"] = metric(NaN, { n: idk.length, pass: "insufficient" });

  // ── VS-A4: calibration per head (child-clustered isotonic CV on the rule score) ──
  const heads = { h1: [corr, (r) => r.outcomes.O1], h2: [idk, (r) => r.outcomes.O2] };
  const wrong = ok.filter((r) => (r.verdict === "not_yet" || r.verdict === "partial") && (r.outcomes?.O3 === 0 || r.outcomes?.O3 === 1));
  heads.h3 = [wrong, (r) => r.outcomes.O3];
  const rapid = ok.filter((r) => r.vs.state === "rapidGuess" && (r.outcomes?.O4 === 0 || r.outcomes?.O4 === 1));
  heads.h4 = [rapid, (r) => r.outcomes.O4];
  const a4 = {};
  for (const [h, [rs, lab]] of Object.entries(heads)) {
    if (rs.length < 50) { a4[h] = { n: rs.length, pass: "insufficient" }; continue; }
    const folds = clusterFolds(rs.map(C), 5);
    const p = new Array(rs.length).fill(NaN);
    for (const f of folds) {
      const tr = rs.filter((r) => !f.has(C(r)));
      const t = fitIsotonic(tr.map((r) => r.vs.sE[h] + r.vs.sT[h]), tr.map(lab));
      rs.forEach((r, i) => { if (f.has(C(r))) p[i] = applyIsotonic(t, r.vs.sE[h] + r.vs.sT[h]); });
    }
    const keep = rs.map((_, i) => i).filter((i) => finite(p[i]));
    const e = ece(keep.map((i) => p[i]), keep.map((i) => lab(rs[i])));
    const eRaw = ece(rs.map((r) => r.vs.h[h]), rs.map(lab));
    a4[h] = { eceCalibratedCV: Math.round(e * 1000) / 1000, ecePlaceholder: Math.round(eRaw * 1000) / 1000, n: rs.length, pass: e <= 0.05 ? true : e <= 0.08 ? "L1 only" : false };
  }
  M["VS-A4"] = { ...a4, bar: "ECE <= 0.08 (L1), <= 0.05 (L2)" };

  // ── VS-A5: rapid guess vs coder "no attempt" (evaluation only) and O4 disagreement ──
  const coded = ok.filter((r) => r.coder && (r.coder.noAttempt === 0 || r.coder.noAttempt === 1));
  const fired = coded.filter((r) => r.vs.state === "rapidGuess");
  const o4 = ok.filter((r) => r.outcomes?.O4 === 0 || r.outcomes?.O4 === 1);
  const dis = (rs) => (rs.length ? rs.filter((r) => r.outcomes.O4 === 0).length / rs.length : NaN);
  M["VS-A5"] = metric(fired.length ? fired.filter((r) => r.coder.noAttempt === 1).length / fired.length : NaN, {
    n: fired.length, o4DisagreeRapid: metric(dis(o4.filter((r) => r.vs.state === "rapidGuess"))), o4DisagreeBase: metric(dis(o4)),
    bar: "precision >= 0.7; O4 disagreement >= 2x base", pass: fired.length < 20 ? "insufficient" : fired.filter((r) => r.coder.noAttempt === 1).length / fired.length >= 0.7 && dis(o4.filter((r) => r.vs.state === "rapidGuess")) >= 2 * dis(o4),
  });

  // ── VS-A6: breakdowns ──
  const a6 = {};
  const pooledA = finite(M["VS-A1"].aurocTextVoice) ? M["VS-A1"].aurocTextVoice : NaN;
  const fire = (rs) => (rs.length ? rs.filter((r) => r.vs.state && r.vs.state !== "workingAloud").length / rs.length : NaN);
  const pooledFire = fire(ok);
  for (const g of GROUPS) {
    const vals = [...new Set(ok.map((r) => String(r[g] ?? "na")))];
    if (vals.length < 2) continue;
    a6[g] = {};
    for (const v of vals) {
      const rs = ok.filter((r) => String(r[g] ?? "na") === v);
      const cs = corr.filter((r) => String(r[g] ?? "na") === v && finite(r._pV));
      const a = cs.length >= 30 && new Set(cs.map(y1)).size === 2 ? auroc(cs.map((r) => r._pV), cs.map(y1)) : NaN;
      const fr = fire(rs);
      a6[g][v] = {
        n: rs.length, aurocO1: finite(a) ? Math.round(a * 1000) / 1000 : null, firePer100: Math.round(fr * 1000) / 10,
        pass: !finite(a) ? "insufficient" : Math.abs(a - pooledA) <= 0.05 && Math.abs(fr - pooledFire) <= 0.02,
      };
    }
  }
  M["VS-A6"] = { ...a6, pooledAuroc: pooledA, pooledFirePer100: Math.round(pooledFire * 1000) / 10, bar: "per-group AUROC within 0.05 of pooled; fire-rate gap <= 2 per 100 turns" };

  // ── VS-A7: held belief ──
  if (wrong.length >= 40) {
    const diff = (rs) => {
      const h = rs.filter((r) => r.vs.state === "heldBelief"), o = rs.filter((r) => r.vs.state !== "heldBelief");
      if (!h.length || !o.length) return NaN;
      return h.filter((r) => r.outcomes.O3 === 1).length / h.length - o.filter((r) => r.outcomes.O3 === 1).length / o.length;
    };
    const b = clusterBoot(wrong, C, diff, { B });
    M["VS-A7"] = metric(b.est, { ci95: [b.lo, b.hi], n: wrong.length, nHeld: wrong.filter((r) => r.vs.state === "heldBelief").length, bar: ">= 0.15, CI excludes 0", pass: b.est >= 0.15 && b.lo > 0 });
  } else M["VS-A7"] = metric(NaN, { n: wrong.length, pass: "insufficient" });

  // ── VS-A9 (device half): head compute ──
  const cms = rows.map((r) => r.kv?.computeMs).filter(finite);
  M["VS-A9"] = metric(quantile(cms, 0.95), { p50: quantile(cms, 0.5), n: cms.length, bar: "head p95 <= 20 ms (device lab, mid class)", pass: cms.length ? quantile(cms, 0.95) <= 20 : "insufficient" });

  // State fire profile (shadow).
  const counts = {};
  for (const r of ok) { const s = r.vs.state ?? "null"; counts[s] = (counts[s] ?? 0) + 1; }
  res.stateCounts = counts;
  res.disagreements = ok.filter((r) => r.vs.disagree).length;
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const rows = readFileSync(args[0], "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const errors = validateRows(rows);
  if (errors.length) { console.error(errors.slice(0, 20).join("\n")); process.exit(2); }
  const res = evaluate(rows, { B: Number(opt("--B", 1000)), baseline: opt("--baseline", "child") });
  res.input = args[0];
  res.ranAt = new Date().toISOString();
  const out = opt("--out", null);
  if (out) writeFileSync(out, JSON.stringify(res, null, 1));
  for (const [k, v] of Object.entries(res.metrics)) console.log(k.padEnd(7), JSON.stringify(v).slice(0, 220));
  console.log("states", JSON.stringify(res.stateCounts), "disagree", res.disagreements);
}
