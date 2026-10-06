// W2-H production acceptance: Studio in the lesson (BUILD-PLAN §4 W2-H; LIVE-STUDIO AT-7..AT-10 at the API level;
// STUDENT-FLOW §5.3, §9.3). A class 5 child, a text lesson on fractions (c5-maths-ch02-t02, one of the 16 class 4-7
// topics whose kit proves a Studio piece today), child-like turns, and:
//   - the Studio stream answers (SSE, signed-in guardian only);
//   - after the lesson-start prefetch, with the test clock moved past the piece's moment, the teacher reveals a piece on
//     her cue: the turn carries TurnResponse.studio.reveal AND the tray slot (ui.studioSlot) with a renderable artifact;
//   - the slot never carries host-only truth; nothing on the reveal turn mentions a failure;
//   - a Studio answer is graded by the HOST: a wrong value that claims `correct: true` is wrong, the right value is right,
//     and kt_evidence(via='studio') holds the host's grade; the studio_mount row and the Made for you card exist;
//   - "Show me again" is accepted; an answer to a piece that is not on screen is refused;
//   - a whiteboard slot (when an explanation beat asks for one) fills with a script that stays inside its board.
//   - (W2-H fixer, 2026-10-05) AT-7's values lint: every number on the reveal line and the next line is a value the piece
//     shows (slot params), the Director item the same turn shows (ui.ask), or the child's own words; the reveal turn's
//     Director move is not a competing question; a remounted activity re-answering item 1 is right with no second row; a
//     wrong Studio answer reaches the lesson as a module-only turn.
// Env: W2H_MODES=text,cascade (default text), W2H_REPS=10 (default 1; one child per run, the day's one-lesson rule).
//   Digits only: a number she says as a word ("teen chauthai") is not linted. The realtime voice lane needs WebRTC and is
//   not driven from here; the cascade lane is the voice proxy.
// Deletes its test account in a finally (lib.mjs withTestAccount). Correctness only from the sandbox; timings are the
// probe fleet's.
import { withTestAccount, ok, warn, done, dbq, BASE, waitFor } from "./lib.mjs";

