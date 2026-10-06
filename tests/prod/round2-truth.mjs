// round2 truth acceptance (docs/design/round2/truth): the four regressions / bars of the truth stream, end to end through
// the real API, runnable against a local server (TAXILA_BASE=http://127.0.0.1:PORT, Neon TEST branch by default) and
// against taxila.dev (TAXILA_DB_URL set explicitly by the main loop for the DB checks; without it they WARN-skip).
//   A  the lesson END closes an open item episode: a wrong typed answer on an open item, then End, writes its C4 row
//      (prod w1b-mounts 2026-10-06: an open wrong commit followed by the end wrote nothing)
//   B  the re-teach ladder is never cut off by the pace park: no skill ends the lesson pace-parked with an arm in flight,
//      a skill that failed two arms goes to a prerequisite descent (or the engine's park), and at the next lesson start
//      every attempt resolves (prod w1c-reteach 10/13)
//   C  the next-day check: after a day-0 lesson with a teach-back, a day-0 skill is learned_today; +1 day the opener of a
//      lesson on ANOTHER topic is a day-0 item (C31); +2 days the certifying check leads on an item never met, and a right
//      answer makes the skill mastered with the delayed flag (V1.3) (prod w1c-three-day 16/23)
//   D  typed grading: randomised right / wrong-by-construction answers on the items the lessons pose; 0 credits of a
//      proven-wrong answer (prod owner-1: 3/60). Wrong-by-construction forms: the item's first nudge (hint 1-2), a number
//      sequence reversed, the key's numbers replaced by numbers nobody mentioned; "other item's key" is weak truth
//      (reported, never counted as proven).
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/round2-truth.mjs [--parts A,B,C,D] [--seed 7] [--turns 14]
import { withTestAccount, ok, warn, done, dbq, isLocal } from "./lib.mjs";
import { driveLesson, advanceClock, kitItem, kitTopic, topicOfItem, replyFor, fadeItemOf } from "./_w1c.mjs";
import { outcomeName } from "../../server/learner/kt/outcomes.js";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const PARTS = new Set(String(arg("parts", "A,B,C,D")).split(","));
let seed = Number(arg("seed", 7)) >>> 0;
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const hasDb = !!(await dbq("select 1 as x").catch(() => null));
if (!hasDb) warn("no database for this target (TAXILA_DB_URL): the row checks of A, B and C are skipped; only API checks run");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = async (lessonId) => (hasDb ? (await dbq("select state from lesson where id = $1", [lessonId]))[0]?.state ?? null : null);

// ───────────── A. the lesson end closes an open episode ─────────────
if (PARTS.has("A")) await withTestAccount(async ({ api, child }) => {
  const TOPIC = "c5-maths-ch01-t01";
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: TOPIC });
  let ui = s.ui, seq = 0, target = null;
  for (let i = 0; i < 12 && !target; i++) {
    const it = ui?.ask?.itemId ? kitItem(ui.ask.itemId) : null;
    if (it && !it.options && !ui?.chips?.length && ["practice", "retrieval", "near_transfer", "contrast", "error_spot"].includes(it.kind)) { target = it; break; }
    const rep = replyFor(ui, TOPIC, { explain: false });
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, typed: true, turnSeq: ++seq, ...body });
    ui = r.ui;
    if (r.end) break;
  }
  ok(!!target, `A: the lesson posed an open kit item (${target?.id ?? "none in 12 turns"})`);
  if (!target) return;
  const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, typed: true, turnSeq: ++seq, childText: "999" });
  ok(r.ui?.verdict !== "correct", `A: the wrong answer "999" is not credited (verdict ${r.ui?.verdict ?? "none"})`);
  const still = r.ui?.ask?.itemId === target.id;
  if (!still) warn(`A: the Director left the item on the wrong answer (move ${r.move?.kind}); the turn itself closed the episode`);
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId });
  if (!hasDb) return;
  await sleep(2500);
  const rows = await dbq("select cls, outcome, via, item_key from kt_evidence where child_id = $1 and session_id = $2 and item_key = $3", [child.id, s.lessonId, target.id]);
  const names = rows.map((x) => outcomeName(x.cls, x.outcome));
  ok(names.includes("C4"), `A: the open episode the lesson ended on wrote its miss row (${rows.map((x, i) => `${x.cls}:${names[i]}`).join(",") || "no row"})`);
}, { tag: "r2truth-a", child: { firstName: "Riya", classLevel: 5, languagePref: "english" } });

