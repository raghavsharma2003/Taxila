// Server re-grade of a bound T1 engine answer (VALUES-100 V1.1 "frame claims are never trusted"; supersedes owner-truth
// patch 01's recheckValue, which reads the event's TOP-LEVEL fields: the frame protocol nests the act one level down,
// data = { value: { kind, written | value | given | chosen | ... }, correct }, so patch 01 re-checked 0 of 248 real
// forged claims in evals/grading-truth, 2026-10-05).
//
// The verdict is recomputed here from the RAW ACT the engine reports (`data.value`) and the params the SERVER holds for
// the mount (s.module.params, never the frame's echo), with the engine's own pure logic (src/modules/frame/engines/
// *.logic.ts, the code the frame runs), so the server and the frame cannot disagree on a value and a forged `correct`
// grades nothing. An act this file cannot recompute (an engine or mode whose event carries only derived numbers, e.g. a
// geoboard build sends area/perimeter, not the cells) returns { unverifiable: true }: NO evidence, never the claim.
// Pure. The .ts imports run under Node 22 type stripping, as server/stagecraft already does for shared/studio-spec.ts.
import * as MD from "../../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as PV from "../../src/modules/frame/engines/placeValue.logic.ts";
import * as NL from "../../src/modules/frame/engines/numberLine.logic.ts";
import * as DG from "../../src/modules/frame/engines/dataGraphs.logic.ts";
import * as GEO from "../../src/modules/frame/engines/geoboard.logic.ts";
import * as FR from "../../src/modules/frame/engines/fractions.logic.ts";
import * as FB from "../../src/modules/frame/engines/fractionBars.logic.ts";
import * as PT from "../../src/modules/frame/engines/patterns.logic.ts";
import * as COL from "../../src/modules/frame/engines/collections.logic.ts";
import * as MS from "../../src/modules/frame/engines/measure.logic.ts";
import { parseQ } from "../../src/modules/frame/kit/math.ts";

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v) => (typeof v === "string" || typeof v === "number" ? String(v).slice(0, 32) : null);
const ints = (v, max = 64) => (Array.isArray(v) && v.length <= max && v.every((x) => Number.isInteger(x) && x >= 0 && x < 1e7) ? v : null);
const shadedOf = (v) => { const m = /^(\d{1,3})\/(\d{1,3})$/.exec(String(v ?? "").trim()); return m ? { shaded: +m[1], parts: +m[2] } : null; };

