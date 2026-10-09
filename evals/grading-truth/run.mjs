// Grading-truth battery (VALUES-100 V1.1): randomised correct / incorrect / partial / hedge answers through EVERY live
// grading code path, labelled by construction (lib/oracle.mjs; no grader is imported to decide truth), run against a
// code tree given by --root. Run it on the working tree and on a temp copy with owner-truth patches 01-04 applied, and
// diff. No network unless --model N (then the lesson classifier's model leg runs on N sampled deferred cases).
//
//   node evals/grading-truth/run.mjs --root . --label baseline [--seed 7] [--scale 1] [--model 0]
//   node evals/grading-truth/run.mjs --root <copy> --label patched-01-04
//
// Verdicts are normalised to correct | incorrect | partial | abstain (null / NA / no_evidence / a model deferral).
// A WRONG GRADE is a non-abstain verdict that disagrees with the truth:
//   false_credit  truth is not correct (incorrect, partial, hedge, idk) and the verdict is correct
//   false_fail    truth is correct and the verdict is incorrect or partial
//   partial_miss  truth is partial and the verdict is incorrect (V1.1: multi-part keys are graded partial)
// An abstain on a real answer is not a wrong grade; it is reported as `uncredited` (the child's right answer earned
// nothing), per grader and per form kind.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import * as O from "./lib/oracle.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const MAIN = resolve(HERE, "../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg("--root", MAIN));
const LABEL = arg("--label", "baseline");
const SEED = Number(arg("--seed", 7));
const SCALE = Number(arg("--scale", 1));
const MODEL_N = Number(arg("--model", 0));
const STUDIO_STAMP = arg("--studio-stamp", "half");
const PARTS = arg("--parts", join(HERE, "data/parts-labels.json"));
// round2 truth stream: which classes' kits (default 4-7, the VALUES scope; "1-9" for every kit), a JSON dump of the model
// leg's raw rows (re-scored offline by evals/grading-truth/guard-eval.mjs), and a code guard applied to the SAME model
// labels (paired before/after on one set of model calls)
const CLASSES = (arg("--classes", "4-7").match(/^(\d)-(\d)$/) ?? [null, "4", "7"]).slice(1).map(Number);
const DUMP = arg("--dump-model", null);
const GUARD = arg("--guard", null);
const OUT = arg("--out", join(HERE, "results", new Date().toISOString().slice(0, 10)));
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

// one RNG stream per section, so a change in one section (or an archetype another stream adds mid-run) cannot shift the
// cases another section draws: two runs on two trees compare like for like
let R = O.rng(SEED);
const section = (k) => { R = O.rng(SEED * 1000 + k); };
const cases = [];
/** Record one graded case. */
function rec(c) { cases.push(c); }
const wrongKind = (truth, verdict) => {
  if (verdict === "abstain") return null;
  if (truth === "correct") return verdict === "correct" ? null : "false_fail";
  if (truth === "partial") return verdict === "correct" ? "false_credit" : verdict === "incorrect" ? "partial_miss" : null;
  return verdict === "correct" ? "false_credit" : null;   // incorrect | hedge | idk | malformed
};

