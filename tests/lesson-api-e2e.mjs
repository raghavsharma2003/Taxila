// End-to-end checks of the lesson API paths the text-mode sim does not reach (not part of `npm test`: it needs
// Neon + Azure and costs a few cents):
//
//   NODE_USE_ENV_PROXY=1 node tests/lesson-api-e2e.mjs
//
// Serves the real API in-process on a spare port, then checks: consent gates (start, mid-lesson withdrawal),
// next-topic placement, the verified-kit path, cross-guardian 403, realtime token + session config, voice
// turns (no reply, low-ASR = no evidence, a key said aloud on the lane = hintsUsed 4), the safeguarding
// predicate + incident row, idempotent end, and the rows end writes (rel_state, cited memory, no
// format_trial without learning_profile). Exits non-zero on any FAIL; deletes its child at the end.
import http from "http";
import { readFileSync } from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { handle } = await import("../server/index.js");
const { q } = await import("../server/db.js");
const server = http.createServer(handle); await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const client = () => { let cookie = ""; return async (method, path, body, expect = [200, 201]) => {
  const res = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
  const j = await res.json().catch(() => ({})); if (!expect.includes(res.status)) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(j)}`); return { status: res.status, ...j }; }; };
function ok(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) process.exitCode = 1;
}
const A = client(), B = client(); const st = Date.now();
await A("POST", "/api/auth/signup", { email: `it+${st}@taxila.test`, password: "integration-pw-1", name: "IT", isGuardianAdult: true });
await B("POST", "/api/auth/signup", { email: `it2+${st}@taxila.test`, password: "integration-pw-2", name: "IT2", isGuardianAdult: true });
const { child } = await A("POST", "/api/children", { firstName: "Kabir", classLevel: 2, languagePref: "hinglish", interests: ["trains"] });
// consent gate
const noConsent = await A("POST", "/api/lesson/start", { childId: child.id, mode: "text" }, [403]);
ok(noConsent.status === 403, "start without core_tutoring consent → 403");
await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: false, memory: true } });
// next topic placement (no topicId) → first class-2 maths topic, verified file kit, voice mode
const s1 = await A("POST", "/api/lesson/start", { childId: child.id, mode: "voice" });
ok(s1.topic.id === "c2-maths-ch01-t01", `nextTopicFor picks the first class-2 maths topic (${s1.topic.id})`);
ok(s1.debug.kitVerified === true, "verified file kit is used when present");
ok(s1.teacher.id === "asha" && s1.teacher.voice === "marin", "class 2 → Asha/marin");
ok(!s1.teacherOpening, "voice mode returns no text opening");
ok(/AFTER their next reply/.test(s1.instructions) || !s1.debug.move.itemId, "voice-lane instructions carry contingencies when an item is active");
ok(s1.instructions.split("\n").at(-1).startsWith("TURN SHAPE"), "instructions end with the turn shape");
// cross-guardian access
const cross = await B("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: "hi" }, [403]);
ok(cross.status === 403, "another guardian cannot drive this lesson → 403");
// realtime token
const tok = await A("POST", "/api/realtime/token", { lessonId: s1.lessonId });
ok(tok.token?.startsWith("ek_") && tok.base === process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), "realtime token minted, base = endpoint");
ok(tok.session.audio.input.turn_detection.silence_duration_ms === 900 && tok.session.audio.input.turn_detection.create_response === true, "session config from decisions (server_vad 900, auto response)");
// voice turns: walk to the first item with low-ASR noise, then a leak heard on the lane
let r = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: "haan didi", asrConfidence: 0.9, teacherText: "Namaste Kabir!" });
let guard = 0;
while (!r.debug.item && guard++ < 8) r = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: "acha", asrConfidence: 0.9, teacherText: "Chalo dekhte hain." });
ok(!!r.debug.item, `voice turns reach a practice item (${r.debug.item?.id})`);
ok(r.teacherReply === undefined, "voice turns return no teacherReply");
const lowAsr = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: r.debug.item.answer, asrConfidence: 0.3, teacherText: "Batao?" });
ok(lowAsr.debug.classification.source === "asr" && lowAsr.debug.evidence.length === 0, "low ASR confidence → no evidence, even for the right words");
const item = lowAsr.debug.item;
const leak = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: item.answer, asrConfidence: 0.95, teacherText: `Socho... answer hai ${item.answer}, bolo?` });
ok(leak.debug.evidence[0]?.hintsUsed === 4, "a key the teacher said aloud before rung 4 makes the answer worth nothing (hintsUsed 4)");
const leakTurn = await q("select meta from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1", [s1.lessonId]);
ok(leakTurn[0]?.meta?.answerLeak === true, "the leaking teacher turn is marked in the transcript");
// safeguarding
const sg = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: "didi mujhe papa maarte hain", asrConfidence: 0.9 });
ok(sg.move.kind === "safeguard" && /1098/.test(sg.instructions), "distress → safeguard move, Childline in instructions");
const inc = await q("select kind, severity, detail from incident where lesson_id = $1", [s1.lessonId]);
ok(inc.length === 1 && inc[0].kind === "safeguarding" && inc[0].detail.family === "abuse", "incident row written (predicate, abuse family)");
// end + DB rows
const e1 = await A("POST", "/api/lesson/end", { lessonId: s1.lessonId });
const e2 = await A("POST", "/api/lesson/end", { lessonId: s1.lessonId });
ok(e2.alreadyEnded === true && e2.summary === e1.summary, "end is idempotent");
const [ev, ss, ft, rel, les] = await Promise.all([
  q("select count(*)::int n from evidence where lesson_id = $1", [s1.lessonId]),
  q("select skill_id, status, p_known from skill_state where child_id = $1", [child.id]),
  q("select count(*)::int n from format_trial where child_id = $1", [child.id]),
  q("select sessions, stage, trust from rel_state where child_id = $1", [child.id]),
  q("select ended_at, summary, parent_note, state->>'phase' phase from lesson where id = $1", [s1.lessonId]),
]);
ok(ev[0].n >= 1, `evidence rows written (${ev[0].n})`);
ok(ss.length >= 1, `skill_state rows (${ss.map((x) => `${x.skill_id.split("-").pop()}:${x.status}:${x.p_known.toFixed(2)}`).join(", ")})`);
ok(ft[0].n === 0, "no format_trial rows without learning_profile consent");
ok(rel[0].sessions === 1 && rel[0].stage === "getting_to_know", `rel_state sessions++ (${JSON.stringify(rel[0])})`);
ok(!!les[0].ended_at && les[0].phase === "done" && !!les[0].parent_note, "lesson closed with summary and parent note");
const turnAfterEnd = await A("POST", "/api/lesson/turn", { lessonId: s1.lessonId, childText: "hi" }, [409]);
ok(turnAfterEnd.status === 409, "turn after end → 409");
// consent withdrawal mid-lesson: no learner writes
await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true } });
const s2 = await A("POST", "/api/lesson/start", { childId: child.id, topicId: "c2-maths-ch01-t01", mode: "text" });
ok(typeof s2.teacherOpening === "string" && s2.teacherOpening.length > 0, `text opening: "${s2.teacherOpening}"`);
await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: false } });
const before = (await q("select count(*)::int n from evidence where child_id = $1", [child.id]))[0].n;
let t = await A("POST", "/api/lesson/turn", { lessonId: s2.lessonId, childText: "acha didi", typed: true });
for (let i = 0; i < 6 && !t.debug.item; i++) t = await A("POST", "/api/lesson/turn", { lessonId: s2.lessonId, childText: "acha", typed: true });
if (t.debug.item) await A("POST", "/api/lesson/turn", { lessonId: s2.lessonId, childText: t.debug.item.answer, typed: true });
const after = (await q("select count(*)::int n from evidence where child_id = $1", [child.id]))[0].n;
ok(after === before, "after core_tutoring is withdrawn, no evidence is written");
await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true } });
await A("POST", "/api/lesson/end", { lessonId: s2.lessonId });
const ft2 = await q("select count(*)::int n from format_trial where child_id = $1", [child.id]);
ok(ft2[0].n === 0, "a lesson whose evidence was withheld (consent withdrawn) writes no format_trial either");
const mem = await q("select kind, text, source_turn from memory where child_id = $1", [child.id]);
ok(mem.every((m) => m.source_turn !== null), `memories cite their turn (${mem.map((m) => `${m.kind}: ${m.text}`).join(" | ") || "none"})`);
await A("DELETE", "/api/children", { childId: child.id });
server.close();
