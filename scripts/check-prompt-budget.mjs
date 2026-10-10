// Prompt budget gate through the REAL compiler (port of html-portfolio scripts/check-prompt-budget.mjs; harvest
// map §2.8 "budget gate through the real compiler, worst case pinned"). compile() already THROWS rather than
// truncates; this script hunts the worst cases a lesson can reach and proves they fit, so the throw is met here
// and never in a child's lesson:
//   - the kit items with the longest written prompts and diagnostics (the `lesson` and `last` sections),
//   - on both lanes × three languages × both age bands, at rung 0 and rung 3,
//   - with no floor correction, the LONGEST pair of corrections (FLOOR_FIX), and every family at once,
//   - plus the safeguard and wrap moves with a full-size child brief.
// Negative controls (in-run): a budget one token under the worst case must throw BudgetError, and so must a
// `last` cap too small for the turn-shape rule. A gate whose control passes is not a gate.
//   node scripts/check-prompt-budget.mjs [--top N]
import { readdirSync, readFileSync } from "node:fs";
import { normalizeKit } from "../server/content/kits.js";
import { compileWithReport, BudgetError, TOKEN_BUDGET, SECTION_CAPS, FLOOR_FIX } from "../server/compiler/compile.js";
import { CHARACTERS, sheetFor } from "../server/compiler/characters/index.js";

// Every sheet that can be served in a band: Asha in that band's register (classes 1-4 / 5-9; dc-r4-single-teacher-asha)
// and, for 10-15, Arjun too (the TAXILA_SINGLE_TEACHER=off rollback, and lessons pinned to him before round 4).
const sheetsFor = (ageBand) => (ageBand === "6-9" ? [sheetFor(CHARACTERS.asha, 3)] : [sheetFor(CHARACTERS.asha, 7), CHARACTERS.arjun]);
import { initLessonState, branchesFor } from "../server/director/state.js";
import { promptFor } from "../server/director/items.js";
import * as SH from "../server/director/shapes.js";
import { estimateTokens } from "../server/learner/brief.js";
import { realtimeDeliveryLine } from "../server/voice/expressive/compile/realtime.js";

const ALL = process.argv.includes("--all");   // every item (slow, ~2 min): the measurement run, not the gate
const TOP = ALL ? Infinity : Number(process.argv[process.argv.indexOf("--top") + 1]) || 60;
const LANGS = ["hinglish", "hindi", "english"];
const BANDS = ["6-9", "10-15"];
const DIR = new URL("../data/kits/", import.meta.url);

const kits = [];
for (const f of readdirSync(DIR).filter((n) => /^c\d+-[a-z]+\.json$/.test(n)).sort()) {
  let d; try { d = JSON.parse(readFileSync(new URL(f, DIR), "utf8")); } catch { continue; }
  for (const t of d.topics ?? []) { const kit = normalizeKit(t, { topicId: t.topicId, verified: true }); if (kit) kits.push({ kit, classLevel: d.class, subject: d.subject }); }
}
const pool = kits.flatMap(({ kit, classLevel, subject }) => kit.items.filter((i) => i.kind !== "teachback").map((item) => ({ kit, item, classLevel, subject,
  len: Math.max(...LANGS.map((l) => promptFor(item, l).length)) + (item.acceptable ?? []).join(", ").length + item.answer.length })));
pool.sort((a, b) => b.len - a.len);
const worst = pool.slice(0, TOP);

const brief = (ageBand, languagePref) => ({
  firstName: "Aarav", classLevel: ageBand === "6-9" ? 3 : 7, ageBand, languagePref,
  interests: ["cricket", "trains", "drawing", "cooking with nani"],
  recentWins: ["counting in tens", "halves of a roti", "plants need sunlight"],
  activeMisconceptions: ["a bigger bottom number means a bigger fraction", "heavier things always fall faster", "plants eat soil for food"],
  memoryCallbacks: ["got a new puppy", "loves mango season", "won a drawing contest"],
  vibe: { pace: "medium", verbosity: "chatty", humour: "medium" }, relationshipStage: "familiar (6 sessions together)",
});

const fixKeys = Object.keys(FLOOR_FIX);
let longestPair = [fixKeys[0], fixKeys[1]];
for (const a of fixKeys) for (const b of fixKeys) if (a < b && FLOOR_FIX[a].length + FLOOR_FIX[b].length > FLOOR_FIX[longestPair[0]].length + FLOOR_FIX[longestPair[1]].length) longestPair = [a, b];
const CORRECTIONS = ALL ? [longestPair] : [undefined, longestPair, fixKeys];

let n = 0, maxTotal = { tokens: 0 }, failures = [];
const maxSection = Object.fromEntries(Object.keys(SECTION_CAPS).map((k) => [k, 0]));
const run = (input, id) => {
  try {
    const r = compileWithReport(input);
    n++;
    if (r.tokens > maxTotal.tokens) maxTotal = { tokens: r.tokens, id, input, sum: r.sections.reduce((a, x) => a + x.tokens, 0) };
    for (const s of r.sections) maxSection[s.id] = Math.max(maxSection[s.id], s.tokens);
  } catch (e) {
    if (!(e instanceof BudgetError)) throw e;
    failures.push(`${id}: ${e.message}`);
  }
};

