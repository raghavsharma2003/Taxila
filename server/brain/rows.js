// Turn rows and lane helpers shared by the lesson routes and the Brain's turn (W2-E BR1: moved out of
// server/routes/lesson.js unchanged). Pure statement builders apart from kitFor (a pinned-kit read) and runTurnTx (the
// turn's one transaction).
import { tx } from "../db.js";
import { HttpError } from "../http.js";
import { getKit, pinnedKit } from "../content/index.js";
import { lockStmt, modeGuardStmt } from "../learner/writer.js";
import { askFromReply } from "../director/say.js";

/**
 * Debug payloads carry answer keys, so they go only to a loopback caller on a dev machine (never on a
 * hosted platform, where the ingress proxy is the caller), or when TAXILA_DEBUG=1 is set explicitly.
 */
const HOSTED = !!(process.env.VERCEL || process.env.CONTAINER_APP_NAME);
export const debugFor = (req) => process.env.TAXILA_DEBUG === "1"
  || (!HOSTED && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket?.remoteAddress));
export const RECENT_TURNS = 8;

/**
 * The exact kit a lesson started on (state.kitHash, content/index.js pinnedKit): kit files are rewritten
 * while lessons run, and a lesson's item ids mean nothing in any other version. Never generated mid-lesson;
 * unavailable is a 503, not a crash. A lesson stored before pinning existed reads the current kit.
 */
export async function kitFor(topicId, state) {
  const kit = state?.kitHash ? await pinnedKit(topicId, state.kitHash) : await getKit(topicId, { generate: false });
  if (!kit) throw new HttpError(503, "no teaching content is available for this topic yet");
  return kit;
}

/**
 * Give turn rows their seq (from the lesson state) and remember the last few for text-mode context. Pure:
 * the rows are written by the turn's single transaction (turnInsertStmt).
 */
export function stageTurns(state, rows) {
  return rows.map((r) => {
    state.seq += 1;
    if (r.speaker !== "system") state.recent = [...state.recent, { who: r.speaker, text: r.text.slice(0, 400) }].slice(-RECENT_TURNS);
    return { ...r, seq: state.seq };
  });
}

/** One insert for staged turn rows; (lesson_id, seq) is unique, so a replayed turn cannot write twice. */
export function turnInsertStmt(lessonId, rows) {
  const params = [];
  const values = rows.map((r, i) => {
    params.push(lessonId, r.seq, r.speaker, r.text, r.asrConf ?? null, r.meta ?? {});
    const b = i * 6;
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
  });
  return { text: `insert into turn(lesson_id, seq, speaker, text, asr_conf, meta) values ${values.join(",")} returning seq`, params };
}

/** A safeguarding incident row. turnSeq: the child turn it came from (same transaction), or null. */
export function incidentStmt(childId, lessonId, turnSeq, detail) {
  return {
    text: `insert into incident(child_id, lesson_id, kind, severity, detail)
           values ($1, $2, 'safeguarding', 'high', jsonb_build_object('turnId', (select id from turn where lesson_id = $2 and seq = $3)) || $4::jsonb) returning id`,
    params: [childId, lessonId, turnSeq, detail],
  };
}

/**
 * The floor families whose break on a teacher turn that REACHED the child (the voice lane's transcript, the cascade's
 * spoken reply) also leaves an incident row: a denied AI identity, a wrong or missing helpline, romance, exclusivity.
 * The row carries the family names only — never the words (they are on the turn row, for review).
 */
export const FLOOR_INCIDENT_FAMILIES = Object.freeze(["ai_denial", "helpline", "romance", "exclusivity"]);
export function floorIncidentStmt(childId, lessonId, turnSeq, families, lane) {
  const serious = families.filter((f) => FLOOR_INCIDENT_FAMILIES.includes(f));
  if (!serious.length) return null;
  return {
    text: `insert into incident(child_id, lesson_id, kind, severity, detail)
           values ($1, $2, 'floor_violation', 'high', jsonb_build_object('turnId', (select id from turn where lesson_id = $2 and seq = $3)) || $4::jsonb) returning id`,
    params: [childId, lessonId, turnSeq, { source: "teacher_transcript", lane, families: serious }],
  };
}