// ───────────── B. the re-teach ladder ─────────────
if (PARTS.has("B")) await withTestAccount(async ({ api, child }) => {
  const TOPIC = "c5-maths-ch02-t01";
  const d0 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 30, wrong: () => true, explain: false });
  ok(d0.turns.filter((t) => t.move === "reteach").length >= 1, `B: a child who keeps getting it wrong is re-taught (moves ${d0.turns.map((t) => t.move).join(",")})`);
  if (!hasDb) return;
  const st = await state(d0.lessonId) ?? {};
  const last = st.lastArmBySkill ?? {}, failed = st.failedArms ?? {}, parked = st.parked ?? [], pace = st.pace?.parkedSkills ?? [];
  const stuck = Object.keys(last).filter((k) => pace.includes(k) && last[k] && !String(last[k]).startsWith("descent:") && !parked.includes(k));
  ok(stuck.length === 0, `B: no skill ends pace-parked with a re-teach arm in flight and no decision (${stuck.map((k) => `${k.split("-").pop()}:${last[k]}`).join(", ") || "none"})`);
  const twoArms = Object.keys(failed).filter((k) => new Set([...(failed[k] ?? []), last[k]].filter((a) => a && !String(a).startsWith("descent:"))).size >= 2);
  const descended = twoArms.filter((k) => [...(failed[k] ?? []), last[k] ?? ""].some((a) => String(a).startsWith("descent:")) || parked.includes(k));
  ok(twoArms.length === 0 || descended.length === twoArms.length, `B: every skill with two failed arms went on to the descent or the engine's park (${twoArms.map((k) => `${k.split("-").pop()}: ${descended.includes(k) ? "yes" : "NO"}`).join("; ") || "no skill failed two arms this run"})`);
  if (!twoArms.length) warn("B: no skill failed two arms in this lesson (model-dependent); the descent rule was not exercised");
  await advanceClock(api, 1);
  const d1 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 2 });
  ok(d1.start.status === 201, "B: +1 day: the next lesson starts");
  await sleep(3000);
  const rows = await dbq("select arm_id, outcome, rewarded_at from reteach_attempts where child_id = $1 order by at, id", [child.id]);
  ok(rows.length > 0 && rows.every((x) => x.outcome), `B: every attempt resolves from the child's later answers (${rows.filter((x) => x.outcome).length}/${rows.length}: ${rows.map((x) => `${x.arm_id}=${x.outcome ?? "open"}`).join(" ")})`);
}, { tag: "r2truth-b", child: { firstName: "Kabir", classLevel: 5, languagePref: "english", interests: ["cricket"] } });