for (const { kit, item, classLevel, subject } of worst) {
  const topic = { title: kit.topicId, classLevel, subject };
  for (const lane of ["text", "voice"]) for (const language of LANGS) for (const ageBand of BANDS) for (const hintLevel of (ALL ? [3] : [0, 3])) for (const correction of CORRECTIONS) {
    for (const character of sheetsFor(ageBand)) {
    const s = initLessonState({ topicId: kit.topicId, kit, seed: 7, now: 0, ctx: { firstName: "Aarav", teacherName: character.name, teacherId: character.id,
      protege: character.protege, ageBand, lang: language, interests: ["cricket"], firstMeeting: false, hasCallback: true, topicTitle: "T", nextTitle: "N" } });
    Object.assign(s, { phase: "practice", introduced: kit.skills.map((k) => k.id), activeItemId: item.id, hintLevel, turn: 9, minutes: 6, moveVoiced: lane === "voice" && hintLevel > 0, correction,
      lastMove: hintLevel ? { kind: "hint", itemId: item.id, skillId: item.skillId, hintLevel, shape: SH.hint({ level: hintLevel, rungShape: item.hints[hintLevel - 1] }) }
        : { kind: "practice", itemId: item.id, skillId: item.skillId, hintLevel: 0, shape: SH.pose({ item, prefix: SH.CONFIRM.correct }) } });
    run({ character, brief: brief(ageBand, language), lessonState: s, move: s.lastMove, item, content: [], topic, language, lane,
      ...(lane === "voice" ? { branches: branchesFor(s, kit) } : {}) }, `${item.id}·${character.id}·${lane}·${language}·${ageBand}·r${hintLevel}·${correction ? correction.length : 0}fix`);
    }
  }
}
// The closing moves with a full brief (no item): safeguard (the helpline must always fit) and wrap.
const { kit, classLevel, subject } = kits[0];
for (const lane of ["text", "voice"]) for (const language of LANGS) for (const ageBand of BANDS) for (const kind of ["safeguard", "wrap"]) {
  for (const character of sheetsFor(ageBand)) {
  const s = initLessonState({ topicId: kit.topicId, kit, seed: 7, now: 0, ctx: { firstName: "Aarav", teacherName: character.name, teacherId: character.id,
    protege: character.protege, ageBand, lang: language, interests: [], firstMeeting: false, hasCallback: false, topicTitle: "T", nextTitle: "N" } });
  Object.assign(s, { phase: "practice", turn: 9, minutes: 6, correction: fixKeys, lastMove: { kind, shape: kind === "safeguard" ? SH.safeguardStay() : "a short warm close" } });
  run({ character, brief: brief(ageBand, language), lessonState: s, move: s.lastMove, content: [], topic: { title: kit.topicId, classLevel, subject }, language, lane }, `${kind}·${character.id}·${lane}·${language}·${ageBand}`);
  }
}

console.log(`compiled ${n} worst-case lesson states from the ${worst.length} longest of ${pool.length} items (${kits.length} topics)`);
console.log(`total: worst ${maxTotal.tokens} / ${TOKEN_BUDGET} tokens (${maxTotal.id}); headroom ${TOKEN_BUDGET - maxTotal.tokens}`);
console.log(`sections (worst / cap): ${Object.entries(maxSection).map(([k, v]) => `${k} ${v}/${SECTION_CAPS[k]}`).join(" · ")}`);
console.log(`longest correction pair: ${longestPair.join(" + ")} (${FLOOR_FIX[longestPair[0]].length + FLOOR_FIX[longestPair[1]].length} chars)`);

// The realtime lane's delivery note (W2-D lane A, flagged): the browser inserts it into the voice instructions just before
// their last line (src/lesson/voiceLink.ts withDeliveryNote), so the worst compile plus the longest note must still fit.
let longestNote = "";
for (const display of ["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"])
  for (const move of ["greet", "hook", "explain", "worked_example", "probe", "hint", "reteach", "celebrate", "break", "wrap", "repair", "show_module"])
    for (const band of ["B1", "B2", "B3", "B4"]) for (const engagement of ["engaged", "strained"]) {
      const line = realtimeDeliveryLine({ move, verdict: "ungraded", engagement, teacherAffect: { display, intensity: 2, cause: "none", turn: 1 }, safety: false, band });
      if (line && line.length > longestNote.length) longestNote = line;
    }
const noteTokens = estimateTokens(longestNote) + 1;
console.log(`lane-A delivery note: longest ${longestNote.length} chars (${noteTokens} tokens); worst + note ${maxTotal.tokens + noteTokens} / ${TOKEN_BUDGET}`);
if (maxTotal.tokens + noteTokens > TOKEN_BUDGET) failures.push(`lane-A delivery note: worst ${maxTotal.tokens} + note ${noteTokens} tokens is over the ${TOKEN_BUDGET} budget`);

// negative controls: under pressure compile() sheds WHOLE droppable parts or throws — it never slices
const controls = [];
try {
  const r = compileWithReport(maxTotal.input, { budget: maxTotal.sum - 1 });   // the budget is checked on the section sum
  if (!r.dropped.length) controls.push("one token under the worst case neither shed a whole part nor threw");
  if (!r.text.split("\n").at(-1).startsWith("TURN SHAPE")) controls.push("shedding cut the turn-shape line");
} catch (e) { if (!(e instanceof BudgetError)) throw e; }
try { compileWithReport(maxTotal.input, { budget: 300 }); controls.push("a 300-token budget did NOT throw"); } catch (e) { if (!(e instanceof BudgetError)) throw e; }
try { compileWithReport(maxTotal.input, { caps: { last: 10 } }); controls.push("a 10-token last cap did NOT throw"); } catch (e) { if (!(e instanceof BudgetError)) throw e; }
for (const c of controls) console.log(`FAIL  negative control: ${c}`);
if (!controls.length) console.log("negative controls: one under sheds whole parts; 300-token budget and 10-token last cap throw BudgetError");

for (const f of failures.slice(0, 20)) console.log(`FAIL  ${f}`);
if (failures.length || controls.length) { console.log(`\n${failures.length} compile(s) over budget, ${controls.length} control(s) passed — FAIL`); process.exit(1); }
console.log("prompt budget: PASS");
