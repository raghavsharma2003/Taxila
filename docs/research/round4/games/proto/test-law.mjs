// node docs/research/round4/games/proto/test-law.mjs [acts.json]
// Checks the prototype's law the way tests/play-logic.test.mjs checks a family: every generated level solvable by its own
// solver, shortcut-free, discriminating its focus belief, mal-rule shots graded to their kit misconception, garbage acts
// ignored, and (given the act log a browser run saved) the server-side replay agrees with what the game showed.
import { readFileSync } from "node:fs";
import { generate, solve, grade, malShot, shortcut, SKILLS, MIS, evidenceRows } from "./law.js";
import { compose, cleanDress } from "./director.js";

let pass = 0, fail = 0; const bad = [];
const ok = (c, msg) => { if (c) pass++; else { fail++; if (bad.length < 12) bad.push(msg); } };
const genMs = [], composeMs = [];
let levels = 0, nulls = 0;
for (const skillId of Object.keys(SKILLS)) for (const fade of [1, 2, 3]) for (const focus of [null, ...Object.keys(MIS)]) for (let seed = 1; seed <= 40; seed++) for (const linePx of [300, 640]) {
  const L = generate({ skillId, focusMal: focus, fade, seed, linePx });
  if (!L) { nulls++; continue; }
  levels++; genMs.push(L.proof.genMs);
  ok(shortcut(L) === null, `shortcut ${skillId} f${fade} ${seed}`);
  ok(!focus || L.proof.discriminates.includes(focus), `focus ${focus} not discriminated`);
  ok(L.tol * linePx / (L.hi - L.lo) >= 7.99, `tol under 8 px`);
  const g = grade(L, solve(L)); ok(g.solved, `solver fails ${skillId} f${fade} s${seed}`);
  for (const m of L.proof.discriminates) for (let i = 0; i < L.values.length; i++) {
    const x = malShot(L, i, m); if (x === null) continue;
    const gi = grade(L, [{ k: "fire", i, x }]).per[i];
    if (Math.abs(x - L.values[i].p / L.values[i].q) < 2.5 * L.tol) continue;   // this value does not separate m
    ok(gi.outcome === "incorrect" && gi.misconceptionId === MIS[m], `mal ${m} graded ${JSON.stringify(gi)}`);
  }
  // forged / garbage acts change nothing
  const junk = [{ k: "fire", i: 9, x: 0.5 }, { k: "fire", i: 0, x: NaN }, { k: "claim", solved: true }, null, { k: "fire", i: "0", x: 1 }];
  ok(!grade(L, junk).per.some(Boolean), "junk act graded");
  ok(evidenceRows(L, g).every((r) => r.skillId === skillId && r.outcome === "correct"), "evidence rows");
}
for (let s = 1; s <= 200; s++) composeMs.push(compose({ skillId: "c5-maths-ch02-t01-s2", misconceptionSeen: MIS["count-marks"], fade: 1, seed: s, linePx: 300 }, { theme: "laal-grah", music: "loud!!" }).composeMs);
const d = cleanDress({ theme: "laal-grah", music: "loud!!", wrapper: "Kill the aliens and win coins" });
ok(d.dress.music === "calm" && d.dropped.includes("music") && d.dropped.includes("wrapper"), "dress enums enforced");

// optional: replay a browser act log (saved by measure/run.mjs) through the same grader, as the server would
if (process.argv[2]) {
  const log = JSON.parse(readFileSync(process.argv[2], "utf8"));
  let agree = 0, n = 0;
  for (const run of log.levels ?? []) { n++; const g = grade(run.level, run.acts); if (JSON.stringify(g.per.map((p) => p && [p.outcome, p.misconceptionId ?? null])) === JSON.stringify(run.shown)) agree++; }
  ok(agree === n, `replay disagreed ${n - agree}/${n}`);
  console.log(`replay: ${agree}/${n} browser levels re-graded identically`);
}
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
console.log(`levels ${levels} (null ${nulls} = director falls back) · gen p50 ${q(genMs, 0.5).toFixed(2)} ms p95 ${q(genMs, 0.95).toFixed(2)} ms · compose p50 ${q(composeMs, 0.5).toFixed(2)} p95 ${q(composeMs, 0.95).toFixed(2)} ms`);
console.log(`checks ${pass} pass, ${fail} fail`); for (const b of bad) console.log("  FAIL", b);
process.exit(fail ? 1 : 0);