// ───────────── kits (c4-c7, the VALUES scope) ─────────────
const KIT_FILES = readdirSync(join(MAIN, "data/kits")).filter((f) => { const m = /^c(\d)-.*\.json$/.exec(f); return m && +m[1] >= CLASSES[0] && +m[1] <= CLASSES[1]; }).sort();
const { getKit } = await imp("server/content/index.js");
const kits = [];
for (const f of KIT_FILES) {
  const j = JSON.parse(readFileSync(join(MAIN, "data/kits", f), "utf8"));
  for (const t of j.topics) { const k = await getKit(t.topicId, { generate: false }); if (k) kits.push({ kit: k, cls: j.class, subject: j.subject }); }
}
// Oracle's own key reader for kit answers: currency and a unit word stripped, then a plain value (else null = text key).
const UNIT_RE = /\s*(?:cm|mm|km|m|kg|g|mg|ml|l|litres?|liters?|metres?|meters?|grams?|minutes?|mins?|hours?|hrs?|seconds?|days?|years?|rupees?|°c|°|degrees?|sq\.? ?(?:cm|m|units?)|square (?:cm|m|units?)|units?|paise)\.?$/i;
const oracleKey = (a) => { const s = String(a ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").replace(UNIT_RE, "").trim(); return O.keyValue(s); };
const formsOf = (q) => (q.d === 1 ? O.intForms(q.n) : O.isTerminating(q) && q.d > 1 && !(q.n < q.d && q.d <= 12) ? [...O.decForms(q), ...O.fracForms(q)] : O.fracForms(q));
/** A wrong value near q, rendered in one of its own forms. */
function wrongOf(q) {
  if (q.d === 1) { const w = O.nearMiss(R, q.n); return { q: O.Q(w.v), why: w.why }; }
  const w = O.nearMissFrac(R, q); return { q: w.v, why: w.why };
}
// Review v1: unit families for the unit-swap case (oracle-side; no grader table imported)
const UNIT_FAM = [["mm", "cm", "dm", "m", "km"], ["sq mm", "sq cm", "sq dm", "sq m", "sq km"], ["g", "kg", "mg"], ["ml", "l"], ["seconds", "minutes", "hours"]];
function unitSwap(key) {
  const m = String(key).trim().match(/^(₹|rs\.?\s*)?(-?[\d,]+(?:\.\d+)?(?:\/\d+)?)\s*(sq\.?\s*(?:mm|cm|dm|m|km)|square (?:mm|cm|dm|m|km|metres?|centimetres?)|mm|cm|dm|m|km|kg|mg|g|ml|l|seconds?|minutes?|hours?)\.?$/i);
  if (!m) return null;
  let u = m[3].toLowerCase().replace(/^square /, "sq ").replace(/^sq\.?\s*/, "sq ").replace(/metres?$/, "m").replace(/centimetres?$/, "cm");
  if (/^(second|minute|hour)$/.test(u)) u += "s";
  const fam = UNIT_FAM.find((f) => f.includes(u));
  if (!fam) return null;
  const other = fam[(fam.indexOf(u) + 1) % fam.length];
  // area <-> length: the classic area/perimeter slip, taken half the time where the family is length or area
  const cross = u.startsWith("sq ") ? u.slice(3) : UNIT_FAM[1].includes(`sq ${u}`) ? `sq ${u}` : null;
  const to = cross && R.chance(0.5) ? cross : other;
  return { text: `${m[2]} ${to}`, from: u, to };
}
/** "soldier's" <-> "soldiers'" (the first possessive in the string), else null. */
function movedApostrophe(a) {
  const s = String(a);
  if (/\b(\w+?)s'(?=\s|$|[.,!?])/.test(s)) return s.replace(/\b(\w+?)s'(?=\s|$|[.,!?])/, "$1's");
  if (/\b(\w+)'s\b/.test(s)) return s.replace(/\b(\w+)'s\b/, "$1s'");
  return null;
}
// Review v1: number + words keys. DECISIVE words change what the number is; SWAP gives the classic confusion for a word
// (oracle-side lists, written from the kit census of 446 such keys; no grader table imported).
const DECISIVE = /(?:^|[^\p{L}])(?:a\.?m\.?|p\.?m\.?|am|pm|bce|bc|ce|ad|century|lakhs?|crores?|thousands?|hundreds?|tens|ones|tenths|hundredths|january|february|march|april|may|june|july|august|september|october|november|december)(?![\p{L}])|°\s*[ewns](?![\p{L}])/iu;
const SWAP = [["a.m.", "p.m."], ["p.m.", "a.m."], ["am", "pm"], ["pm", "am"], ["bce", "ce"], ["ce", "bce"], ["bc", "ad"], ["lakh", "crore"], ["crore", "lakh"],
  ["hundreds", "tens"], ["tens", "hundreds"], ["thousands", "hundreds"], ["ones", "tens"], ["tenths", "hundredths"], ["hundredths", "tenths"], ["edges", "faces"],
  ["faces", "vertices"], ["vertices", "edges"], ["corners", "sides"], ["sides", "corners"], ["°c", "°F"], ["june", "December"], ["right angles", "straight angles"],
  ["full turn", "half turn"], ["minutes", "hours"], ["hours", "minutes"], ["seconds", "minutes"], ["days", "weeks"], ["weeks", "days"], ["years", "months"]];
function nounTail(key) {
  const m = String(key).trim().match(/^(?:₹|rs\.?\s*)?(-?\d[\d,]*(?:\.\d+)?(?:\/\d+)?)\s*((?:th\b|st\b|nd\b|rd\b)?\s*[\p{L}°][\p{L}°²\s.']*)$/iu);
  if (!m) return null;
  const q = O.keyValue(m[1].replace(/,/g, ""));
  if (!q || UNIT_RE.test(` ${m[2]}`) && !/[\p{L}]{2,}\s+[\p{L}]/u.test(m[2]) && !DECISIVE.test(m[2])) return null;   // a plain unit: the num: block covers it
  return { q, num: m[1], tail: m[2].trim(), decisive: DECISIVE.test(m[2]) };
}
function swapTail(tail) {
  const low = tail.toLowerCase();
  for (const [a, b] of SWAP) { const re = new RegExp(`(^|[^\\p{L}])${a.replace(/[.]/g, "\\.")}(?![\\p{L}])`, "iu"); if (re.test(low)) return { tail: low.replace(re, `$1${b}`), from: a, to: b }; }
  return null;
}
const partsLabels = existsSync(PARTS) ? JSON.parse(readFileSync(PARTS, "utf8")) : { items: {} };

// ═════════════ 1. lesson classifier, deterministic path (server/director/classify.js classifyFast) ═════════════
const CL = await imp("server/director/classify.js");
section(1);
const deferred = [];
function lessonVerdict(target, text, extra = {}) {
  const args = { target, childText: text, heard: target.item?.prompt_en ?? "", asrConfidence: 0.92, typed: false, classLevel: 6, trace: [], lang: "english", ...extra };
  const f = CL.classifyFast(args);
  if (!f.result) return { verdict: "abstain", source: "deferred_to_model", args };
  const o = f.result.outcome;
  return { verdict: o === "correct" ? "correct" : o === "partial" ? "partial" : o === "incorrect" || o === "misconception" ? "incorrect" : "abstain", source: f.result.source, args };
}
const norm0 = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
let lessonItems = 0;
for (const { kit, cls, subject } of kits) {
  const items = kit.items.filter((i) => !["why", "teachback"].includes(i.kind));
  for (const item of items) {
    const target = CL.targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
    if (target.mode !== "item") continue;
    lessonItems++;
    const q = oracleKey(item.answer);
    const base = { grader: "lesson.classifyFast", path: "server/director/classify.js classifyFast", itemId: item.id, cls, subject, key: item.answer };
    const run = (text, truth, kind, meta = {}) => {
      const v = lessonVerdict(target, text, meta.extra);
      const c = { ...base, input: text, truth, kind, verdict: v.verdict, source: v.source, wrong: wrongKind(truth, v.verdict), ...meta.tag };
      rec(c);
      if (v.verdict === "abstain" && v.source === "deferred_to_model") deferred.push({ c, target, args: v.args });
    };
    if (q) {
      const forms = formsOf(q);
      for (let k = 0; k < Math.max(1, Math.round(2 * SCALE)); k++) {
        const f = R.pick(forms), w = R.pick(O.WRAPS);
        run(w.f(f.text), "correct", `num:${f.kind}+${w.kind}`);
      }
      const wv = wrongOf(q), wf = R.pick(formsOf(wv.q));
      run(wf.text, "incorrect", `num-wrong:${wv.why}:${wf.kind}`);
      // the sign slip and the decimal-point slip are the classic exact-match traps: always one of each where they apply
      if (q.d === 1 && q.n !== 0) run(String(-q.n), "incorrect", q.n < 0 ? "num-wrong:sign-dropped:digits" : "num-wrong:minus-added:digits");
      const dec = O.decimalStr(q);
      if (dec && dec.includes(".")) run(dec.replace(".", " "), "incorrect-or-abstain", "num-ambiguous:decimal-point-as-space");
      run(O.hedge(O.qStr(q), O.qStr(wv.q)), "hedge", "num-hedge");
      // Review v1 (2026-10-05): the SAME number with a different unit of the same dimension ("15 sq m" for "15 sq dm",
      // "24 m" for "24 sq m") is never the full key. Truth "unit-wrong": a wrong grade only if credited as correct.
      const sw = unitSwap(String(item.answer));
      if (sw) run(sw.text, "unit-wrong", `num-wrong:unit-swap(${sw.from}->${sw.to})`);
      run(O.selfCorrect(O.qStr(wv.q), O.qStr(q)), "correct", "num-self-correct");
    } else {
      const key = String(item.answer);
      // Review v1 (2026-10-05): a number followed by WORDS that are not a plain unit ("3 edges", "8 a.m.", "320 BCE coin",
      // "4 lakh", "16 tenths", "21 June"). oracleKey cannot read these, so before this block they were probed only as
      // text keys and the by-value grader was never tested on them. Truth is set by the oracle's own word lists.
      const nt = nounTail(key);
      if (nt) {
        const f = R.pick(formsOf(nt.q).filter((x) => x.kind !== "dev-digits"));
        run(`${f.text} ${nt.tail}`, "correct", `numnoun:${f.kind}+key-words`);
        const wv = wrongOf(nt.q);
        run(`${O.qStr(wv.q)} ${nt.tail}`, "incorrect", `numnoun-wrong:value(${wv.why})+key-words`);
        const sw = swapTail(nt.tail);
        if (sw) run(`${nt.num} ${sw.tail}`, "incorrect", `numnoun-wrong:words-swapped(${sw.from}->${sw.to})`);
        // a bare number where the words decide WHAT it is ("8" for "8 a.m.", "4" for "4 lakh") is not the full key
        // ...unless the question itself names that word and not its counterpart ("How many hundreds...?" -> "3" is complete)
        const dw = nt.decisive ? (nt.tail.toLowerCase().match(DECISIVE)?.[0] ?? "").replace(/^[^\p{L}°]+/u, "") : "";
        const counter = SWAP.find(([a]) => a === dw)?.[1]?.toLowerCase();
        const pr = String(item.prompt_en ?? "").toLowerCase();
        const named = dw && pr.includes(dw.replace(/s$/, "")) && !(counter && pr.includes(counter.replace(/s$/, "")));
        const bareTruth = !nt.decisive || named ? "correct" : "incomplete";
        run(nt.num, bareTruth, bareTruth === "correct" ? `numnoun:bare-number(${nt.decisive ? "question-names-it" : "count"})` : "numnoun:bare-number(words-decide)");
      }
      run(key, "correct", "text:verbatim-key");
      run(key.toUpperCase() + ".", "correct", "text:case-punct");
      // acceptable entries: truth from the two-rater parts labels when present, else the kit's own claim
      for (const a of (item.acceptable ?? []).slice(0, 4)) {
        const lab = partsLabels.items?.[item.id]?.acceptable?.[a];
        run(a, lab === "partial" ? "partial" : lab === "wrong" ? "incorrect" : "correct", lab ? `text:acceptable(${lab}, 2-rater)` : "text:acceptable(kit)", { tag: { truthSource: lab ? "two-rater" : "kit" } });
        // the same words inside a sentence: the exact path cannot match, so the MODEL decides (this is where a rubric that
        // reads every key as multi-part would call a complete single-part answer partial)
        if (lab) run(`mujhe lagta hai ${a}`, lab === "partial" ? "partial" : lab === "wrong" ? "incorrect" : "correct", `text:acceptable-in-sentence(${lab}, 2-rater)`, { tag: { truthSource: "two-rater" } });
      }
      // Review v1: an apostrophe item ("Add an apostrophe where needed") is graded on WHERE the apostrophe goes; the
      // other placement ("soldiers'" for "soldier's") is the misconception, never the key
      if (/apostrophe|possessive/i.test(item.prompt_en ?? "")) for (const a of [key, ...(item.acceptable ?? [])]) {
        const moved = movedApostrophe(a);
        if (moved && norm0(moved) !== "" && moved !== a) run(moved, "incorrect", "text-wrong:apostrophe-moved");
      }
      // a different answer from the same topic (never the same words)
      const other = R.shuffle(kit.items).find((o) => o.id !== item.id && norm0(o.answer) !== norm0(key) && ![key, ...(item.acceptable ?? [])].some((a) => norm0(a) === norm0(o.answer)) && !norm0(key).includes(norm0(o.answer)) && !norm0(o.answer).includes(norm0(key)));
      // WEAK truth: another item's key is assumed wrong for this one, but two items can share an answer ("p = 7" and
      // "... x = 7"); a disagreement here is listed for a human look, never counted as a proven wrong grade
      if (other) run(String(other.answer), "incorrect", "text-wrong:other-item-key(weak-truth)");
      // round2 truth (owner-1 on prod 2026-10-06: "tens first" for "25, 38, 52" was credited): a child repeating the
      // item's own first nudge ("Compare the tens first", "Which number has the fewest tens?") has not answered it. Only
      // hints 1-2 (rungs 3-4 often state the answer), and never one that matches a key / acceptable entry
      for (const h of (item.hints ?? []).slice(0, 2)) {
        const ht = String(h ?? "").replace(/[?]+\s*$/, "").trim();
        if (ht.split(/\s+/).length < 2 || [key, ...(item.acceptable ?? [])].some((a) => norm0(a) && (norm0(ht).includes(norm0(a)) || norm0(a).includes(norm0(ht))))) continue;
        run(ht, "incorrect", "text-wrong:hint-as-answer");
      }
      // negation of the key ("not X" / "X nahi"): never the key
      if (key.split(/\s+/).length <= 4) run(R.chance(0.5) ? `not ${key}` : `${key} nahi`, "incorrect", "text-wrong:negated-key");
      const parts = partsLabels.items?.[item.id]?.parts;
      if (Array.isArray(parts) && parts.length >= 2) run(R.pick(parts), "partial", "text-partial:one-part(2-rater)", { tag: { truthSource: "two-rater" } });
    }
    // the posed options (a diagnostic tap): opt:i chips graded in code
    if (item.options?.length) {
      const i = R.int(0, item.options.length - 1), o = item.options[i];
      run("", o.correct ? "correct" : "incorrect", "chip:opt", { extra: { chipId: `opt:${i}` } });
    }
  }
}
// "incorrect-or-abstain": a decimal written with a space is not a defined answer; it must just not be credited
for (const c of cases) if (c.truth === "incorrect-or-abstain") { c.truth = "incorrect"; c.wrong = c.verdict === "correct" ? "false_credit" : null; }

// ═════════════ 2. module answers (server/director/modules.js moduleAnswerOf → classifyFast moduleAnswer) ═════════════
section(2);
const MOD = await imp("server/director/modules.js");
const CAT = await imp("shared/engine-catalog.js");
const PROTO = await import(pathToFileURL(join(MAIN, "src/modules/frame/protocol.ts")).href);
const { frameVerdict } = await import(pathToFileURL(join(MAIN, "evals/engines-coverage.mjs")).href);
const L = {
  MD: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/multiplyDivide.logic.ts")).href),
  PV: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/placeValue.logic.ts")).href),
  NL: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/numberLine.logic.ts")).href),
  DG: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/dataGraphs.logic.ts")).href),
  GEO: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/geoboard.logic.ts")).href),
  FR: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/fractions.logic.ts")).href),
  PT: await import(pathToFileURL(join(MAIN, "src/modules/frame/engines/patterns.logic.ts")).href),
};
const topicMap = JSON.parse(readFileSync(join(MAIN, "shared/engine-topic-map.json"), "utf8"));
/** The answer event's `value` object exactly as each engine's view emits it (src/modules/frame/engines/*.tsx t.answer). */
function engineValue(engine, params, entry) {
  switch (engine) {
    case "multiply-divide@1": { const c = L.MD.normalize(params); return { kind: "md.product", value: entry, rows: c.a, cols: c.b, built_right: true }; }
    case "place-value@1": { const c = L.PV.normalize(params);
      if (c.mode === "compare") return null;
      if (c.mode === "build") { const counts = /^\d+$/.test(String(entry).trim()) ? L.PV.digitsOf(Number(entry), c.places) : []; return { kind: "pv.build", built: Number(entry), target: c.value, counts, canonical: true }; }
      return { kind: "pv.write", written: entry, value: c.value }; }
    case "number-line@1": { const c = L.NL.normalize(params); return c.mode === "read" ? { kind: "nl.read", value: entry, target_shown: true } : { kind: c.mode === "jump" ? "nl.jump" : "nl.place", value: entry, abs_err: 0, hops: 1 }; }
    case "data-graphs@1": { const c = L.DG.normalize(params); return { kind: "dat.read", question: c.question, given: entry }; }
    case "geoboard@1": { const c = L.GEO.normalize(params, 48); return { kind: "geo.claim", ask: c.ask, claimed: Number(entry) }; }
    case "fractions@1": { const c = L.FR.normalize(params); if (c.mode === "compare") return null; return { kind: c.mode === "add" ? "fr.add" : c.mode === "equivalent" ? "fr.equivalent" : "fr.make", value: entry, parts: c.parts }; }
    case "patterns@1": { const c = L.PT.normalize(params); return { kind: "pat.term", given: Array.from({ length: c.blanks }, (_, i) => (i === c.blanks - 1 ? entry : String(L.PT.growAt(c, i)))) }; }
    default: return null;
  }
}
// What the engines' NumPad can produce (src/modules/frame/kit/ui.tsx NumPad: digits, and −, /, . when the engine enables
// them; no comma, no space): the canonical numeral, and an unreduced fraction where the key is a fraction.
const typedForms = (q) => {
  const out = [{ text: O.qStr(q), kind: "digits" }];
  if (q.d > 1) out.push({ text: `${2 * q.n}/${2 * q.d}`, kind: "frac-unreduced" });
  return out;
};
let boundPlans = 0, noReplay = 0;
for (const { kit, cls } of kits) {
  for (const item of kit.items) {
    const plan = CAT.planEngine({ kit, item, lang: "english", mode: "show", topicMap });
    if (!plan?.bindItem) continue;
    const st = { module: null, turn: 1, ctx: { sessionId: null, lang: "english", classLevel: cls } };
    MOD.planModule(st, { kit, item, move: { kind: "practice" }, lang: "english", band: "B3" });
    if (!st.module || st.module.itemId !== item.id) { noReplay++; continue; }
    const key = String(item.answer).replace(/^(?:₹|rs\.?)\s*/i, "").replace(UNIT_RE, "");
    const q = O.keyValue(key);
    if (!q || engineValue(plan.engine, st.module.params, "1") === null) { noReplay++; continue; }
    boundPlans++;
    const state = { activeItemId: item.id, module: st.module };
    const target = CL.targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
    const wv = wrongOf(q);
    const acts = [...typedForms(q).map((f) => ({ ...f, truth: "correct" })), ...typedForms(wv.q).slice(0, 2).map((f) => ({ ...f, kind: `wrong:${wv.why}:${f.kind}`, truth: "incorrect" }))];
    for (const a of acts) {
      const honest = frameVerdict(plan.engine, st.module.params, a.text.trim());
      if (honest === null) continue;
      for (const claimArm of ["honest", "forged"]) {
        const claim = claimArm === "honest" ? !!honest : !honest;
        for (const shape of ["frame-protocol", "flat"]) {
          const value = engineValue(plan.engine, st.module.params, a.text);
          // frame-protocol: what the host really forwards (src/modules/frame/protocol.ts parse → toModuleEvent);
          // flat: the shape owner-truth patch 10's F1 test assumed ({ value: "82", correct })
          const ev = shape === "frame-protocol"
            ? PROTO.toModuleEvent(PROTO.parseModuleToHost({ type: "answer", moduleId: st.module.id, value, correct: claim }), plan.engine, 0)
            : { moduleId: st.module.id, engine: plan.engine, type: "answer", name: "answer", data: { value: a.text, correct: claim } };
          const ma = MOD.moduleAnswerOf(state, [ev]);
          const f = CL.classifyFast({ target, childText: "", moduleAnswer: ma, heard: "", classLevel: cls, trace: [] });
          const o = f.result?.outcome;
          const verdict = o === "correct" ? "correct" : o === "incorrect" ? "incorrect" : "abstain";
          rec({ grader: `module.${shape}`, path: "server/director/modules.js moduleAnswerOf", engine: plan.engine, itemId: item.id, cls, key: item.answer, input: a.text,
            truth: a.truth, kind: `${claimArm}-claim:${a.kind}`, claimArm, engineHonestVerdict: honest, verdict, source: ma?.source ?? null, wrong: wrongKind(a.truth, verdict) });
        }
      }
    }
  }
}

// ═════════════ 3. Studio W2-H host grader (server/studio/grade.js createGradeSession over qa/graders.js) ═════════════
section(3);
const SG = await imp("server/studio/grade.js");
const ARCH = await imp("server/studio/archetypes/index.js");
function genFromSchema(s, key = "") {
  if (s.enum) return R.pick(s.enum);
  switch (s.type) {
    case "object": { const o = {}; for (const [k, sub] of Object.entries(s.properties ?? {})) if ((s.required ?? []).includes(k) || R.chance(0.5)) o[k] = genFromSchema(sub, k); return o; }
    case "array": { const n = R.int(s.minItems ?? 1, Math.min(s.maxItems ?? 4, (s.minItems ?? 1) + 3)); return Array.from({ length: n }, (_, i) => { const x = genFromSchema(s.items, key); return x && typeof x === "object" && "id" in x ? { ...x, id: `i${i + 1}` } : x; }); }
    case "integer": return R.int(Math.max(s.minimum ?? 0, -50), Math.min(s.maximum ?? 50, 99));
    case "number": return R.int(Math.max(s.minimum ?? 0, -20), Math.min(s.maximum ?? 20, 40));
    case "string": return s.pattern ? `${["red", "blue", "gold", "teal", "lime", "plum"][R.int(0, 5)]}${R.int(0, 9)}` : `s${R.int(0, 99)}`;
    case "boolean": return R.chance(0.5);
    default: return null;
  }
}
/** Archetype-specific truth fill so random params pass validateParams (the oracle computes the keys itself). */
function fillTruth(id, p) {
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  switch (id) {
    case "shade_fraction": for (const it of p.items) it.n = R.int(1, it.d); break;
    case "balance_scale": for (const it of p.items) { if (sum(it.left) <= sum(it.right)) it.left.push(sum(it.right) - sum(it.left) + R.int(1, 9)); const miss = sum(it.left) - sum(it.right); it.options = R.shuffle([miss, miss + R.int(1, 5), Math.max(1, miss - R.int(1, 5)) === miss ? miss + 7 : Math.max(1, miss - R.int(1, 5))]); } break;
    case "number_line_jump": { p.min = 0; p.step = R.pick([1, 2, 5, 10]); p.max = p.step * R.int(4, 12); p.start = 0; p.format = "integer"; for (const it of p.items) it.target = p.step * R.int(1, Math.round(p.max / p.step)); break; }
    case "sort_bins": { p.binOf = Object.fromEntries(p.cards.map((c) => [c, R.pick(p.bins)])); break; }
    case "sequence_steps": p.order = R.shuffle(p.shown); break;
    case "process_chain": { p.askAfter = R.pick(p.stages.slice(0, p.cycle ? p.stages.length : p.stages.length - 1)); const i = p.stages.indexOf(p.askAfter); const nxt = p.stages[(i + 1) % p.stages.length]; p.options = R.shuffle([nxt, ...R.shuffle(p.stages.filter((x) => x !== nxt)).slice(0, 2)]); break; }
    case "labelled_parts": p.ask = R.pick(p.parts); break;
    case "hub_flows": p.answer = R.pick(p.options ?? ["in", "out", "up_in"]); break;
    case "slider_law": { p.x = { min: 0, max: 10, step: 1, start: 0 }; p.law = { type: "linear", k: R.int(1, 5), b: R.int(0, 5) }; const x = R.int(1, 10); const y = p.law.k * x + p.law.b; p.ask = { x, options: R.shuffle([y, y + 1, y + p.law.k]) }; break; }
  }
  return p;
}
/** The oracle's key(s) for one step of an archetype (independent of qa/graders.js). */
function oracleStudio(id, p) {
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  switch (id) {
    case "shade_fraction": return p.items.map((it) => ({ itemId: it.id, right: (v) => v && Number(v.n) === it.n && Number(v.d) === it.d, rightAct: { n: it.n, d: it.d }, wrongAct: { n: it.n === it.d ? it.n - 1 : it.n + 1, d: it.d } }));
    case "number_line_jump": return p.items.map((it) => ({ itemId: it.id, right: (v) => v && Number(v.value) === it.target, rightAct: { value: it.target }, wrongAct: { value: it.target + p.step } }));
    case "balance_scale": return p.items.map((it) => { const m = sum(it.left) - sum(it.right); return { itemId: it.id, right: (v) => v && Number(v.value) === m, rightAct: { value: m }, wrongAct: { value: it.options.find((o) => o !== m) } }; });
    case "bar_chart_read": case "pictograph": case "timeline": {
      const rows = id === "bar_chart_read" ? p.data : id === "pictograph" ? p.rows : p.events, val = (r) => (id === "timeline" ? r.year : r.value);
      const want = ["most", "latest"].includes(p.question) ? Math.max(...rows.map(val)) : Math.min(...rows.map(val));
      const winners = rows.filter((r) => val(r) === want).map((r) => r.key);
      const pickRight = R.pick(winners), loser = rows.find((r) => val(r) !== want)?.key;
      return [{ itemId: "q", right: (v) => winners.includes(v), rightAct: pickRight, wrongAct: loser, tie: winners.length > 1 }];
    }
    case "labelled_parts": return [{ itemId: "q", right: (v) => v === p.ask, rightAct: p.ask, wrongAct: p.parts.find((x) => x !== p.ask) }];
    case "process_chain": { const i = p.stages.indexOf(p.askAfter), nxt = p.stages[i + 1] ?? (p.cycle ? p.stages[0] : null); return [{ itemId: "q", right: (v) => v === nxt, rightAct: nxt, wrongAct: p.options.find((o) => o !== nxt) }]; }
    case "slider_law": { const y = p.law.k * p.ask.x + p.law.b; return [{ itemId: "q", right: (v) => v && Number(v.value) === y, rightAct: { value: y }, wrongAct: { value: y + 1 } }]; }
    case "sort_bins": return p.cards.map((c) => ({ itemId: c, right: (v) => v?.card === c && v?.bin === p.binOf[c], rightAct: { card: c, bin: p.binOf[c] }, wrongAct: { card: c, bin: p.bins.find((b) => b !== p.binOf[c]) ?? "x" } }));
    case "sequence_steps": return p.order.map((k, i) => ({ itemId: `pos${i}`, right: (v) => v?.key === k, rightAct: { key: k }, wrongAct: { key: p.order[(i + 1) % p.order.length] } }));
    default: return null;
  }
}
const MALFORMED = [null, undefined, "", {}, [], { value: "NaN" }, { value: null }, { n: null, d: null }, "<script>", { card: {}, bin: [] }, 42, true];
for (const id of ARCH.FRAME_ARCHETYPES) {
  const a = ARCH.archetype(id);
  if (!a.paramsSchema || !a.grader) continue;
  for (let rep = 0, made = 0; rep < 400 && made < Math.round(12 * SCALE); rep++) {
    const p = fillTruth(id, genFromSchema(a.paramsSchema));
    const errs = ARCH.validateParams(a, p);
    if (errs.length) continue;
    const steps = oracleStudio(id, p);
    if (!steps) break;
    made++;
    // Review v1: validateParams accepts repeated step keys in sequence_steps (no unique() check there), and the schema's
    // random keys can repeat. Such params are content the validator SHOULD reject; tagged so they are never mistaken for
    // a grader fault on valid content (see patches/V1-07).
    const dupKeys = id === "sequence_steps" && new Set(p.shown).size !== p.shown.length;
    // (a) in order, right first time; (b) a wrong try then the right one; (c) a remount mid-way, then the screen restarts at
    // step 1 and the child answers what is on screen; (d) malformed frame payloads
    const sess = SG.createGradeSession(id, p);
    sess.mount("k1");
    let screen = 0;
    const answer = (act, hint, truthRight, kind) => {
      const g = sess.grade(act, hint);
      const verdict = g.correct ? "correct" : "incorrect";
      const truth = truthRight ? "correct" : "incorrect";
      rec({ grader: "studio.w2h", path: "server/studio/grade.js createGradeSession", archetype: id, itemId: steps[screen]?.itemId, input: JSON.stringify(act)?.slice(0, 80), truth, kind: dupKeys ? `${kind}:invalid-dup-keys` : kind, verdict, wrong: wrongKind(truth, verdict) });
      return g.correct;
    };
    for (let s = 0; s < steps.length; s++) {
      screen = s;
      // --studio-stamp all: the V1-04 world, where the frame stamps the on-screen item on every answer. Default: half
      // the answers carry no id (today's frames). The coin is drawn either way so the RNG stream stays paired.
      // --studio-stamp seam: what V1-04 really delivers. The runtime stamps the first [data-item] in the document, and only
      // archetypes whose seam declares data-item (shade_fraction, number_line_jump) render one; every other kind sends none.
      const stamps = STUDIO_STAMP === "all" || (STUDIO_STAMP === "seam" && JSON.stringify(a).includes("data-item"));
      const coin = R.chance(0.5), st = steps[s], frame = coin && !stamps ? {} : { itemId: st.itemId };
      const tag = frame.itemId ? "item-stamped" : "no-item-id";
      if (R.chance(0.4) && st.wrongAct !== undefined && st.wrongAct !== null) answer(st.wrongAct, frame, st.right(st.wrongAct), `wrong-try:${tag}`);
      answer(st.rightAct, frame, true, `${st.tie ? "right:tie-member" : "right"}:${tag}`);
      if (s === Math.floor(steps.length / 2) && steps.length > 1 && R.chance(0.5)) {
        sess.mount(`k${rep}-${s}`);
        for (let t = 0; t <= s; t++) { screen = t; answer(steps[t].rightAct, stamps ? { itemId: steps[t].itemId } : {}, true, "right:after-remount"); }
      }
    }
    // a restart the host was NOT told about (no new mount key): the screen is back at step 1 and the child answers it right.
    // Truth: correct. This is the case the closed-item fallback in grade.js pick() exists for; a fix that removes the
    // fallback must show it as a cost here, not hide it.
    if (steps.length > 1) {
      const g3 = SG.createGradeSession(id, p); g3.mount("r");
      for (let s2 = 0; s2 < steps.length - 1; s2++) g3.grade(steps[s2].rightAct, {});
      const v = g3.grade(steps[0].rightAct, STUDIO_STAMP === "all" || (STUDIO_STAMP === "seam" && JSON.stringify(a).includes("data-item")) ? { itemId: steps[0].itemId } : {}).correct ? "correct" : "incorrect";
      rec({ grader: "studio.w2h", path: "server/studio/grade.js createGradeSession", archetype: id, itemId: steps[0].itemId, input: JSON.stringify(steps[0].rightAct)?.slice(0, 80), truth: "correct", kind: "restart-without-mount-key", verdict: v, wrong: wrongKind("correct", v) });
    }
    for (const m of R.shuffle(MALFORMED).slice(0, 3)) {
      const g2 = SG.createGradeSession(id, p); g2.mount("m");
      const v = g2.grade(m, {}).correct ? "correct" : "incorrect";
      rec({ grader: "studio.w2h", path: "server/studio/grade.js createGradeSession", archetype: id, itemId: steps[0].itemId, input: String(JSON.stringify(m)), truth: "malformed", kind: "malformed", verdict: v, wrong: wrongKind("malformed", v) });
    }
  }
}

// ═════════════ 4. Studio v2 specs (shared/studio-spec.ts gradeAnswer; extension specs via gradeAny) ═════════════
section(4);
const SS = await import(pathToFileURL(join(ROOT, "shared/studio-spec.ts")).href);
let EXT = null;
try { EXT = await import(pathToFileURL(join(ROOT, "shared/studio-spec-ext/index.ts")).href); } catch (e) { EXT = { error: String(e.message).slice(0, 120) }; }
const v2v = (g) => (g.verdict === "right" ? "correct" : g.verdict === "partial" ? "partial" : g.verdict === "wrong" ? "incorrect" : "abstain");
// Real orbital radii (AU), from published planetary data: the oracle for scale-cinematic, independent of shared PLANETS.
const AU_REAL = { mercury: 0.387, venus: 0.723, earth: 1.0, mars: 1.524, jupiter: 5.203, saturn: 9.537, uranus: 19.19, neptune: 30.07 };
function v2Cases(arch, spec) {
  const out = [];
  const fv = (s) => { const k = O.keyValue(s); return k ? O.qNum(k) : null; };
  switch (arch) {
    case "catch-on-line@1": spec.waves.forEach((w, i) => w.items.forEach((g) => g.forEach((lab) => { const t = fv(lab); if (t != null) out.push({ itemId: `w${i + 1}:${lab}`, act: t, truth: "correct" }, { itemId: `w${i + 1}:${lab}`, act: Math.min(w.line[1], t + 0.2 * (w.line[1] - w.line[0])), truth: "incorrect" }); }))); break;
    case "line-runner@1": spec.rounds.forEach((r, i) => r.calls.forEach((c, j) => { const t = fv(String(c).replace("−", "-")); if (t != null) out.push({ itemId: `r${i + 1}:${j}`, act: t, truth: "correct" }, { itemId: `r${i + 1}:${j}`, act: t + 0.2 * (r.range[1] - r.range[0]), truth: "incorrect" }); })); break;
    case "angle-cannon@1": spec.waves.forEach((w, i) => w.items.forEach((k, j) => { if (w.mode !== "classify") out.push({ itemId: `w${i + 1}:${j}`, act: k, truth: "correct" }, { itemId: `w${i + 1}:${j}`, act: k + 30, truth: "incorrect" }); })); break;
    case "angle-sum@1": { const k = 180 - spec.task[0] - spec.task[1]; out.push({ itemId: "third_angle", act: { angle: k }, truth: "correct" }, { itemId: "third_angle", act: { angle: k + 20 }, truth: "incorrect" }, { itemId: "third_angle", act: k, truth: "correct" }); break; }
    case "orbital-explainer@1": out.push({ itemId: "full_moon", act: 180, truth: "correct" }, { itemId: "evening_half_moon", act: 90, truth: "correct" }, { itemId: "evening_half_moon", act: 270, truth: "incorrect" }); break;
    case "scale-cinematic@1": { const au = AU_REAL[String(spec.ask).toLowerCase()]; if (au != null) out.push({ itemId: "place_planet", act: { au }, truth: "correct" }, { itemId: "place_planet", act: { au: au * 1.6 + 1 }, truth: "incorrect" }); break; }
    case "data-rush@1": spec.counts.forEach((c, i) => out.push({ itemId: `m${i + 1}`, act: { tally: c }, truth: "correct" }, { itemId: `m${i + 1}`, act: { tally: c + 3 }, truth: "incorrect" }));
      { const mean = spec.counts.reduce((a, b) => a + b, 0) / spec.counts.length; out.push({ itemId: "mean", act: { mean }, truth: "correct" }, { itemId: "mean", act: { mean: mean + 3 }, truth: "incorrect" }); }
      // an empty tally is no answer; it must never match a count of 0 by Number("") === 0
      spec.counts.forEach((c, i) => out.push({ itemId: `m${i + 1}`, act: { tally: "" }, truth: "malformed" }, { itemId: `m${i + 1}`, act: null, truth: "malformed" })); break;
    case "area-claim@1": spec.rounds.forEach((r, i) => {
      if (r.goal === "area") { const w = [1, 2, 3, 4, 5, 6, 8, 10, 12].find((x) => r.target % x === 0 && r.target / x <= 30) ?? 1; out.push({ itemId: `r${i + 1}`, act: { w, h: r.target / w }, truth: "correct" }, { itemId: `r${i + 1}`, act: { w, h: r.target / w + 1 }, truth: "incorrect" }); }
      else if (r.goal === "perimeter" && r.target % 2 === 0) { const w = 1, h = r.target / 2 - 1; if (h >= 1) out.push({ itemId: `r${i + 1}`, act: { w, h }, truth: "correct" }, { itemId: `r${i + 1}`, act: { w, h: h + 1 }, truth: "incorrect" }); }
    }); break;
    case "vault-heist@1": spec.rounds.forEach((r, i) => { let t = r.target; const counts = {}; for (const d of [1000, 100, 10, 1]) { counts[d] = Math.floor(t / d); t %= d; } out.push({ itemId: `r${i + 1}`, act: { counts }, truth: t === 0 ? "correct" : "skip" }, { itemId: `r${i + 1}`, act: { counts: { ...counts, 1: (counts[1] ?? 0) + 1 } }, truth: "incorrect" }); }); break;
  }
  return out.filter((c) => c.truth !== "skip");
}
for (const arch of SS.ARCHETYPES_V2) {
  const d = SS.ENGINE_SPECS[arch], spec = d.defaultSpec;
  const cs = v2Cases(arch, spec);
  for (const c of cs) { const g = SS.gradeAnswer(arch, spec, c.itemId, c.act); const v = v2v(g); rec({ grader: "studio.v2", path: "shared/studio-spec.ts gradeAnswer", archetype: arch, itemId: c.itemId, input: JSON.stringify(c.act), truth: c.truth, kind: c.truth === "malformed" ? "malformed" : `key-act:${c.truth}`, verdict: v, detail: g.detail ?? null, wrong: wrongKind(c.truth, v) }); }
  // every archetype: a malformed raw act on every item id it can name is never "right"
  const ids = new Set(cs.map((c) => c.itemId));
  for (const id of ids.size ? ids : ["q", "s1", "r1", "w1:0", "step:s1", "tap_vapour", "place_planet", "third_angle"]) for (const m of R.shuffle(MALFORMED).slice(0, 3)) {
    // Review v1: a bare number IS a well-formed act for the number archetypes (angle-cannon, catch-on-line, line-runner
    // take act: <number>), so 42 on an item whose key is 42 is a right answer, not a malformed one
    if (typeof m === "number" || typeof m === "boolean") continue;
    const v = v2v(SS.gradeAnswer(arch, spec, id, m)); rec({ grader: "studio.v2", path: "shared/studio-spec.ts gradeAnswer", archetype: arch, itemId: id, input: String(JSON.stringify(m)), truth: "malformed", kind: "malformed", verdict: v, wrong: wrongKind("malformed", v) });
  }
}
section(41);
if (EXT && !EXT.error) for (const arch of EXT.ARCHETYPES_EXT) {
  const d = EXT.ENGINE_SPECS_EXT[arch];
  let keys = []; try { keys = d.keys(d.defaultSpec); } catch { keys = []; }
  for (const k of keys.slice(0, 8)) for (const m of R.shuffle(MALFORMED).slice(0, 4)) {
    const v = v2v(EXT.gradeAny(arch, d.defaultSpec, k.itemId, m)); rec({ grader: "studio.v2-ext", path: "shared/studio-spec-ext gradeAny", archetype: arch, itemId: k.itemId, input: String(JSON.stringify(m)), truth: "malformed", kind: "malformed", verdict: v, wrong: wrongKind("malformed", v) });
  }
}

// ═════════════ 5. placement (server/placement/grade.js gradePlacement) ═════════════
section(5);
const PG = await imp("server/placement/grade.js");
const PB = await imp("server/placement/bank.js");
const bank = PB.loadBank().filter((it) => it.class >= 4 && it.class <= 7);
const pv = (x) => (x === true ? "correct" : x === false ? "incorrect" : "abstain");
const LET = "abcd";
for (const it of R.shuffle(bank).slice(0, Math.round(500 * SCALE))) {
  const base = { grader: "placement", path: "server/placement/grade.js gradePlacement", itemId: it.id, cls: it.class, key: it.answer };
  if (it.format === "mcq") {
    const shown = R.shuffle(it.options.map((o) => o.text));
    const right = shown.findIndex((t) => it.options.find((o) => o.text === t)?.correct);
    const wrongI = R.pick(shown.map((_, i) => i).filter((i) => i !== right));
    const numericTexts = shown.some((t) => /^\s*[1-4]\s*$/.test(t)), letterTexts = shown.some((t) => /^\s*[a-d]\s*$/i.test(t));
    for (const [i, truth] of [[right, "correct"], [wrongI, "incorrect"]]) {
      const forms = [{ r: shown[i], kind: "mcq:text" }, { r: `${shown[i]} hai`, kind: "mcq:text+hai" }, { r: shown[i].toUpperCase(), kind: "mcq:text-upper" }, { r: { option: i }, kind: "mcq:tap" }];
      if (!letterTexts) forms.push({ r: LET[i].toUpperCase(), kind: "mcq:letter" }, { r: `option ${LET[i]}`, kind: "mcq:option-letter" });
      if (!numericTexts) forms.push({ r: String(i + 1), kind: "mcq:index" });
      for (const f of R.shuffle(forms).slice(0, 3)) { const v = pv(PG.gradePlacement(it, f.r, shown)); rec({ ...base, input: JSON.stringify(f.r), truth, kind: f.kind, verdict: v, wrong: wrongKind(truth, v) }); }
    }
    continue;
  }
  const q = oracleKey(it.answer);
  if (!q) { rec({ ...base, input: "", truth: "skip", kind: "oracle-cannot-read-key", verdict: "abstain", wrong: null }); continue; }
  const forms = formsOf(q);
  for (let k = 0; k < 3; k++) { const f = R.pick(forms), w = R.pick(O.WRAPS), u = it.unit && R.chance(0.3) ? R.pick(O.UNIT_WRAPS) : null; const text = (u ? u.f : (x) => x)(w.f(f.text)); const v = pv(PG.gradePlacement(it, text)); rec({ ...base, input: text, truth: "correct", kind: `num:${f.kind}+${w.kind}${u ? "+" + u.kind : ""}`, verdict: v, wrong: wrongKind("correct", v) }); }
  const wv = wrongOf(q), wf = R.pick(formsOf(wv.q));
  for (const [text, truth, kind] of [[wf.text, "incorrect", `num-wrong:${wv.why}:${wf.kind}`], [O.hedge(O.qStr(q), O.qStr(wv.q)), "hedge", "num-hedge"],
    [O.selfCorrect(O.qStr(wv.q), O.qStr(q)), "correct", "num-self-correct"], [R.pick(["pata nahi", "I don't know", "i do not know", "mujhe nahi pata"]), "idk", "idk"]]) {
    const v = pv(PG.gradePlacement(it, text)); rec({ ...base, input: text, truth, kind, verdict: v, wrong: wrongKind(truth, v) });
  }
}

// ═════════════ 6. comprehension R-KEY (server/comprehension/grade/ops.js; dormant: exported, not called by a live route) ═════════════
section(6);
const OPS = await imp("server/comprehension/grade/ops.js");
const rk = (x) => (x === "correct" ? "correct" : x === "wrong" ? "incorrect" : "abstain");
for (const { kit } of R.shuffle(kits).slice(0, Math.round(120 * SCALE))) for (const item of kit.items.filter((i) => !["why", "teachback"].includes(i.kind)).slice(0, 4)) {
  const q = oracleKey(item.answer);
  const base = { grader: "comprehension.rKey(dormant)", path: "server/comprehension/grade/ops.js rKey", itemId: item.id, key: item.answer };
  if (q && q.d === 1) {
    const f = R.pick(O.intForms(q.n)), w = R.pick(O.WRAPS);
    let v = rk(OPS.rKey(w.f(f.text), q.n)); rec({ ...base, input: w.f(f.text), truth: "correct", kind: `num:${f.kind}+${w.kind}`, verdict: v, wrong: wrongKind("correct", v) });
    const wv = wrongOf(q); v = rk(OPS.rKey(String(wv.q.n), q.n)); rec({ ...base, input: String(wv.q.n), truth: "incorrect", kind: `num-wrong:${wv.why}`, verdict: v, wrong: wrongKind("incorrect", v) });
  } else if (!q && String(item.answer).split(/\s+/).length <= 3) {
    const key = { accept: [item.answer, ...(item.acceptable ?? [])] };
    for (const [text, truth, kind] of [[item.answer, "correct", "text:key"], [`${item.answer} nahi`, "incorrect", "text-wrong:negated(hi)"], [`not ${item.answer}`, "incorrect", "text-wrong:negated(en)"]]) {
      const v = rk(OPS.rKey(text, key)); rec({ ...base, input: text, truth, kind, verdict: v, wrong: wrongKind(truth, v) });
    }
  }
}

// ═════════════ 7. optional: the lesson classifier's MODEL leg on sampled deferred cases ═════════════
const modelRows = [], guardRows = [];
section(7);
if (MODEL_N > 0) {
  for (const line of readFileSync(join(MAIN, ".env.local"), "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
  await imp("server/net.js");
  // stratified over the six questions the model leg answers, equal shares, paired across trees (same seed, same pool)
  const bucket = (c) => /hint-as-answer/.test(c.kind) ? "hint-as-answer" : /acceptable-in-sentence\(complete/.test(c.kind) ? "complete-single-or-multi(2-rater)" : /partial/.test(c.kind) || c.truth === "partial" ? "partial(2-rater)"
    : /^num:/.test(c.kind) ? "number-forms-correct" : /^num-wrong/.test(c.kind) ? "number-wrong" : /^text-wrong/.test(c.kind) ? "text-wrong(negated/other)" : "hedge/self-correct/other";
  const NB = new Set(deferred.map((d) => bucket(d.c))).size;
  const pool = R.shuffle(deferred), per = Math.ceil(MODEL_N / NB), byB = {}, chosen = [];
  for (const d of pool) { const b = bucket(d.c); if ((byB[b] ?? 0) >= per) continue; byB[b] = (byB[b] ?? 0) + 1; d.c.bucket = b; chosen.push(d); }
  let i = 0;
  const guard = GUARD ? await import(pathToFileURL(resolve(GUARD)).href) : null;
  const vOf = (o) => (o === "correct" ? "correct" : o === "partial" ? "partial" : o === "incorrect" || o === "misconception" ? "incorrect" : "abstain");
  const work = async () => { while (i < chosen.length) { const d = chosen[i++]; try {
    const r = await CL.classify({ ...d.args, trace: [] });
    const o = r.outcome, verdict = vOf(o);
    // round3 truth: what code did to the model's label (corroborate's tag, classify's override), so a run on a patched tree
    // also says, on the SAME labels, what the unpatched rules would have output
    const row = { ...d.c, grader: "lesson.classify(model)", source: r.source, fallback: !!r.fallback, modelOutcome: o, verdict, wrong: wrongKind(d.c.truth, verdict),
      corroboration: r.corroboration ?? null, overridden: r.overridden ?? null,
      ...(r.source === "error" ? { error: "model unavailable (source error)" } : {}) };
    modelRows.push(row);
    if (guard) {
      const g = guard.corroborate({ target: d.target, text: d.args.childText, result: r });
      const gv = vOf(g.outcome);
      guardRows.push({ ...d.c, grader: "lesson.classify(model)+guard", source: r.source, modelOutcome: o, guardOutcome: g.outcome, guardWhy: g.why ?? null, verdict: gv, wrong: wrongKind(d.c.truth, gv) });
    }
  } catch (e) { modelRows.push({ ...d.c, grader: "lesson.classify(model)", verdict: "abstain", error: String(e.message).slice(0, 80), wrong: null }); } } };
  // Review v1: concurrency is a flag; the model leg shares the production deployment's rate limit (6 workers x 3 trees hit 429s)
  await Promise.all(Array.from({ length: Number(arg("--model-conc", 6)) }, work));
}

// ───────────── report ─────────────
const all = [...cases.filter((c) => c.truth !== "skip"), ...modelRows, ...guardRows];
if (DUMP) writeFileSync(DUMP, JSON.stringify(modelRows.map((r) => ({ itemId: r.itemId, input: r.input, truth: r.truth, kind: r.kind, bucket: r.bucket, modelOutcome: r.modelOutcome ?? null,
  source: r.source ?? null, error: r.error ?? null, fallback: !!r.fallback, corroboration: r.corroboration ?? null, overridden: r.overridden ?? null })), null, 0));
const groups = {};
for (const c of all) {
  const g = (groups[c.grader] ??= { n: 0, wrong: 0, false_credit: 0, false_fail: 0, partial_miss: 0, abstain: 0, uncredited: 0, byTruth: {}, byKindWrong: {}, byKindUncredited: {} });
  g.n++; g.byTruth[c.truth] = (g.byTruth[c.truth] ?? 0) + 1;
  if (c.verdict === "abstain") g.abstain++;
  if (c.verdict === "abstain" && c.truth === "correct") { g.uncredited++; g.byKindUncredited[c.kind] = (g.byKindUncredited[c.kind] ?? 0) + 1; }
  if (c.wrong) { g.wrong++; g[c.wrong]++; const k = `${c.wrong} · ${c.kind}`; g.byKindWrong[k] = (g.byKindWrong[k] ?? 0) + 1; }
}
const meta = { label: LABEL, root: ROOT, seed: SEED, scale: SCALE, studioStamp: STUDIO_STAMP, date: new Date().toISOString(), lessonItems, boundPlans, moduleNoReplay: noReplay, placementBank: bank.length,
  ext: EXT?.error ? `not loaded: ${EXT.error}` : `${EXT?.ARCHETYPES_EXT?.length ?? 0} extension archetypes`, classes: CLASSES, guard: GUARD,
  modelErrors: modelRows.filter((r) => r.error).length, modelN: MODEL_N, modelDeploy: MODEL_N ? (process.env.DEPLOY_CLASSIFY || process.env.DEPLOY_FAST || "taxila-fast") : null };
mkdirSync(OUT, { recursive: true });
const wrongRows = all.filter((c) => c.wrong);
writeFileSync(join(OUT, `${LABEL}.json`), JSON.stringify({ meta, summary: groups, wrong: wrongRows, uncreditedSample: all.filter((c) => c.verdict === "abstain" && c.truth === "correct").slice(0, 200), model: modelRows }, null, 1));
console.log(JSON.stringify(meta));
console.log(`total cases ${all.length}, wrong grades ${wrongRows.length}`);
for (const [g, s] of Object.entries(groups)) {
  console.log(`\n${g}: n=${s.n} wrong=${s.wrong} (false_credit ${s.false_credit}, false_fail ${s.false_fail}, partial_miss ${s.partial_miss}) abstain=${s.abstain} uncredited=${s.uncredited} truth=${JSON.stringify(s.byTruth)}`);
  for (const [k, n] of Object.entries(s.byKindWrong).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`   ${n}\t${k}`);
}
