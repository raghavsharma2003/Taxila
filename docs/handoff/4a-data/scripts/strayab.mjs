// The Bengali-token question (6c45a7ea t26): which perturbed safety-robust draws would stop being "unreadable" (re-ask +
// model read on the rest) under a share threshold, and how many of those are distress draws the predicate missed.
import { scanSafetyDetail, readability } from "/home/user/Taxila/server/director/safety.js";
import * as C from "/home/user/Taxila/evals/safety-robust/corpora.mjs";
import { HARD_NEGATIVES, HELDOUT_DISTRESS } from "/home/user/Taxila/evals/safety-robust/negatives.data.mjs";
import { REDTEAM_DISTRESS, REDTEAM_ROUND2, REDTEAM_ROUND3, REDTEAM_QUIET, REDTEAM_QUIET2, REDTEAM_QUIET3 } from "/home/user/Taxila/evals/safety-robust/redteam.data.mjs";
const SEEDS = 20, THS = [0.15, 0.2, 0.25, 0.34];
const words = (t) => t.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
const moves = (text, th) => { const r = readability(text); return r.unreadable && r.share < th && words(r.readable) >= 3; };
const D = { fdb: C.taxilaFdbDistress(), es3: C.es3Distress(), held: HELDOUT_DISTRESS.map(([text], i) => ({ id: `held${i}`, segs: [text.split(/\s+/)], text })),
  cv2: (await C.conversationV2Distress()).filter((x) => x.text).map((x) => ({ ...x, segs: [x.text.split(/\s+/)] })),
  red: [...REDTEAM_DISTRESS, ...REDTEAM_ROUND2, ...REDTEAM_ROUND3].map(([text], i) => ({ id: `red${i}`, segs: [text.split(/\s+/)], text })) };
for (const [name, items] of Object.entries(D)) {
  const row = { draws: 0, askAgain: 0 }; for (const th of THS) row[th] = { moved: 0, askLost: 0, segLost: 0 };
  for (let k = 0; k < SEEDS; k++) for (const it of items) {
    const p = C.perturbedText(it, C.seedOf(it.id, k)); row.draws++;
    const d = scanSafetyDetail(p.text); const un = readability(p.text).unreadable;
    if (!d.distress && un) row.askAgain++;
    const lost = it.distressSeg != null ? p.hallucinated.includes(it.distressSeg) : p.hallucinated.length > 0;
    for (const th of THS) if (moves(p.text, th)) { row[th].moved++; if (!d.distress) { row[th].askLost++; if (lost) row[th].segLost++; } }
  }
  console.log(name.padEnd(5), "draws", row.draws, "ask-again today", row.askAgain, THS.map((th) => `| <${th}: moved ${row[th].moved}, predicate-missed ${row[th].askLost} (distress seg hallucinated ${row[th].segLost})`).join(" "));
}
const F = { es1: C.es1Turns(), fdbLesson: C.taxilaFdbLesson(), hnPlain: HARD_NEGATIVES.filter((x) => x.plain), quiet: [...REDTEAM_QUIET, ...REDTEAM_QUIET2, ...REDTEAM_QUIET3].map((text, i) => ({ id: `rq${i}`, text })) };
for (const [name, items] of Object.entries(F)) {
  const per = name === "es1" ? 3 : SEEDS; let n = 0, un = 0; const mv = Object.fromEntries(THS.map((t) => [t, 0]));
  for (let k = 0; k < per; k++) for (const it of items) { const segs = it.segs ?? [String(it.text).split(/\s+/).filter(Boolean)]; const p = C.perturbedText({ ...it, segs }, C.seedOf(it.id, k), { punct: false }); n++; if (readability(p.text).unreadable) un++; for (const th of THS) if (moves(p.text, th)) mv[th]++; }
  console.log(name.padEnd(9), "lesson draws", n, "unreadable today", un, THS.map((th) => `| <${th}: graded instead ${mv[th]}`).join(" "));
}
