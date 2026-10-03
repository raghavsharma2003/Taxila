// POST /api/tts { lessonId, seq } → audio/mpeg. The text-mode teacher's voice (src/lesson/textLink.ts): the
// Director writes each reply and stores it as a teacher turn; this speaks THAT turn, in the lesson teacher's
// voice. It takes no text and no voice from the client, so it is not a speech proxy on the Azure grant
// (signup is open): the caller must be the guardian of the lesson's child, can only have lines the
// Director wrote for that lesson spoken, and is rate-limited. The text is child-facing and is not logged.
import { one } from "../db.js";
import { requireChild } from "../auth.js";
import { AzureError, tts } from "../azure.js";
import { bad, need, notFound, HttpError } from "../http.js";
import { teacherForLesson } from "../compiler/characters/index.js";
import { toSpoken, spokenOptsForChild } from "../voice/spoken.js";

/** Teacher replies are a few sentences; anything longer is a bug upstream, not a reply. */
export const MAX_TTS_CHARS = 1200;
/** Per guardian per process: a text lesson speaks about one line per turn; this is several times a fast child's pace. */
export const TTS_PER_MINUTE = 20;
// gpt-4o-mini-tts voices. Teacher voices are realtime voice names, which are a subset of these.
const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);
export const DEFAULT_VOICE = "marin";

const WINDOW_MS = 60_000;
const recent = new Map(); // guardian id → request times (ms) in the last window

/** Sliding-window limiter. In memory, so per replica: a bound on cost, not an exact quota. */
export function allowSpeech(guardianId, now = Date.now()) {
  if (recent.size > 5000) for (const [id, ts] of recent) if (ts.at(-1) <= now - WINDOW_MS) recent.delete(id);
  const ts = (recent.get(guardianId) ?? []).filter((t) => t > now - WINDOW_MS);
  const ok = ts.length < TTS_PER_MINUTE;
  if (ok) ts.push(now);
  recent.set(guardianId, ts);
  return ok;
}

/** @type {(req: any, res: any, body: import("../../shared/contracts").TtsRequest) => Promise<void>} */
export async function speak(req, res, body) {
  const { lessonId, seq } = need(body, "lessonId", "seq");
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  if (!Number.isInteger(seq) || seq < 1) throw bad("invalid seq");
  const lesson = await one("select child_id, state->'ctx'->>'teacherId' as teacher_id from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  const { guardian, child } = await requireChild(req, lesson.child_id);
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  const turn = await one("select text from turn where lesson_id = $1 and seq = $2 and speaker = 'teacher'", [lessonId, seq]);
  const text = turn?.text?.trim();
  if (!text) throw notFound("no teacher turn to speak");
  if (text.length > MAX_TTS_CHARS) throw bad(`teacher turn is longer than ${MAX_TTS_CHARS} characters`);
  // The lesson's own teacher (pinned at start), never the child's CURRENT pick: a switch between turns of an
  // open lesson must not change the voice under the same persona and face.
  const { voice } = teacherForLesson(child, lesson.teacher_id);
  let audio;
  try {
    // No delivery `instructions`: the teacher's voice is chosen by blind ear, not by an unmeasured prompt.
    // The voice gets the SPOKEN form (numerals, notation, helplines digit by digit: server/voice/spoken.js);
    // the stored turn and the caption keep the written text.
    const said = process.env.TAXILA_TTS_SPOKEN === "0" ? text : toSpoken(text, spokenOptsForChild(child));
    audio = await tts(said, VOICES.has(voice) ? voice : DEFAULT_VOICE);
  } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
    throw e;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "audio/mpeg");
  res.setHeader("content-length", String(audio.length));
  res.setHeader("cache-control", "no-store");
  res.end(audio);
}

export const routes = { "POST /api/tts": speak };