// ───────────── C. the next-day check ─────────────
if (PARTS.has("C")) await withTestAccount(async ({ api, child }) => {
  const DAY0 = "c5-maths-ch01-t01", DAY1 = "c5-maths-ch01-t02";
  const d0 = await driveLesson(api, child.id, { topicId: DAY0, maxTurns: 18, explain: false, teach: true });
  ok(d0.turns.some((t) => t.move === "teachback"), `C: day 0 reached the teach-back (moves ${d0.turns.map((t) => t.move).join(",")})`);
  await sleep(3000);
  if (hasDb) {
    const ks = await dbq("select skill_id, display from kt_skill_state where child_id = $1 and skill_id like $2 order by skill_id", [child.id, `${DAY0}-%`]);
    ok(ks.some((x) => x.display === "learned_today"), `C: a day-0 skill the child did unaided and explained is learned_today (${ks.map((x) => `${x.skill_id.split("-").pop()}=${x.display}`).join(" ")})`);
  }
  await advanceClock(api, 1);
  const s1 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: DAY1 });
  const w1 = s1.ui?.ask?.itemId ?? null;
  ok(!!w1 && topicOfItem(w1) === DAY0, `C: +1 day: the opener of a ${DAY1} lesson is a day-0 item, before any teaching (${w1 ?? "none"})`);
  const st1 = await state(s1.lessonId);
  if (st1) ok(st1.pendingProbe?.shapeId === "C31", `C: +1 day: it is the C31 delayed check (pendingProbe ${st1.pendingProbe?.shapeId ?? "none"}/${st1.pendingProbe?.reason ?? "-"})`);
  if (w1) {
    const rep = replyFor(s1.ui, DAY0, { explain: false });
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: s1.lessonId, typed: true, turnSeq: 1, ...body });
    ok(r.ui?.verdict === "correct", `C: +1 day: the child's right answer to it is graded correct (${r.ui?.verdict ?? "none"})`);
  }
  await api("POST", "/api/lesson/end", { lessonId: s1.lessonId });
  await advanceClock(api, 1);
  const met = new Set(hasDb ? (await dbq("select distinct item_key from kt_evidence where child_id = $1 and item_key is not null", [child.id])).map((x) => x.item_key) : []);
  const s2 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: DAY0 });
  const w2 = s2.ui?.ask?.itemId ?? null;
  ok(!!w2 && topicOfItem(w2) === DAY0 && (!hasDb || !met.has(w2)), `C: +2 days: the certifying check leads, on a day-0 item never met (${w2 ?? "none"}${hasDb ? `; met ${met.size}` : ""})`);
  if (w2) {
    const rep = replyFor(s2.ui, DAY0, { explain: false });
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: s2.lessonId, typed: true, turnSeq: 1, ...body });
    ok(r.ui?.verdict === "correct", `C: +2 days: the right answer to the certifying check is graded correct (${r.ui?.verdict ?? "none"})`);
  }
  await api("POST", "/api/lesson/end", { lessonId: s2.lessonId });
  if (hasDb && w2) {
    await sleep(3000);
    const sk = kitItem(w2)?.skillId;
    const row = (await dbq("select display, flags from kt_skill_state where child_id = $1 and skill_id = $2", [child.id, sk]))[0];
    ok(row?.display === "mastered" && row?.flags?.delayed === true, `C: +2 days: the skill is mastered with the delayed flag (V1.3: ≥ 2 days, new item, unaided) (${sk?.split("-").pop()}: ${row?.display}, delayed ${row?.flags?.delayed})`);
  }
}, { tag: "r2truth-c", child: { firstName: "Riya", classLevel: 5, languagePref: "english", interests: ["cricket"] } });

