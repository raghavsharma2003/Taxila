// One whole lesson through the REAL server (evals/simlab/serve.mjs → server/serve.mjs on the Neon TEST branch):
// a fresh @taxila.test guardian and child, POST /api/lesson/start in cascade mode (the phone's lane), child turns sent
// the way the client sends them (spoken: childText + asrConfidence, typed:false; tapped: chipId + typed:true; pad:
// typed:true), every teacher line, ui, module command, studio change and the server's debug reasons recorded, then
// /api/lesson/end and the account deleted in a finally.
//
// Lanes: "text" sends the child's words as a perfect transcript. "voice" speaks them with Azure TTS and sends the real
// transcriber's output (voice.mjs) — the words the server sees are the ASR's, the card's words are kept beside them.
import { childTurn } from "./child.mjs";

const STEP = { not: 0, partly: 1, understood: 2 };
const NAME = ["not", "partly", "understood"];

function apiClient(base) {
  let cookie = "";
  return async function api(method, path, body, expect = [200, 201]) {
    const t = performance.now();
    let res, lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
          body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
        break;
      } catch (e) { lastErr = e; }
    }
    if (!res) throw Object.assign(new Error(`${method} ${path} → network ${lastErr?.message}`), { status: 0 });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const j = await res.json().catch(() => ({}));
    const ms = Math.round(performance.now() - t);
    if (!expect.includes(res.status)) throw Object.assign(new Error(`${method} ${path} → ${res.status} ${JSON.stringify(j).slice(0, 300)}`), { status: res.status, body: j });
    return { ...j, _ms: ms, _status: res.status };
  };
}

let sql = null;
async function boardPages(lessonId) {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(process.env.SIMLAB_DB_HOST || "ep-winter-tooth")) return null; // never anything but the TEST branch
  if (!sql) { const { neon } = await import("@neondatabase/serverless"); sql = neon(url); }
  const exists = await sql.query("select to_regclass('public.board_page') is not null as ok");
  if (!exists[0]?.ok) return null;
  const rows = await sql.query("select seq, intent_id, beat, skill_id, script, created_at from board_page where lesson_id = $1 order by seq", [lessonId]);
  return rows.map((r) => ({ seq: r.seq, intentId: r.intent_id, beat: r.beat, skillId: r.skill_id, at: new Date(r.created_at).toISOString(), board: boardText(r.script) }));
}

async function lessonLane(lessonId) {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(process.env.SIMLAB_DB_HOST || "ep-winter-tooth")) return null;
  if (!sql) { const { neon } = await import("@neondatabase/serverless"); sql = neon(url); }
  const rows = await sql.query("select state->'ctx'->>'teacher' as teacher, state->'agent' as agent from lesson where id = $1", [lessonId]);
  return rows[0] ? { teacher: rows[0].teacher ?? "director", agent: rows[0].agent ?? null } : null;
}

/** A whiteboard as a child would describe it: its shapes and the words written on it (never the raw script). */
function boardText(script) {
  const ops = script?.ops ?? [];
  const texts = ops.filter((o) => o.text).map((o) => o.text);
  const shapes = Object.entries(ops.filter((o) => !o.text).reduce((m, o) => ((m[o.op] = (m[o.op] ?? 0) + 1), m), {})).map(([k, v]) => `${v} ${k}`);
  return `${script?.card?.kind ? `(${script.card.kind} card) ` : ""}drawing with ${shapes.join(", ") || "no shapes"}; written: ${texts.map((t) => `"${t}"`).join(" ") || "nothing"}`.slice(0, 400);
}

