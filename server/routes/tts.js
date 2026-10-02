// POST /api/tts { text, voice? } → audio/mpeg. The text-mode teacher's voice (src/lesson/textLink.ts):
// the Director writes the reply, this speaks it. Guardian session required (a child acts inside one), so
// the endpoint is never an open speech proxy. The text is a child-facing reply and is not logged.
import { requireGuardian } from "../auth.js";
import { AzureError, tts } from "../azure.js";
import { bad, HttpError } from "../http.js";

/** Teacher replies are a few sentences; anything longer is a bug upstream, not a reply. */
export const MAX_TTS_CHARS = 1200;
// gpt-4o-mini-tts voices. Teacher voices are realtime voice names, which are a subset of these.
const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);
export const DEFAULT_VOICE = "marin";

export async function speak(req, res, body) {
  await requireGuardian(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) throw bad("missing field: text");
  if (text.length > MAX_TTS_CHARS) throw bad(`text is longer than ${MAX_TTS_CHARS} characters`);
  const voice = VOICES.has(body.voice) ? body.voice : DEFAULT_VOICE;
  let audio;
  try {
    // No delivery `instructions`: the teacher's voice is chosen by blind ear, not by an unmeasured prompt.
    audio = await tts(text, voice);
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
