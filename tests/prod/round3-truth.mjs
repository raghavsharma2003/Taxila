// round3 truth acceptance (docs/design/round3/truth): the learning-loop record and grading truth, end to end through the
// real API. Runs against a local server (TAXILA_BASE=http://127.0.0.1:PORT; DB checks on the Neon TEST branch) and against
// taxila.dev (DB checks only with TAXILA_DB_URL set explicitly by the main loop; without it they WARN-skip).
//   A  the struggling child (w1c-reteach's: "999" to every item of c5-maths-ch02-t01, 30 turns)
//      A1 a reply that is only a wrong number is GRADED (verdict not_yet) on the first try of every number-key item — the
//         prod regression: grok-4-1-fast (prod's classifier) read some as off-topic, so the hint ladder and the re-teach
//         trigger never moved (prod w1c-reteach 7/13, 0 reteach_attempts rows)
//      A2 every re-teach move except a prerequisite descent has its reteach_attempts row (Decision Service: the action taken
//         is logged where it is taken)
//      A3 no arm is used twice on one skill in the lesson
//      A4 +1 day: every attempt resolves
//   B  the misconception child (c4-maths-ch05-t01: picks the misconception's option on a diagnostic, "999" elsewhere)
//      B1 the kit's remediation re-teach writes a row (trigger misconception_seen, chosen_by kit_primary, the kit's arm)
//      B2 and that arm is never chosen again in the lesson (the engine's first pick for a confirmed misconception used to be
//         that same kit arm)
//   D  no praise before a verdict: a turn with no verdict after a typed answer never tells the child it is right (rubric
//      written here, independent of server/director/say.js)
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/round3-truth.mjs [--parts A,B,D] [--turns 30]
import { withTestAccount, ok, warn, done, dbq } from "./lib.mjs";
import { advanceClock, kitItem, replyFor } from "./_w1c.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const PARTS = new Set(String(arg("parts", "A,B,D")).split(","));
const TURNS = Number(arg("turns", 30));
const hasDb = !!(await dbq("select 1 as x").catch(() => null));
if (!hasDb) warn("no database for this target (TAXILA_DB_URL): the row checks (A2-A4, B1-B2) are skipped; only API checks run");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PLAIN_NUMBER = /^\s*-?\d[\d,]*(?:[./]\d+)?\s*$/;
// independent praise rubric (not imported from the product's guard)
const PRAISE = /\b(?:aapne|tumne|you)\b[^.!?]{0,80}?\b(?:sahi|correct(?:ly)?|right)\s+(?:kaha|bataya|likha|likhi|pehchaa?na|pehchaa?ni|socha|pakda|nikala|got|said|found|identified|chuna|chuni|joda)\b|\bsahi (?:jawab|answer)\b(?!\s*(?:kya|kaun|hoga))|\bthat'?s (?:right|correct)\b|^\s*(?:bilkul|shabaa?sh|well done|great job|perfect|excellent)\b/iu;
const turnsAll = [];

/** Drive a typed lesson with a struggling child; returns the turns with what the child sent and what came back. */
async function struggle(api, childId, topicId) {
  const start = await api("POST", "/api/lesson/start", { childId, mode: "text", topicId });
  let ui = start.ui, seq = 0, prevAsk = null;
  const turns = [];
  for (let i = 0; i < TURNS; i++) {
    const rep = replyFor(ui, topicId, { wrong: true, explain: false });
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const askId = ui?.ask?.itemId ?? null;
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    const t = { i, askId, firstTry: askId && askId !== prevAsk, sent: body.childText, chip: !!rep.chip, move: r.move?.kind ?? null, verdict: r.ui?.verdict ?? null, reply: String(r.teacherReply ?? "") };
    turns.push(t); turnsAll.push(t);
    prevAsk = askId;
    ui = r.ui;
    if (r.end) break;
  }
  await api("POST", "/api/lesson/end", { lessonId: start.lessonId });
  return { lessonId: start.lessonId, turns };
}
const rowsOf = async (childId) => (hasDb ? dbq("select id, skill_id, misconception_id, arm_id, trigger, chosen_by, outcome, rewarded_at from reteach_attempts where child_id = $1 order by at, id", [childId]) : []);
const stateOf = async (lessonId) => (hasDb ? (await dbq("select state from lesson where id = $1", [lessonId]))[0]?.state ?? {} : {});
const descentsIn = (st) => Object.values({ ...(st.failedArms ?? {}) }).flat().concat(Object.values(st.lastArmBySkill ?? {})).filter((a) => String(a ?? "").startsWith("descent:")).length;
function noRepeat(rows) {
  const by = {};
  for (const r of rows) (by[r.skill_id] ??= []).push(r.arm_id);
  return Object.entries(by).filter(([, arms]) => new Set(arms).size !== arms.length).map(([k, arms]) => `${k.split("-").pop()}: ${arms.join(" → ")}`);
}