const TOPIC = "c5-maths-ch02-t02";
const HOST_ONLY = ["binOf", "answer", "order"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MODES = (process.env.W2H_MODES || "text").split(",").map((x) => x.trim()).filter(Boolean);
const REPS = Math.max(1, Math.min(20, Number(process.env.W2H_REPS) || 1));
const ASKING = new Set(["probe", "practice", "retrieval", "teachback"]);
const numbersIn = (t) => [...String(t ?? "").matchAll(/\d+(?:\s*\/\s*\d+)?/g)].map((m) => m[0].replace(/\s+/g, ""));
/** The numbers a reply may say about the screen: the piece's values (and its fractions), the Director item's, the child's. */
function allowedNumbers(art, ask, childLine) {
  const out = new Set();
  const add = (t) => { for (const n of numbersIn(t)) { out.add(n); for (const k of n.split("/")) out.add(k); } };
  add(JSON.stringify(art?.params ?? {}));
  add(JSON.stringify(art?.stagecraft ?? {}));   // ship5 p4: a Stagecraft piece carries its values in the revealed spec
  for (const it of art?.params?.items ?? []) if (it.n != null && it.d != null) out.add(`${it.n}/${it.d}`);
  add(ask?.text); add(childLine);
  return out;
}

const tally = { runs: 0, reveals: 0, lintPass: 0, competing: 0 };

async function oneRun({ api, child, mode, rep }) {
  const tag = `[${mode} #${rep + 1}]`;
  // 1. a lesson on a topic with a Studio piece
  const start = await api("POST", "/api/lesson/start", { childId: child.id, mode, topicId: TOPIC });
  ok(start.status === 201 && !!start.lessonId, `${tag} lesson starts on ${start.topic?.id} (${start.ms} ms)`);
  const lessonId = start.lessonId;
  if (!lessonId) return;
  tally.runs++;

  // 2. the Studio stream: SSE for the signed-in guardian
  if (rep === 0) {
    const ctl = new AbortController();
    const res = await fetch(`${BASE}/api/studio/stream?lessonId=${lessonId}`, { headers: { cookie: api.cookie() }, signal: ctl.signal }).catch((e) => ({ status: 0, e }));
    ok(res.status === 200 && /text\/event-stream/.test(res.headers?.get("content-type") ?? ""), `GET /api/studio/stream is an event stream (${res.status})`);
    ctl.abort();
    const anon = await fetch(`${BASE}/api/studio/stream?lessonId=${lessonId}`).catch(() => ({ status: 0 }));
    ok(anon.status === 401, `the stream refuses a signed-out caller (${anon.status})`);
  }

  // 3. let the prefetch plan its pieces (a strings call on the background lane), then move the lesson clock past the moment
  await sleep(9000);
  await api("POST", "/api/test/clock", { advanceMs: 10 * 60_000 });

  const lines = ["haan ready", "teen chauthai matlab 3 by 4", "mujhe nahi pata", "pizza ke 4 hisse", "ek baar aur samjhao", "theek hai", "2 hisse", "haan", "samajh gaya", "aage chalo", "ok", "haan"];
  let seq = 0, reveal = null, slot = null, revealTurn = null, revealIdx = -1, wbSlot = null;
  const turns = [];
  for (const childText of lines) {
    const r = await api("POST", "/api/lesson/turn", { lessonId, childText, asrConfidence: 0.95, typed: mode === "text", turnSeq: ++seq });
    turns.push({ ...r, childText });
    if (r.ui?.studioSlot?.intentId?.includes(":wb:") && !wbSlot) wbSlot = r.ui.studioSlot;
    if (r.studio?.reveal && !reveal) { reveal = r.studio.reveal; slot = r.ui?.studioSlot ?? null; revealTurn = r; revealIdx = turns.length - 1; }
    if (r.end) break;
    if (reveal && turns.length > revealIdx + 1 && seq >= 8) break;
  }
  ok(turns.length > 0 && turns.every((t) => typeof t.teacherReply === "string"), `${tag} turns answered (${turns.map((t) => t.move?.kind).join(", ")})`);
  ok(!!reveal, `${tag} the teacher revealed a Studio piece on her cue (${reveal ?? "none"})`);
  if (!reveal) return;
  tally.reveals++;
  ok(!!slot && slot.intentId === reveal && ["revealed", "fallback_shown"].includes(slot.state), `${tag} the reveal turn carries the tray slot (${slot ? `${slot.state}` : "none"})`);
  ok(revealTurn.ui?.tray === "studio", `${tag} the Work tray is the studio stage on the reveal turn (${revealTurn.ui?.tray})`);
  const art = slot?.artifact;
  ok(!!art && ["skeleton", "frame", "stagecraft"].includes(art.kind), `${tag} a renderable artifact (${art?.kind}${art?.skeleton ? ` ${art.skeleton}` : ""})`);
  ok(!!art && HOST_ONLY.every((k) => !(k in (art.params ?? {}))), `${tag} the slot carries no host-only truth`);
  if (art?.kind === "frame") ok(/^[0-9a-f]{64}$/.test(art.sha256) && art.src === `/api/studio/build?sha=${art.sha256}`, `${tag} a frame is addressed by the sha of its gate-passed bytes`);
  ok(!/\b(error|fail|failed|loading|kharab|ban nahi|nahi ban|could not)\b/i.test(revealTurn.teacherReply ?? ""), `${tag} the reveal line never mentions a failure`);
  // one task at a time: the reveal turn's Director move is not asking a kit question of its own
  const competing = !!revealTurn.ui?.ask?.itemId && ASKING.has(revealTurn.move?.kind);
  if (competing) tally.competing++;
  ok(!competing, `${tag} the reveal turn's move (${revealTurn.move?.kind}) does not pose a competing question`);
  // AT-7 values lint: the reveal line and the next line name only on-screen values (digits)
  const lint = [revealTurn, turns[revealIdx + 1]].filter(Boolean).map((t) => {
    const allowed = allowedNumbers(t.ui?.studioSlot?.artifact ?? art, t.ui?.ask, t.childText);
    return numbersIn(t.teacherReply).filter((n) => !allowed.has(n));
  });
  const bad = lint.flat();
  if (!bad.length) tally.lintPass++;
  ok(!bad.length, `${tag} AT-7: the reveal line and the next one name only on-screen values${bad.length ? ` (off-screen: ${bad.join(", ")})` : ""}`);

  // 4. the host grades (AT-10) by ITEM: a wrong answer that claims correct, the right answer, a remount re-answer
  const items = art?.params?.items ?? [];
  if (art?.archetype === "shade_fraction" && items.length) {
    const it = items[0];
    const wrong = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, itemId: it.id, mount: "m1.0", value: { n: (it.n % it.d) + 1 === it.n ? it.n + 1 : (it.n % it.d) + 1, d: it.d, correct: true } });
    ok(wrong.correct === false, `${tag} a wrong answer that claims correct is graded wrong by the host`);
    // a second wrong try is a "stuck" milestone (the stage sends it): a module-only turn, the Director's nudge on the activity
    const wrong2 = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, itemId: it.id, mount: "m1.0", value: { n: 0, d: it.d } });
    ok(wrong2.correct === false && wrong2.wrongTries === 2, `${tag} the host counts the item's wrong tries (${wrong2.wrongTries})`);
    const mod = await api("POST", "/api/lesson/turn", { lessonId, moduleEvents: [{ moduleId: reveal, engine: "studio", type: "stuck", name: "wrong tries", at: Date.now() }], turnSeq: ++seq });
    ok(mod.move?.kind === "hint" && typeof mod.teacherReply === "string" && mod.teacherReply.length > 0, `${tag} two wrong Studio tries get the teacher's nudge (${mod.move?.kind}: "${String(mod.teacherReply ?? "").slice(0, 80)}")`);
    ok(mod.ui?.studioSlot?.intentId === reveal, `${tag} the piece stays on screen on the nudge turn`);
    const right = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, itemId: it.id, mount: "m1.0", value: { n: it.n, d: it.d } });
    ok(right.correct === true, `${tag} the right answer is graded right by the host`);
    // the stage came back (the Director took the tray, a reload): a new mount key, the activity restarts at item 1
    const remount = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, itemId: it.id, mount: "m2.0", value: { n: it.n, d: it.d } });
    ok(remount.correct === true && remount.alreadyClosed === true, `${tag} a remounted activity re-answering item 1 is right and already closed`);
    const ev = await waitFor(async () => {
      const rows = await dbq("select via, cls, outcome, grader from kt_evidence where session_id = $1 and via = 'studio'", [lessonId]);
      return rows === null ? "nodb" : rows.length ? rows : null;
    }, { everyMs: 1500, maxMs: 15_000 });
    if (ev === "nodb") warn("no TAXILA_DB_URL: kt_evidence(via='studio') not checked");
    else ok(Array.isArray(ev) && ev.length === 1 && ev[0].grader === "code", `${tag} ONE kt_evidence(via='studio') row with the host's grade (${ev?.length ?? 0})`);
  } else warn(`${tag} the revealed piece is ${art?.archetype}: the scripted answer check covers shade_fraction only`);

  const again = await api("POST", "/api/studio/feedback", { lessonId, intentId: reveal, action: "again" });
  ok(again.ok === true, `${tag} 'Show me again' is accepted`);
  const nope = await api("POST", "/api/studio/answer", { lessonId, intentId: `${lessonId}:st:99`, value: 1 }, [409]);
  ok(nope.status === 409, `${tag} an answer to a piece that is not on screen is refused`);

  const mount = await dbq("select source, archetype, revealed_at from studio_mount where lesson_id = $1 and intent_id = $2", [lessonId, reveal]);
  if (mount === null) warn("no TAXILA_DB_URL: studio_mount not checked");
  else ok(mount.length === 1 && !!mount[0].revealed_at, `${tag} a studio_mount row (${mount[0]?.source} ${mount[0]?.archetype})`);
  const shelf = await api("GET", `/api/studio/made-for?childId=${child.id}`);
  ok(Array.isArray(shelf.cards) && shelf.cards.some((c) => c.intentId === reveal && !!c.replay), `${tag} the Made for you feed has the piece (${shelf.cards?.length ?? 0} card)`);

  // 5. a whiteboard slot fills with a script inside its board
  if (wbSlot) {
    const filled = await waitFor(async () => {
      const r = await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(wbSlot.intentId)}`);
      return r.slot?.artifact?.kind === "whiteboard" ? r.slot : r.slot?.state === "failed" ? { failed: true } : null;
    }, { everyMs: 1500, maxMs: 20_000 });
    if (filled?.failed || !filled) warn(`${tag} the whiteboard for ${wbSlot.intentId} did not draw (${filled?.failed ? "nothing to draw / gate refused" : "timeout"}): the tray shows its calm ground`);
    else {
      const sc = filled.artifact.script;
      const inside = sc.ops.every((o) => ["c", "at", "from", "to"].every((k) => !Array.isArray(o[k]) || (o[k][0] >= 0 && o[k][0] <= sc.board.w && o[k][1] >= 0 && o[k][1] <= sc.board.h)));
      ok(sc.v === 1 && sc.ops.length > 0 && sc.ops.length <= 120 && inside, `${tag} the whiteboard script fits its ${sc.board.w}x${sc.board.h} board (${sc.ops.length} ops)`);
    }
  } else warn(`${tag} no explanation beat asked for a whiteboard in this run`);

  await api("POST", "/api/lesson/end", { lessonId });
}

await withTestAccount(async ({ api, child }) => {
  let rep = 0;
  for (const mode of MODES) for (let i = 0; i < REPS; i++, rep++) {
    // one child per run: the day's one-lesson rule (routes/lesson.js startRefusal) refuses a second lesson for a child
    let kid = child;
    if (rep > 0) {
      ({ child: kid } = await api("POST", "/api/children", { firstName: `Riya${rep}`, classLevel: 5, languagePref: "hinglish", interests: ["cricket"] }));
      await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
      await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    }
    await oneRun({ api, child: kid, mode, rep: i }).catch((e) => ok(false, `[${mode} #${i + 1}] run threw: ${e?.message ?? e}`));
  }
  console.log(`W2H summary ${JSON.stringify(tally)} (AT-7 wants reveals ≥ 9/10 runs and the values lint 100%)`);
  if (REPS >= 10) ok(tally.reveals >= Math.ceil(0.9 * tally.runs), `AT-7: a piece revealed on her cue in ${tally.reveals}/${tally.runs} runs`);
}, { tag: "w2h", child: { classLevel: 5, languagePref: "hinglish" } });
done();
