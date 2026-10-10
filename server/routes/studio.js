// Studio routes (LIVE-STUDIO §3.0 "Studio channel", §3.10, §4.4, §5.1; STUDENT-FLOW §5.3, §9.3; BUILD-PLAN W2-H). OWNED BY
// W2-H. Every route is for the signed-in guardian of the lesson's child; nothing here takes a child's free text.
//
//   GET  /api/studio/stream?lessonId=          SSE: StudioWire messages (status, script, ...) for this lesson; replays the
//                                              visible pieces on connect, heartbeats every 20 s
//   GET  /api/studio/slot?lessonId=&intentId=  the current slot of a piece (a stage that mounts late converges on it)
//   GET  /api/studio/build?sha=                a gate-passed build's fragment (content-addressed, immutable; the client
//                                              re-hashes it before mounting: what the child sees is what passed)
//   POST /api/studio/answer                    {lessonId, intentId, value, itemId?, mount?} → the HOST's grade by item (AT-10: the frame's own
//                                              `correct` is never read) and the item's kt_evidence(via='studio')
//   POST /api/studio/feedback                  {lessonId, intentId, action: "again" | "not_this"}
//   POST /api/studio/frame-error               {lessonId, intentId, reason} → the skeleton slot comes back; only csp /
//                                              runtime / navigated count as incidents against the build
//   POST /api/studio/viewport                  {lessonId, box: {w, h}, young} → the device's viewport class for the ONE tray gate
//                                              (server/forge3/tray-gate.js; round 4 content): every piece is certified at it
//   POST /api/studio/wb-timing                 {lessonId, lateMs, source} → the whiteboard's sync telemetry (W2-F fixer)
//   GET  /api/studio/made-for?childId=         the Made for you shelf / the parent's "Made for {child}" feed (W2-A renders)
//   POST /api/studio/made-for/hide             {childId, id} → hides a shelf card (evidence rows untouched)
import { HttpError, bad, send } from "../http.js";
import { one, q } from "../db.js";
import { requireChild, sessionTokenHash } from "../auth.js";
import { subscribe, slotSnapshot, hostAnswer, hostFeedback, hostFrameError, noteWbTiming, noteViewport } from "../studio/seam.js";
import { getBuild } from "../studio/store.js";
import { archetype } from "../studio/archetypes/index.js";

const UUID = /^[0-9a-f-]{36}$/i;
const INTENT = /^[\w:.-]{1,160}$/;

/** The lesson and its child, for the signed-in guardian only (one query). 401 / 403 / 404 like the lesson routes. */
async function lessonFor(req, lessonId) {
  if (!UUID.test(String(lessonId ?? ""))) throw bad("invalid lessonId");
  const token = sessionTokenHash(req);
  if (!token) throw new HttpError(401, "not signed in");
  const row = await one(
    `select l.id, l.started_at, l.ended_at, to_jsonb(c) as child_row, (s.guardian_id = c.guardian_id) as mine
       from lesson l join child c on c.id = l.child_id
       left join auth_session s on s.token_hash = $2 and s.expires_at > now()
      where l.id = $1`, [lessonId, token]);
  if (!row) throw new HttpError(404, "lesson not found");
  if (row.mine == null) throw new HttpError(401, "session expired");
  if (!row.mine) throw new HttpError(403, "not your lesson");
  return { lesson: { id: row.id, started_at: row.started_at, ended_at: row.ended_at }, child: row.child_row };
}
async function signedIn(req) {
  const token = sessionTokenHash(req);
  if (!token) throw new HttpError(401, "not signed in");
  const s = await one("select guardian_id from auth_session where token_hash = $1 and expires_at > now()", [token]);
  if (!s) throw new HttpError(401, "session expired");
  return s.guardian_id;
}
const query = (req) => new URL(req.url || "/", "http://x").searchParams;
const intentOf = (v) => { const s = String(v ?? ""); if (!INTENT.test(s)) throw bad("invalid intentId"); return s; };

async function stream(req, res) {
  const lessonId = query(req).get("lessonId");
  await lessonFor(req, lessonId);
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
  res.write("retry: 2000\n\n");
  const sub = { send: (msg) => { res.write(`data: ${JSON.stringify(msg)}\n\n`); } };
  const off = subscribe(lessonId, sub);
  const beat = setInterval(() => { try { res.write(": hb\n\n"); } catch { /* closed */ } }, 20_000);
  beat.unref?.();
  // a stream never outlives a lesson: 45 minutes at most (the client reconnects if the lesson goes on)
  const cap = setTimeout(() => res.end(), 45 * 60_000);
  cap.unref?.();
  const close = () => { clearInterval(beat); clearTimeout(cap); off(); };
  req.on("close", close);
  res.on("close", close);
}

async function slot(req, res) {
  const sp = query(req);
  const lessonId = sp.get("lessonId");
  await lessonFor(req, lessonId);
  send(res, 200, { slot: slotSnapshot(lessonId, intentOf(sp.get("intentId"))) });
}