// ───────────── D. typed grading ─────────────
if (PARTS.has("D")) {
  const TOPICS = String(arg("topics", "c2-maths-ch03-t02,c6-maths-ch07-t04,c5-maths-ch02-t02,c5-maths-ch01-t01")).split(",");
  const TURNS = Number(arg("turns", 24));
  const numsIn = (s) => String(s).match(/\d+(?:\/\d+)?/g) ?? [];
  const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const rows = [];
  for (const topicId of TOPICS) await withTestAccount(async ({ api, child }) => {
    const kit = kitTopic(topicId);
    const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId, purpose: "practice" });
    let ui = s.ui, seq = 0;
    for (let t = 0; t < TURNS; t++) {
      const it = ui?.ask?.itemId ? kitItem(ui.ask.itemId) ?? fadeItemOf(ui.ask.itemId, topicId) : null;
      let text, truth, form;
      if (it && !ui?.chips?.length && !it.fade && it.answer) {
        const key = String(it.answer), n = numsIn(key);
        const others = (kit?.items ?? []).filter((x) => x.id !== it.id && norm(x.answer) && !norm(key).includes(norm(x.answer)) && !norm(x.answer).includes(norm(key)));
        const hints = (it.hints ?? []).slice(0, 2).map((h) => String(h).replace(/[?]+\s*$/, "").trim())
          .filter((h) => h.split(/\s+/).length >= 2 && ![key, ...(it.acceptable ?? [])].some((a) => norm(h).includes(norm(a)) || norm(a).includes(norm(h))));
        const choices = [["key", "correct", key], ["key-in-sentence", "correct", `mujhe lagta hai ${key}`]];
        if (hints.length) choices.push(["hint-as-answer", "incorrect", pick(hints)]);
        if (n.length >= 2 && new Set(n).size === n.length) choices.push(["sequence-reversed", "incorrect", [...n].reverse().join(", ")]);
        if (n.length) choices.push(["foreign-numbers", "incorrect", n.map((x) => (x.includes("/") ? `${Number(x.split("/")[0]) + 5}/${Number(x.split("/")[1]) + 7}` : String(Number(x) * 7 + 3))).join(" and ")]);
        if (others.length) choices.push(["other-item-key(weak)", "incorrect-weak", String(pick(others).answer)]);
        [form, truth, text] = pick(choices);
      } else {
        const rep = replyFor(ui, topicId, { explain: true });
        text = rep.chip ? null : rep.text;
        if (rep.chip) {
          const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, typed: true, turnSeq: ++seq, childText: rep.chip.label, chipId: rep.chip.id });
          ui = r.ui; if (r.end) break; continue;
        }
      }
      const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, typed: true, turnSeq: ++seq, childText: text });
      if (process.env.R2_VERBOSE) console.log(`  D ${topicId} t${t} ask=${ui?.ask?.itemId ?? "-"} chips=${ui?.chips?.length ?? 0} sent="${String(text).slice(0, 30)}" → ${r.move?.kind}/${r.ui?.verdict ?? "-"}`);
      if (form) rows.push({ topicId, itemId: it.id, form, truth, text, verdict: r.ui?.verdict ?? null, reAsked: r.ui?.ask?.itemId === it.id });
      ui = r.ui;
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: s.lessonId });
  }, { tag: "r2truth-d", child: { firstName: "Meher", classLevel: Number(topicId.match(/^c(\d)/)[1]), languagePref: "english" } });
  const proven = rows.filter((x) => x.truth === "incorrect");
  const falseCredit = proven.filter((x) => x.verdict === "correct");
  const weakCredit = rows.filter((x) => x.truth === "incorrect-weak" && x.verdict === "correct");
  const falseFail = rows.filter((x) => x.truth === "correct" && x.verdict === "not_yet");
  const uncredited = rows.filter((x) => x.truth === "correct" && x.verdict !== "correct" && x.verdict !== "not_yet");
  const byForm = {};
  for (const x of rows) { const f = (byForm[x.form] ??= { n: 0, credited: 0 }); f.n++; if (x.verdict === "correct") f.credited++; }
  console.log(`D: ${rows.length} typed answers on posed kit items; by form ${JSON.stringify(byForm)}`);
  for (const x of [...falseCredit, ...weakCredit, ...falseFail].slice(0, 20)) console.log(`  ${x.form} ${x.itemId} "${String(x.text).slice(0, 50)}" → ${x.verdict}`);
  ok(rows.length >= TOPICS.length, `D: answers were graded on posed kit items (${rows.length})`);
  ok(falseCredit.length === 0, `D: 0 credits of a proven-wrong typed answer (${falseCredit.length}/${proven.length})`);
  ok(falseFail.length === 0, `D: 0 fails of the key typed (${falseFail.length}/${rows.filter((x) => x.truth === "correct").length}); uncredited (re-asked, no verdict) ${uncredited.length}`);
  if (weakCredit.length) warn(`D: ${weakCredit.length} credit(s) of another item's key (weak truth: two items can share an answer); for a human look`);
}
if (isLocal) warn("local target: these checks ran against a local server, not production");
done();
