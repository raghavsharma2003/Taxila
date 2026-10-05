// Verify-A probe: clean recall of the red-team sets (rounds 1-3), their perturbed recall (sttReal, 20 dev seeds 2000+), and the
// red-team quiet sets. The report numbers come from run.mjs (sets redteam_verifyA_196 / redteam_quiet); this is the tuning view.
//   node evals/safety-robust/redteam-probe.mjs [--seeds 20] [--baseline] [--show]
import { scanSafetyDetail, readability } from "../../server/director/safety.js";
import * as C from "./corpora.mjs";
import { REDTEAM_DISTRESS as R1, REDTEAM_QUIET as Q1, REDTEAM_ROUND2, REDTEAM_QUIET2, REDTEAM_ROUND3, REDTEAM_QUIET3 } from "./redteam.data.mjs";
const REDTEAM_DISTRESS = [...R1, ...REDTEAM_ROUND2, ...REDTEAM_ROUND3], REDTEAM_QUIET = [...Q1, ...REDTEAM_QUIET2, ...REDTEAM_QUIET3];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const SEEDS = Number(arg("seeds", 20)), BASE = process.argv.includes("--baseline"), SHOW = process.argv.includes("--show");
const scan = (t) => { const d = scanSafetyDetail(t); return BASE && d.pass !== 1 ? { distress: false } : d; };
const items = REDTEAM_DISTRESS.map(([text, kind], i) => ({ id: `rt${i}`, segs: [text.split(/\s+/)], text, kind }));
const cleanMiss = items.filter((it) => !scan(C.cleanText(it)).distress);
const wrongKind = items.filter((it) => { const d = scan(C.cleanText(it)); return d.distress && d.kind !== it.kind; });
let rn = 0, rc = 0, ask = 0, miss = 0; const misses = new Map();
for (let k = 0; k < SEEDS; k++) for (const it of items) {
  const p = C.perturbedText(it, C.seedOf(it.id, 2000 + k));
  const lost = p.hallucinated.length > 0;
  const d = scan(p.text);
  if (!lost) { rn++; if (d.distress) rc++; else misses.set(p.text, it.text); }
  if (!d.distress) { if (readability(p.text).unreadable) ask++; else miss++; }
}
const qh = REDTEAM_QUIET.map((t) => ({ t, d: scan(t) })).filter((x) => x.d.distress);
console.log(`redteam ${BASE ? "PASS1-ONLY" : "both passes"}: clean ${items.length - cleanMiss.length}/${items.length} (wrong kind ${wrongKind.length}) | sttReal readable ${rc}/${rn} = ${(100 * rc / rn).toFixed(2)}% | missed-not-unreadable ${miss}/${items.length * SEEDS} | quiet hits ${qh.length}/${REDTEAM_QUIET.length} (pass1 ${qh.filter((x) => x.d.pass === 1).length})`);
if (SHOW) {
  for (const it of cleanMiss) console.log(`  CLEAN MISS [${it.kind}] ${it.text}`);
  for (const it of wrongKind) console.log(`  KIND ${it.kind} got ${scan(it.text).kind}: ${it.text}`);
  for (const x of qh) console.log(`  QUIET HIT [p${x.d.pass} ${x.d.via}] ${x.t}`);
  for (const [p, o] of [...misses].slice(0, 60)) console.log(`  STT MISS ${p}   <= ${o}`);
}
