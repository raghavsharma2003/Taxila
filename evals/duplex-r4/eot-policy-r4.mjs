// duplex r4: the end-of-turn POLICY simulator for round 4, on the round-3 pause tables (evals/duplex-r3/eot-table.mjs; real
// recorded adult Hindi, eot-bench CC BY 4.0, + the real STT events recorded live in round 2). It re-derives the engine's
// pause class from each row's covered words (the same markers the engine reads) under candidate rules, applies the free /
// question / chit-chat wait the governor applies (max(PAUSE_WAIT[class], pace)), and scores with evals/duplex-r3/eot-policy.mjs
// `score` exactly as eot.mjs scores the live engine. Parameters are CHOSEN ON TRAIN (even ids) only; TEST is reported.
//   node evals/duplex-r4/eot-policy-r4.mjs <table-MAI.json.gz> <table-D4.json.gz>
import { loadTable, score, brief } from "../duplex-r3/eot-policy.mjs";
import { ROOT } from "../duplex-real/lib.mjs";

const { valuesIn, normText } = await import(ROOT + "server/duplex/understand.js");

export const R3_WAIT = { hold: 1600, enumerating: 1200, question: 900, idk: 0, complete: 1100 };

/** The end shape of the covered words (markers.ts; both real lanes punctuate). */
export function endShape(text) {
  const tr = String(text ?? "").trim();
  if (!tr) return null;
  if (/[।॥.?？!]["'”’)]*$/u.test(tr)) return "terminal";
  if (/[,،]["'”’)]*$/u.test(tr)) return "comma";
  if (/[-–—]$/u.test(tr)) return "broken";
  return "unclosed";
}

/** The round-3 pause class (engineRules.ts pauseClass) from a table row. */
export function classR3(r) {
  if (r.holdReq || r.openTail || r.fillerTail || r.projection || r.repairOpen) return "hold";
  const es = endShape(r.text);
  if (es === "comma" || es === "broken") return "hold";
  if (r.idk) return "idk";
  const toks = normText(r.text ?? "").split(" ").filter(Boolean);
  const enumerating = es !== "terminal" && valuesIn(r.text ?? "").filter((v) => v.at >= toks.length - 4).length >= 2;
  if (enumerating) return "enumerating";
  if (r.qComplete) return "question";
  if (es === "unclosed" && r.cue === "value") return "hold";
  return "complete";
}

/**
 * A policy over a class function and a wait table. Outside free / question_to_her / chit_chat the row's own engine action
 * stands (closed answers are not changed by this work). `hardMs`: the governor's "hard enough" (text not yet covering audio).
 */
export function policyOf(classFn, W, { hardMs = 2000, pace = true } = {}) {
  const paceOf = new WeakMap();
  return (r, ep, ctx) => {
    if (!(r.exchange === "free" || r.exchange === "question_to_her" || r.exchange === "chit_chat")) return r.action === "SPEAK" || r.action === "CUT_IN";
    // pace: 1.3 x the longest earlier pause of this turn after which the speaker went on (capped 6 s)
    let p = paceOf.get(ep);
    if (p === undefined) {
      const eps = ctx.S.eps.filter((e) => e.turn === ep.turn && e.offAt < ep.offAt);
      const longest = Math.max(0, ...eps.map((e) => e.rows.at(-1).sil));
      p = pace ? Math.min(6000, 1.3 * longest) : 0;
      paceOf.set(ep, p);
    }
    const w = Math.max(W[classFn(r, ep, ctx)], p);
    if (r.sil < w || !r.text) return false;
    return r.unseen <= 120 || r.sil >= w + hardMs;
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tabs = process.argv.slice(2).map((f) => loadTable(f));
  for (const T of tabs) for (const split of ["train", "test", "all"]) console.log(T.rec, split.padEnd(5), JSON.stringify(brief(score(T, policyOf(classR3, R3_WAIT), split))));
}