/** W2 seam: the relational directive's face display rides the ui (UiDirectives.teacherAffect); none = the ui unchanged. */
export function withSeamUi(ui, relational, { safety = false } = {}) {
  // TA8 (relational/affect.js): a safeguarding turn is calm_steady on the face, whatever the relational directive said.
  // Structural, not left to the directive: the directive is decided once per turn BEFORE a content-filter re-plan can
  // turn the move into a safeguard (ship5 review B1: the puppet kept its warm smile over the helplines).
  if (safety) return { ...ui, teacherAffect: { display: "calm_steady", intensity: 1 } };
  const affect = relational?.ui?.teacherAffect;
  return affect ? { ...ui, teacherAffect: { display: affect.display, intensity: affect.intensity } } : ui;
}

/** W2-E: the Studio slot the whiteboard ask opened this turn (UiDirectives.studioSlot; the tray shows the StudioStage). */
export function withStudioSlot(ui, slot) {
  return slot ? { ...ui, tray: "studio", studioSlot: slot } : ui;
}

/**
 * The response's UiDirectives: the Director's, plus — on a text-lane turn with no kit item on the table — the question
 * the teacher actually handed back, for the Question card (G-ASK-1; parity with the words by construction).
 */
export function withAsk(ui, reply, extra = {}) {
  const out = { ...ui, ...extra };
  if (!out.ask && reply && ["answer", "choice"].includes(out.handover)) {
    const text = askFromReply(reply);
    if (text) out.ask = { text };
  }
  return out;
}

/**
 * The compiled instructions carry the answer key ("key, for checking only"), so they reach the client only
 * where the client must apply them: the voice lane, whose session.update goes over the browser's data
 * channel. The text lane's reply is generated here, so its client never receives them.
 * Accepted risk until a server sideband owns session.update: context/inbox/ws1-client.json
 * (voice-instructions-client-visible).
 */
export const clientInstructions = (mode, instructions) => (laneOf(mode) === "voice" ? { instructions } : {});
/**
 * The lesson's lane. "cascade" (the default voice lane: STT → Director → streamed TTS) is a text lane to the
 * server — the Director writes and stores every reply — but its child turns are SPOKEN: they carry an ASR
 * confidence that is stored and gates classify, exactly as on the realtime lane. Only "text" means typed.
 */
export const LANES = new Set(["voice", "text", "cascade"]);
export const laneOf = (mode) => (LANES.has(mode) ? mode : "voice");

/**
 * A turn's lane rules from the lesson's mode: who writes the reply (text lanes: the Director, here), and
 * whether the child's words came without ASR (typed). `body.typed` marks a typed or tapped turn on any lane.
 * Exported for tests.
 */
export function turnLane(mode, body) {
  const lane = laneOf(mode);
  return { lane, textLane: lane !== "voice", typed: !!body.typed || lane === "text" };
}

/** The stored child row: a spoken turn keeps its ASR confidence (asr_conf), a typed one has none. Exported for tests. */
export function childTurnRow({ childText, chipId, asrConfidence, typed, extra = {} }) {
  return {
    speaker: "child", text: childText || (chipId ? `[tap ${chipId}]` : "[no speech]"),
    asrConf: typed ? null : (typeof asrConfidence === "number" ? asrConfidence : null),
    meta: { typed, ...(chipId ? { chipId } : {}), ...extra },
  };
}

/**
 * Run the turn's statements: the child's advisory lock and the legal-mode guard go FIRST whenever a learner layer
 * is written (the writer's contract, writer.commit; the M0 ratchet takes the same lock), then the given order.
 * Returns the seq each staged kt_evidence insert got, in staging order.
 */
export async function runTurnTx(child, stmts) {
  const learner = stmts.some((x) => x.layer && x.layer !== "session");
  const all = learner ? [lockStmt(child.id), modeGuardStmt(child.id, child.legal_mode), ...stmts] : stmts;
  const out = await tx(all.map(({ ktEvidence: _k, rows: _r, layer: _l, ...x }) => x));
  const res = learner ? out.slice(2) : out;
  const seqs = stmts.map((x, i) => (x.ktEvidence ? res[i]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
  return { res, seqs };
}