// ───────────── A. the struggling child ─────────────
if (PARTS.has("A")) await withTestAccount(async ({ api, child }) => {
  const TOPIC = "c5-maths-ch02-t01";
  const d = await struggle(api, child.id, TOPIC);
  console.log(`A moves: ${d.turns.map((t) => `${t.move}${t.verdict ? `:${t.verdict}` : ""}`).join(",")}`);
  const numberFirst = d.turns.filter((t) => t.firstTry && !t.chip && PLAIN_NUMBER.test(t.sent) && t.askId && PLAIN_NUMBER.test(String(kitItem(t.askId)?.answer ?? "")));
  const graded = numberFirst.filter((t) => t.verdict === "not_yet");
  ok(numberFirst.length > 0 && graded.length === numberFirst.length,
    `A1: a bare wrong number is graded not_yet on the first try of every number-key item (${graded.length}/${numberFirst.length}${numberFirst.length - graded.length ? `; ungraded: ${numberFirst.filter((t) => t.verdict !== "not_yet").map((t) => `${t.askId.split("-").pop()}=${t.verdict ?? "none"}`).join(", ")}` : ""})`);
  const reteaches = d.turns.filter((t) => t.move === "reteach").length;
  ok(reteaches >= 1, `A: the struggling child is re-taught (${reteaches} re-teach moves)`);
  if (!hasDb) return;
  await sleep(1500);
  const rows = await rowsOf(child.id);
  const st = await stateOf(d.lessonId);
  const descents = descentsIn(st);
  console.log(`A rows: ${rows.map((r) => `${r.skill_id.split("-").pop()}:${r.arm_id}(${r.trigger}/${r.chosen_by})`).join(" ") || "none"}; descents ${descents}`);
  ok(rows.length >= 1 && rows.length >= reteaches - descents, `A2: every re-teach move but a prerequisite descent has its row (${rows.length} rows for ${reteaches} re-teach moves, ${descents} descents)`);
  const rep = noRepeat(rows);
  ok(rep.length === 0, `A3: no arm is used twice on one skill in the lesson (${rep.join("; ") || "none repeated"})`);
  await advanceClock(api, 1);
  const s1 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: TOPIC });
  await api("POST", "/api/lesson/end", { lessonId: s1.lessonId }).catch(() => {});
  await sleep(3000);
  const after = await rowsOf(child.id);
  ok(after.length > 0 && after.every((r) => r.outcome), `A4: +1 day: every attempt resolves (${after.filter((r) => r.outcome).length}/${after.length}: ${after.map((r) => `${r.arm_id}=${r.outcome ?? "open"}`).join(" ")})`);
}, { tag: "r3truth-a", child: { firstName: "Kabir", classLevel: 5, languagePref: "english", interests: ["cricket"] } });

// ───────────── B. the misconception child ─────────────
if (PARTS.has("B")) await withTestAccount(async ({ api, child }) => {
  const TOPIC = "c4-maths-ch05-t01";
  const d = await struggle(api, child.id, TOPIC);
  console.log(`B moves: ${d.turns.map((t) => `${t.move}${t.verdict ? `:${t.verdict}` : ""}`).join(",")}`);
  const diagPicks = d.turns.filter((t) => String(t.askId ?? "").startsWith("diag:") && t.chip);
  if (!diagPicks.length) warn("B: no diagnostic was posed in this lesson: the kit re-teach path was not exercised");
  if (!hasDb) return;
  await sleep(1500);
  const rows = await rowsOf(child.id);
  console.log(`B rows: ${rows.map((r) => `${r.skill_id.split("-").pop()}:${r.arm_id}(${r.trigger}/${r.chosen_by})`).join(" ") || "none"}`);
  const kitRows = rows.filter((r) => r.trigger === "misconception_seen");
  const kitMoves = d.turns.filter((t, i) => t.move === "reteach" && String(t.askId ?? "").startsWith("diag:") && d.turns[i]?.chip).length;
  if (diagPicks.length) ok(kitRows.length >= Math.min(1, kitMoves), `B1: the kit's remediation re-teach writes its row (${kitRows.map((r) => `${r.arm_id}/${r.chosen_by}`).join(", ") || "none"}; ${kitMoves} re-teach moves right after a misconception pick)`);
  ok(kitRows.every((r) => r.chosen_by === "kit_primary" && r.misconception_id && String(r.arm_id).startsWith(r.misconception_id)), `B1: a kit row names the misconception and the kit's own arm (${kitRows.length} rows)`);
  const rep = noRepeat(rows);
  ok(rep.length === 0, `B2: no arm (the kit's included) is used twice on one skill in the lesson (${rep.join("; ") || "none repeated"})`);
}, { tag: "r3truth-b", child: { firstName: "Meher", classLevel: 4, languagePref: "hinglish", interests: ["cricket"] } });

// ───────────── D. no praise before a verdict ─────────────
if (PARTS.has("D")) {
  const ungraded = turnsAll.filter((t) => !t.verdict && !t.chip && t.sent && !/pata nahi/i.test(t.sent) && t.askId);
  const praised = ungraded.filter((t) => PRAISE.test(t.reply));
  ok(praised.length === 0, `D: no turn without a verdict tells the child the answer is right (${praised.length}/${ungraded.length}${praised.length ? `: ${praised.slice(0, 3).map((t) => `"${t.reply.slice(0, 90)}"`).join(" | ")}` : ""})`);
}
done();
