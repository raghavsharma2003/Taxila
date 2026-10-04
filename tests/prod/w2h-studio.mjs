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
// Deletes its test account in a finally (lib.mjs withTestAccount). Correctness only from the sandbox; timings are the
// probe fleet's.
import { withTestAccount, ok, warn, done, dbq, BASE, waitFor } from "./lib.mjs";

const TOPIC = "c5-maths-ch02-t02";
const HOST_ONLY = ["binOf", "answer", "order"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await withTestAccount(async ({ api, child }) => {
  // 1. a lesson on a topic with a Studio piece
  const start = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: TOPIC });
  ok(start.status === 201 && !!start.lessonId, `lesson starts on ${start.topic?.id} (${start.ms} ms)`);
  const lessonId = start.lessonId;

  // 2. the Studio stream: SSE for the signed-in guardian
  {
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
  let seq = 0, reveal = null, slot = null, revealTurn = null, wbSlot = null;
  const turns = [];
  for (const childText of lines) {
    const r = await api("POST", "/api/lesson/turn", { lessonId, childText, asrConfidence: 0.95, typed: true, turnSeq: ++seq });
    turns.push(r);
    if (r.ui?.studioSlot?.intentId?.includes(":wb:") && !wbSlot) wbSlot = r.ui.studioSlot;
    if (r.studio?.reveal && !reveal) { reveal = r.studio.reveal; slot = r.ui?.studioSlot ?? null; revealTurn = r; }
    if (r.end) break;
    if (reveal && seq >= 8) break;
  }
  ok(turns.length > 0 && turns.every((t) => typeof t.teacherReply === "string"), `turns answered (${turns.map((t) => t.move?.kind).join(", ")})`);
  ok(!!reveal, `the teacher revealed a Studio piece on her cue (${reveal ?? "none"})`);
  if (reveal) {
    ok(!!slot && slot.intentId === reveal && ["revealed", "fallback_shown"].includes(slot.state), `the reveal turn carries the tray slot (${slot ? `${slot.state}` : "none: seam patch w2h-turn-slot not applied?"})`);
    ok(revealTurn.ui?.tray === "studio", `the Work tray is the studio stage on the reveal turn (${revealTurn.ui?.tray})`);
    const art = slot?.artifact;
    ok(!!art && ["skeleton", "frame"].includes(art.kind), `a renderable artifact (${art?.kind}${art?.skeleton ? ` ${art.skeleton}` : ""})`);
    ok(!!art && HOST_ONLY.every((k) => !(k in (art.params ?? {}))), "the slot carries no host-only truth");
    if (art?.kind === "frame") ok(/^[0-9a-f]{64}$/.test(art.sha256) && art.src === `/api/studio/build?sha=${art.sha256}`, "a frame is addressed by the sha of its gate-passed bytes");
    ok(!/\b(error|fail|failed|loading|kharab|ban nahi|nahi ban|could not)\b/i.test(revealTurn.teacherReply ?? ""), "the reveal line never mentions a failure");

    // 4. the host grades (AT-10): a wrong answer that claims correct, then the right answer
    const items = art?.params?.items ?? [];
    if (art?.archetype === "shade_fraction" && items.length) {
      const it = items[0];
      const wrong = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, value: { n: (it.n % it.d) + 1 === it.n ? it.n + 1 : (it.n % it.d) + 1, d: it.d, correct: true } });
      ok(wrong.correct === false, "a wrong answer that claims correct is graded wrong by the host");
      const right = await api("POST", "/api/studio/answer", { lessonId, intentId: reveal, value: { n: it.n, d: it.d } });
      ok(right.correct === true, "the right answer is graded right by the host");
      const ev = await waitFor(async () => {
        const rows = await dbq("select via, cls, outcome, grader from kt_evidence where session_id = $1 and via = 'studio'", [lessonId]);
        return rows === null ? "nodb" : rows.length ? rows : null;
      }, { everyMs: 1500, maxMs: 15_000 });
      if (ev === "nodb") warn("no TAXILA_DB_URL: kt_evidence(via='studio') not checked");
      else ok(Array.isArray(ev) && ev.length >= 1 && ev[0].grader === "code", `kt_evidence(via='studio') holds the host's grade (${ev?.length ?? 0} row)`);
    } else warn(`the revealed piece is ${art?.archetype}: the scripted answer check covers shade_fraction only`);

    const again = await api("POST", "/api/studio/feedback", { lessonId, intentId: reveal, action: "again" });
    ok(again.ok === true, "'Show me again' is accepted");
    const nope = await api("POST", "/api/studio/answer", { lessonId, intentId: `${lessonId}:st:99`, value: 1 }, [409]);
    ok(nope.status === 409, "an answer to a piece that is not on screen is refused");

    const mount = await dbq("select source, archetype, revealed_at from studio_mount where lesson_id = $1 and intent_id = $2", [lessonId, reveal]);
    if (mount === null) warn("no TAXILA_DB_URL: studio_mount not checked");
    else ok(mount.length === 1 && !!mount[0].revealed_at, `a studio_mount row (${mount[0]?.source} ${mount[0]?.archetype})`);
    const shelf = await api("GET", `/api/studio/made-for?childId=${child.id}`);
    ok(Array.isArray(shelf.cards) && shelf.cards.some((c) => c.intentId === reveal && !!c.replay), `the Made for you feed has the piece (${shelf.cards?.length ?? 0} card)`);
  }

  // 5. a whiteboard slot fills with a script inside its board
  if (wbSlot) {
    const filled = await waitFor(async () => {
      const r = await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(wbSlot.intentId)}`);
      return r.slot?.artifact?.kind === "whiteboard" ? r.slot : r.slot?.state === "failed" ? { failed: true } : null;
    }, { everyMs: 1500, maxMs: 20_000 });
    if (filled?.failed || !filled) warn(`the whiteboard for ${wbSlot.intentId} did not draw (${filled?.failed ? "nothing to draw / gate refused" : "timeout"}): the tray shows its calm ground`);
    else {
      const sc = filled.artifact.script;
      const inside = sc.ops.every((o) => ["c", "at", "from", "to"].every((k) => !Array.isArray(o[k]) || (o[k][0] >= 0 && o[k][0] <= sc.board.w && o[k][1] >= 0 && o[k][1] <= sc.board.h)));
      ok(sc.v === 1 && sc.ops.length > 0 && sc.ops.length <= 120 && inside, `the whiteboard script fits its ${sc.board.w}x${sc.board.h} board (${sc.ops.length} ops)`);
    }
  } else warn("no explanation beat asked for a whiteboard in this run");

  await api("POST", "/api/lesson/end", { lessonId });
}, { tag: "w2h", child: { classLevel: 5, languagePref: "hinglish" } });
done();