/** The screen as the child sees it after a response (carried across turns: an activity stays until unmounted). */
function nextScreen(prev, r) {
  const ui = r.ui ?? {};
  const s = { ...prev, chips: ui.chips ?? [], ask: ui.ask?.text ?? null, pad: ui.tray === "pad" || ui.answerForm === "number" && ui.tray === "pad" };
  s.whiteboard = ui.whiteboard ? `${ui.whiteboard.kind}: ${String(ui.whiteboard.value).slice(0, 200)}` : null;
  for (const c of r.moduleCommands ?? []) {
    if (c.op === "mount") s.module = `${c.engine}${c.goal ? ` — ${c.goal}` : ""}`;
    if (c.op === "unmount") s.module = null;
  }
  if (ui.tray === "none") s.module = null;
  const slot = ui.studioSlot;
  if (slot) {
    const a = slot.artifact;
    s.studio = a ? `${slot.state}: ${a.kind}${a.kind === "whiteboard" ? ` ${boardText(a.script)}` : a.kind === "image" ? ` ${a.alt ?? a.caption ?? ""}` : a.studioKind ? ` ${a.studioKind}` : ""}` : `${slot.state} (nothing drawn yet)`;
  } else if (ui.tray && ui.tray !== "studio") s.studio = null;
  s.tray = ui.tray ?? null;
  s.answerForm = ui.answerForm ?? null;
  return s;
}

/** The server's reasons for a turn, from its debug payload (loopback only). The item's answer key is dropped. */
function reasonsOf(r) {
  const d = r.debug;
  if (!d) return null;
  const pickItem = d.item ? { id: d.item.id, skillId: d.item.skillId, kind: d.item.kind } : null;
  return {
    phase: d.phase, turn: d.turn, hintLevel: d.hintLevel, unclear: d.unclear, verdict: d.verdict,
    classification: d.classification ? { outcome: d.classification.outcome, confidence: d.classification.confidence, flags: Object.entries(d.classification.flags ?? {}).filter(([, v]) => v).map(([k, v]) => (v === true ? k : `${k}:${v}`)) , misconceptionId: d.classification.misconceptionId ?? null } : null,
    item: pickItem, probe: d.probe ?? null, kt: d.kt ?? [], skills: d.skills ?? {}, flagged: d.flagged ?? {},
    guard: d.guard ?? null, note: d.note ? { nonAnswer: d.note.nonAnswer, intent: d.note.intent } : null,
    ...(d.agent ? { agent: d.agent } : {}), ...(d.tools ? { tools: d.tools } : {}), ...(d.lane ? { lane: d.lane } : {}),
  };
}

/**
 * Run one persona's lesson. Never throws: a failure is recorded on the result.
 * @param {object} p persona card
 * @param {{ base: string, lane: "text"|"voice", maxTurns: number, voice?: object, tag?: string }} opts
 */