async function build(req, res) {
  await signedIn(req);
  const sha = String(query(req).get("sha") ?? "");
  if (!/^[0-9a-f]{64}$/.test(sha)) throw bad("invalid sha");
  const b = await getBuild(sha);
  if (!b || b.status === "retired") throw new HttpError(404, "no such build");
  const a = archetype(b.archetype);
  send(res, 200, { sha256: b.buildSha, fragment: b.fragment, archetype: b.archetype, kind: b.kind, stage: a.stage },
    { "cache-control": "private, max-age=86400, immutable" });
}

async function answer(req, res, body) {
  const { lesson, child } = await lessonFor(req, body?.lessonId);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  const r = await hostAnswer({ lessonId: lesson.id, intentId: intentOf(body.intentId), value: body.value, child, lesson,
    ...(typeof body.itemId === "string" && /^[\w:.-]{1,24}$/.test(body.itemId) ? { itemId: body.itemId } : {}),
    ...(typeof body.mount === "string" && /^[\w:.-]{1,80}$/.test(body.mount) ? { mount: body.mount } : {}) });
  if (r.error) throw new HttpError(409, r.error);
  send(res, 200, r);
}

async function feedback(req, res, body) {
  const { lesson } = await lessonFor(req, body?.lessonId);
  if (!["again", "not_this"].includes(body?.action)) throw bad("invalid action");
  const r = await hostFeedback({ lessonId: lesson.id, intentId: intentOf(body.intentId), action: body.action });
  if (r.error) throw new HttpError(409, r.error);
  send(res, 200, r);
}

async function frameError(req, res, body) {
  const { lesson } = await lessonFor(req, body?.lessonId);
  const reason = ["csp", "runtime", "navigated", "not_ready", "unavailable", "bytes"].includes(body?.reason) ? body.reason : "unknown";
  const r = await hostFrameError({ lessonId: lesson.id, intentId: intentOf(body.intentId), reason });
  send(res, 200, r);
}

/** The Desk's work-tray box (CSS px; numbers only). The gate's class for this lesson; unknown stays the 360 phone. */
async function viewportRoute(req, res, body) {
  const { lesson } = await lessonFor(req, body?.lessonId);
  const w = Number(body?.box?.w), h = Number(body?.box?.h);
  if (!(w >= 100 && w <= 4000 && h >= 50 && h <= 4000)) throw bad("invalid box");
  const v = noteViewport(lesson.id, { w, h }, body?.young === true);
  send(res, 200, { vp: v?.vp ?? "p360", tight: !!v?.tight });
}

/** The whiteboard's sync telemetry: how late a script reached the board relative to her line's audio (numbers only). */
async function wbTimingRoute(req, res, body) {
  await lessonFor(req, body?.lessonId);
  send(res, 200, noteWbTiming(body.lessonId, { lateMs: body?.lateMs, source: body?.source }));
}

/** One shelf card per revealed piece, newest first; no counts, no completion meter (STUDENT-FLOW §9.3, F6). */
async function madeFor(req, res) {
  const childId = query(req).get("childId");
  if (!UUID.test(String(childId ?? ""))) throw bad("invalid childId");
  await requireChild(req, childId);
  const rows = await q(
    `select m.id, m.lesson_id, m.intent_id, m.kind, m.archetype, m.skill_id, m.topic_id, m.misconception_id, m.source, m.facts, m.revealed_at, m.outcome
       from studio_mount m join lesson l on l.id = m.lesson_id
      where l.child_id = $1 and m.revealed_at is not null and not m.hidden and m.source <> 'whiteboard'
      order by m.revealed_at desc limit 20`, [childId]);
  const cards = rows.map((r) => {
    let title = r.archetype;
    try { title = archetype(r.archetype).title; } catch { /* a retired archetype keeps its id */ }
    const f = r.facts ?? {};
    return { id: String(r.id), lessonId: r.lesson_id, intentId: r.intent_id, kind: r.kind, archetype: r.archetype, title, topicId: r.topic_id, skillId: r.skill_id,
      misconceptionId: r.misconception_id, need: f.need ?? null, at: r.revealed_at, completed: !!r.outcome?.complete,
      // "Play again" mounts this (a library build or the skeleton), graded by the host like any piece
      replay: f.artifact ?? null };
  });
  send(res, 200, { cards });
}

async function hide(req, res, body) {
  if (!UUID.test(String(body?.childId ?? ""))) throw bad("invalid childId");
  await requireChild(req, body.childId);
  if (!/^\d{1,18}$/.test(String(body?.id ?? ""))) throw bad("invalid id");
  await q("update studio_mount m set hidden = true from lesson l where m.id = $1 and l.id = m.lesson_id and l.child_id = $2", [String(body.id), body.childId]);
  send(res, 200, { ok: true });
}

export const routes = {
  "GET /api/studio/stream": stream,
  "GET /api/studio/slot": slot,
  "GET /api/studio/build": build,
  "POST /api/studio/answer": answer,
  "POST /api/studio/feedback": feedback,
  "POST /api/studio/frame-error": frameError,
  "POST /api/studio/wb-timing": wbTimingRoute,
  "POST /api/studio/viewport": viewportRoute,
  "GET /api/studio/made-for": madeFor,
  "POST /api/studio/made-for/hide": hide,
};