/** Per engine: the act kinds it emits → a recompute on the server's params. Each returns true | false | null (cannot). */
const RECHECK = {
  "multiply-divide@1": { "md.product": (p, a) => (str(a.value) == null ? null : MD.productCorrect(MD.normalize(p), str(a.value))) },
  "place-value@1": {
    "pv.write": (p, a) => (str(a.written) == null ? null : PV.readCorrect(PV.normalize(p), str(a.written))),
    "pv.build": (p, a) => (ints(a.counts, 12) ? PV.buildCorrect(PV.normalize(p), a.counts) : null),
    "pv.compare": (p, a) => (typeof a.chosen === "string" ? PV.compareCorrect(PV.normalize(p), a.chosen) : null),
  },
  "number-line@1": {
    "nl.read": (p, a) => (str(a.value) == null ? null : NL.readCorrect(NL.normalize(p), str(a.value))),
    "nl.place": (p, a) => { const c = NL.normalize(p), q = parseQ(str(a.value)); const k = q ? NL.indexOf(c, q) : null; return k == null ? false : NL.placeCorrect(c, k); },
    "nl.jump": (p, a) => { const c = NL.normalize(p), q = parseQ(str(a.value)); const k = q ? NL.indexOf(c, q) : null; return k == null ? false : NL.placeCorrect(c, k); },
  },
  "data-graphs@1": {
    "dat.read": (p, a) => (str(a.given) == null ? null : DG.readCorrect(DG.normalize(p), str(a.given))),
    "dat.build": (p, a) => (ints(a.values, 16) ? DG.buildCorrect(DG.normalize(p), a.values) : null),
  },
  "geoboard@1": { "geo.claim": (p, a) => (Number.isFinite(a.claimed) ? GEO.measureCorrect(GEO.normalize(p, 48), String(a.claimed)) : null) },
  "fractions@1": {
    "fr.make": (p, a) => { const s = shadedOf(a.value); return s ? FR.makeCorrect(FR.normalize(p), s.shaded, s.parts) : null; },
    "fr.add": (p, a) => { const s = shadedOf(a.value); return s ? FR.addCorrect(FR.normalize(p), s.shaded, s.parts) : null; },
    "fr.equivalent": (p, a) => { const s = shadedOf(a.value), c = FR.normalize(p); return s && c.target ? FR.equivalentCorrect(c.target, s.shaded, s.parts) : null; },
    "fr.compare": (p, a) => { const c = FR.normalize(p); return a.chosen == null ? null : FR.compareCorrect(c.fractions, c.question, String(a.chosen)); },
    // round 2 content: name the shaded fraction (the act carries the built "top/bottom"), a fraction of a set (the number)
    "fr.name": (p, a) => { const s = shadedOf(a.value), c = FR.normalize(p); return s && !c.error && c.mode === "name" ? FR.nameCorrect(c, s.shaded, s.parts) : null; },
    "fr.of": (p, a) => { const c = FR.normalize(p); const v = typeof a.value === "number" ? a.value : /^\d{1,3}$/.test(String(a.value ?? "").trim()) ? Number(a.value) : null;
      return v != null && !c.error && c.mode === "of" ? FR.ofCorrect(c, v) : null; },
  },
  "fraction-bars@1": {
    compare_answer: (p, a) => { const c = FB.normalizeConfig(p); const fr = c.denominators.map((d, i) => ({ n: c.numerators[i], d }));
      return a.choice === "same" || Number.isInteger(a.choice) ? FB.compareCorrect(fr, c.question, a.choice) : null; },
  },
  "patterns@1": {
    "pat.term": (p, a) => (Array.isArray(a.given) && a.given.length <= 12 ? PT.growCorrect(PT.normalize(p), a.given.map((x) => String(x ?? ""))) : null),
    "pat.extend": (p, a) => (Array.isArray(a.tokens) && a.tokens.length <= 24 ? PT.repeatCorrect(PT.normalize(p), a.tokens.map((x) => (x == null ? null : String(x)))) : null),
  },
  "collections@1": {
    "col.total": (p, a) => (Number.isFinite(a.claimed) ? Number(a.claimed) === COL.normalize(p).n : null),
    "col.make": (p, a) => (Number.isFinite(a.made) ? Number(a.made) === COL.normalize(p).n : null),
    "col.compare": (p, a) => (typeof a.chosen === "string" ? COL.compareCorrect(COL.normalize(p), a.chosen) : null),
  },
  "measure@1": {
    "ms.read": (p, a) => (Number.isFinite(a.value) ? MS.readCorrect(MS.normalize(p), Number(a.value)) : null),
    "ms.set": (p, a) => (Number.isFinite(a.value) ? MS.readCorrect(MS.normalize(p), Number(a.value)) : null),
  },
};
/** Engines and act kinds the server can re-grade (tests and the coverage report read this). */
export const RECHECKABLE = Object.freeze(Object.fromEntries(Object.entries(RECHECK).map(([e, k]) => [e, Object.keys(k)])));

/**
 * @param {{ engine: string, params: object }} m  the mount as the SERVER planned it (s.module)
 * @param {object} data  the answer event's data ({ value: <act>, correct: <claim> })
 * @returns {{ correct: boolean, claimMismatch: boolean } | { unverifiable: true, why: string }}
 */
export function recheckEngineAnswer(m, data) {
  const act = isObj(data?.value) ? data.value : null;
  if (!act || typeof act.kind !== "string") return { unverifiable: true, why: "no_act" };
  const f = RECHECK[m?.engine]?.[act.kind];
  if (!f) return { unverifiable: true, why: `no_recheck:${m?.engine}:${act.kind}` };
  let v;
  try { v = f(m.params ?? {}, act); } catch { v = null; }
  if (typeof v !== "boolean") return { unverifiable: true, why: "act_unreadable" };
  return { correct: v, claimMismatch: typeof data.correct === "boolean" && data.correct !== v };
}