export async function runLesson(p, { base, lane = "text", maxTurns = 14, voice = null, tag = "simlab" }) {
  const api = apiClient(base);
  const st = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
  const email = `${tag}+${p.id}-${st}${rnd}@taxila.test`, password = `sim-pw-${st}-${rnd}`;
  const rec = { persona: p.id, lane, startedAt: new Date().toISOString(), turns: [], errors: [], state: Object.fromEntries(p.skills.map((s) => [s.id, s.state])),
    misconceptionsHeld: p.misconceptions.map((m) => m.id), learning: [], end: null, start: null };
  let signedUp = false;
  try {
    await api("POST", "/api/auth/signup", { email, password, name: "Sim Lab", isGuardianAdult: true });
    signedUp = true;
    const { child } = await api("POST", "/api/children", { firstName: p.name, classLevel: p.classLevel, board: p.board,
      schoolMedium: p.lang === "hindi" ? "hindi" : "english", languagePref: p.lang, interests: p.interests });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 }).catch((e) => rec.errors.push({ at: "controls", msg: e.message }));
    const s = await api("POST", "/api/lesson/start", { childId: child.id, topicId: p.topicId, mode: "cascade" });
    rec.start = { ms: s._ms, topic: s.topic, teacher: s.teacher?.name, address: s.address ?? null };
    let screen = nextScreen({}, s);
    const heard = [];
    if (s.teacherOpening) heard.push({ who: "teacher", text: s.teacherOpening });
    rec.turns.push({ n: 0, teacher: s.teacherOpening ?? "", ui: s.ui, moduleCommands: s.moduleCommands ?? [], screen, move: s.debug?.move?.kind ?? null, reasons: s.debug ? { move: s.debug.move } : null, ms: s._ms });
    let fails = 0;
    for (let n = 1; n <= maxTurns; n++) {
      const cur = Object.entries(rec.state).map(([k, v]) => `${k}=${v}`).join(", ") + (rec.misconceptionsHeld.length ? `; still holds ${rec.misconceptionsHeld.join(", ")}` : "; holds no misconception now");
      let c;
      try { c = await childTurn(p, heard, screen, n, cur); } catch (e) { rec.errors.push({ at: `child ${n}`, msg: String(e.message).slice(0, 200) }); break; }
      // the card's learning: one step per logged event, never two
      for (const l of c.learned) {
        const from = STEP[rec.state[l.skillId]], to = Math.min(STEP[l.to], from + 1);
        if (to > from) { rec.state[l.skillId] = NAME[to]; rec.learning.push({ turn: n, skillId: l.skillId, to: NAME[to], why: l.why }); }
      }
      for (const d of c.dropped) if (rec.misconceptionsHeld.includes(d.misconceptionId)) { rec.misconceptionsHeld = rec.misconceptionsHeld.filter((x) => x !== d.misconceptionId); rec.learning.push({ turn: n, dropped: d.misconceptionId, why: d.why }); }
      const body = { lessonId: s.lessonId, turnSeq: n };
      let asr = null;
      if (c.action === "tap") Object.assign(body, { childText: c.chipLabel, chipId: c.chipId, typed: true });
      else if (c.action === "pad") Object.assign(body, { childText: c.say, typed: true });
      else if (lane === "voice" && voice) {
        asr = await voice.hear(c.say, p).catch((e) => ({ text: "", confidence: 0, error: String(e.message).slice(0, 160) }));
        Object.assign(body, { childText: asr.text, asrConfidence: asr.confidence, typed: false });
      } else Object.assign(body, { childText: c.say, asrConfidence: 0.92, typed: false });
      heard.push({ who: "child", text: c.chipLabel ?? c.say, tapped: c.action === "tap" });
      let r;
      try { r = await api("POST", "/api/lesson/turn", body, [200]); fails = 0; } catch (e) {
        rec.errors.push({ at: `turn ${n}`, status: e.status ?? 0, msg: String(e.message).slice(0, 300) });
        rec.turns.push({ n, child: { ...c, sent: body.childText, asr }, error: String(e.message).slice(0, 300) });
        if (++fails >= 2) break;
        continue;
      }
      screen = nextScreen(screen, r);
      const teacher = r.teacherReply ?? "";
      if (teacher) heard.push({ who: "teacher", text: teacher });
      rec.turns.push({ n, at: new Date().toISOString(), child: { action: c.action, say: c.say, chipId: c.chipId, chipLabel: c.chipLabel, private: c.private, sent: body.childText, ...(asr ? { asr } : {}) },
        teacher, move: r.move?.kind ?? null, ui: r.ui, moduleCommands: r.moduleCommands ?? [], studio: r.studio ?? null, screen, end: !!r.end,
        speakNow: r.speakNow ?? null, reasons: reasonsOf(r), ms: r._ms });
      if (r.end) break;
    }
    // the server's own record of every board page shown (stream 2's board_page): read now, before the account (and the
    // lesson's rows, on delete cascade) is erased. TEST branch only; absent table → none.
    rec.boardPages = await boardPages(s.lessonId).catch((err) => { rec.errors.push({ at: "board_page", msg: String(err.message).slice(0, 160) }); return null; });
    // the lane the lesson ran on and the agent's own counters (round 5: state.ctx.teacher, state.agent.fallbacks/usage/lastMs)
    rec.lane2 = await lessonLane(s.lessonId).catch((err) => { rec.errors.push({ at: "lesson_state", msg: String(err.message).slice(0, 160) }); return null; });
    const e = await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch((err) => { rec.errors.push({ at: "end", msg: err.message }); return null; });
    if (e) rec.end = { summary: e.summary, parentNote: e.parentNote, did: e.did, facts: e.debug?.facts ?? null };
  } catch (e) {
    rec.errors.push({ at: "setup", status: e.status ?? 0, msg: String(e.message).slice(0, 300) });
  } finally {
    if (signedUp) await api("DELETE", "/api/account", { password, confirm: true }).catch((e) => rec.errors.push({ at: "cleanup", msg: `account ${email} not deleted: ${e.message}` }));
  }
  rec.finishedAt = new Date().toISOString();
  return rec;
}
