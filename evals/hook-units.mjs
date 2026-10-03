// Hook turns that compare quantities across kinds (prod 2026-10-03: "45,000 fans" vs "4,500 km" in a "which is
// bigger" hook, kit c5-maths-ch01-t01, whose interest contexts list stadium crowds next to highway distances).
// Real text-lane reply calls (DEPLOY_REPLY, Azure), not part of `npm test`; costs a few cents:
//
//   NODE_USE_ENV_PROXY=1 node evals/hook-units.mjs [--n 12] [--topic c5-maths-ch01-t01] [--interest none|cricket] [--out file]
//
// Arms, same compiled instructions except the hook shape:
//   A  the hook shape WITHOUT the like-with-like constraint (the shape before 2026-10-03)
//   B  the shape WITH it (server/director/shapes.js hook)
// Each arm: n first drafts (one reply call each), scored by the code predicate (server/director/units.js
// mixedUnitComparison). B also runs the full guarded reply (routes/lesson.js textReply, which rewrites a flagged
// draft once and drops a comparison that survives) and scores what would reach the child. Every flagged text is
// printed so the predicate's calls can be read by hand (its precision is NOT measured by this script).
import fs from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 12));
const TOPIC = arg("--topic", "c5-maths-ch01-t01");
const OUT = arg("--out");
const INTEREST = arg("--interest", "none");   // "none": the shape lists the kit's first three contexts (the prod case)
const interests = INTEREST === "none" ? [] : [INTEREST];

const { getKit } = await import("../server/content/index.js");
const { initLessonState, step } = await import("../server/director/state.js");
const { instructionsFor } = await import("../server/compiler/instructions.js");
const { chat, DEPLOY } = await import("../server/azure.js");
const { mixedUnitComparison } = await import("../server/director/units.js");
const { __test } = await import("../server/routes/lesson.js");
const { BRIEF } = await import("../tests/fixtures/kit.mjs");

const kit = await getKit(TOPIC, { generate: false });
if (!kit) throw new Error(`no kit for ${TOPIC}`);
const CONSTRAINT = "; any bigger/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds";
const ctx = { firstName: "Aarav", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a curious parrot" }, ageBand: "10-15", lang: "hinglish",
  interests, firstMeeting: false, hasCallback: false, topicTitle: kit.title ?? TOPIC, classLevel: 5 };

/** The lesson state at its hook move (novice: greet → hook). */
function hookState(seed) {
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed, now: 0 }), { event: "start", kit, now: 0 });
  for (let i = 0; i < 3 && r.move.kind !== "hook"; i++) {
    r = step(r.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "test", flags: {} }, answer: "haan", text: "haan main ready hoon", now: (i + 1) * 20_000 });
  }
  if (r.move.kind !== "hook") throw new Error(`no hook move (got ${r.move.kind})`);
  return { ...r.state, brief: { ...BRIEF, ageBand: "10-15", interests }, mode: "text" };
}

const rows = { A: [], B: [], Bguarded: [] };
for (let i = 0; i < N; i++) {
  const s = hookState(1000 + i);
  const withC = instructionsFor(s, kit, "text");
  if (!withC.includes(CONSTRAINT.slice(2))) throw new Error("the hook shape does not carry the constraint (shapes.js changed?)");
  const without = withC.replace(CONSTRAINT, "");
  const user = { role: "user", content: "haan main ready hoon" };
  const [a, b, g] = await Promise.all([
    chat(DEPLOY.reply, [{ role: "system", content: without }, user], { maxTokens: 220, effort: "none", timeoutMs: 15000 }).then((x) => x.text.trim()),
    chat(DEPLOY.reply, [{ role: "system", content: withC }, user], { maxTokens: 220, effort: "none", timeoutMs: 15000 }).then((x) => x.text.trim()),
    __test.textReply({ instructions: withC, state: s, kit, childText: "haan main ready hoon", history: [] }),
  ]);
  rows.A.push(a); rows.B.push(b); rows.Bguarded.push(g.reply);
  process.stdout.write(".");
}
console.log();
const score = (xs) => xs.map((t) => ({ t, hit: mixedUnitComparison(t) }));
const out = { date: new Date().toISOString().slice(0, 10), topic: TOPIC, n: N, interest: INTEREST, deployment: DEPLOY.reply, arms: {} };
for (const [arm, xs] of Object.entries(rows)) {
  const sc = score(xs);
  out.arms[arm] = { flagged: sc.filter((x) => x.hit).length, n: xs.length, texts: sc.map((x) => ({ flagged: !!x.hit, kinds: x.hit?.kinds ?? null, text: x.t })) };
  console.log(`${arm.padEnd(9)} flagged ${out.arms[arm].flagged}/${xs.length}`);
  for (const x of sc) if (x.hit) console.log(`   [${x.hit.kinds.join(" vs ")}] ${x.t}`);
}
console.log("all texts (A then B), for reading the predicate by hand:");
for (let i = 0; i < N; i++) console.log(`  A${i}: ${rows.A[i]}\n  B${i}: ${rows.B[i]}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
