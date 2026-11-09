// Her once-a-day home greeting (round 7 face-home-daily-greeting; PRODUCT-DESIGN-V2 §8 child home row: "speaking (one
// greeting a day) ... greets, then idles; glances at the Start button once"; §3.3: a pre-rendered clip with NO NAME in
// it). A small fixed pool per language and part of the day, rendered once in Diya's voice with viseme sidecars
// (scripts/character/render-greetings.mjs → public/audio/hello-day-<id>.mp3 + .visemes.json), so the home costs no
// synthesis, no model and no proxy surface at runtime: the server only picks today's line for the child.
// Register: a grown-up teacher to a 9-15-year-old (OWNER-RESET #1): short, warm, no baby talk, no exclamation pile-up,
// and it points at the one action on the screen (Start). No name, no subject, no claim about the child, and no
// gendered verb about the child (Hindi past participles agree with the subject: "tum aa gaye" assumes a boy).
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const GREETING_TZ = "Asia/Kolkata";
export const PARTS = ["morning", "afternoon", "evening"];

/** id → line. Ids are stable (the clip file names); add a line with a new id, never reuse one. */
export const GREETINGS = Object.freeze({
  english: {
    morning: [["en-m1", "Good morning. Ready when you are, just press Start."], ["en-m2", "Morning! Let's pick up where we left off."], ["en-m3", "Good morning. I've got something good for today."]],
    afternoon: [["en-a1", "Hi again. Shall we get going?"], ["en-a2", "Good afternoon. Press Start and we'll begin."], ["en-a3", "Hello! I was hoping you'd come by."]],
    evening: [["en-e1", "Good evening. A short one today?"], ["en-e2", "Evening! Let's make this one count."], ["en-e3", "Hi. Whenever you're ready, press Start."]],
  },
  hindi: {
    morning: [["hi-m1", "सुप्रभात। तैयार हो तो स्टार्ट दबाओ।"], ["hi-m2", "नमस्ते! चलो, वहीं से शुरू करते हैं जहाँ रुके थे।"], ["hi-m3", "सुप्रभात। आज के लिए कुछ अच्छा सोचा है।"]],
    afternoon: [["hi-a1", "फिर से नमस्ते। शुरू करें?"], ["hi-a2", "नमस्ते। स्टार्ट दबाओ, फिर शुरू करते हैं।"], ["hi-a3", "तुम्हें देखकर अच्छा लगा।"]],
    evening: [["hi-e1", "शुभ संध्या। आज थोड़ा सा पढ़ें?"], ["hi-e2", "नमस्ते! चलो, आज का सबक अच्छा बनाते हैं।"], ["hi-e3", "जब तैयार हो, स्टार्ट दबा देना।"]],
  },
  hinglish: {
    morning: [["hg-m1", "Good morning! Ready ho toh Start dabao."], ["hg-m2", "Namaste! Chalo, wahin se shuru karte hain jahan ruke the."], ["hg-m3", "Good morning. Aaj ke liye kuch accha socha hai."]],
    afternoon: [["hg-a1", "Phir se hi! Shuru karein?"], ["hg-a2", "Namaste. Start dabao, phir shuru karte hain."], ["hg-a3", "Tumhe dekh ke accha laga."]],
    evening: [["hg-e1", "Good evening. Aaj ek chhota sa lesson?"], ["hg-e2", "Namaste! Chalo, aaj ka lesson accha banate hain."], ["hg-e3", "Jab ready ho, Start daba dena."]],
  },
});

const LANGS = Object.keys(GREETINGS);
export const langOf = (pref) => (LANGS.includes(pref) ? pref : "hinglish");

/** The local date and hour in the child's zone (India for now). */
export function localDay(now = new Date(), tz = GREETING_TZ) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
export const partOf = (hour) => (hour >= 4 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : "evening");

/** FNV-1a 32 (stable across processes, no crypto needed: this picks a line, it protects nothing). */
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Where a rendered clip can be on this machine. The production image holds the built client only (Dockerfile: dist/ is
 *  copied, public/ is not), so the served copy is dist/audio (TAXILA_DIST when the server serves another build:
 *  server/serve.mjs); a checkout running the API beside Vite has public/audio. Audit FACE-02: only public/ was checked,
 *  so in production no clip could ever be found and her greeting stayed silent whatever was rendered. */
export const clipDirs = (env = process.env) => [
  env.TAXILA_DIST ? `${resolve(env.TAXILA_DIST)}/` : fileURLToPath(new URL("../../dist/", import.meta.url)),
  fileURLToPath(new URL("../../public/", import.meta.url)),
];
export const clipUrl = (id) => `/audio/hello-day-${id}.mp3`;
/** Whether the line's clip has been rendered (the client then lip-syncs it; otherwise it shows the line, silently). */
export const clipExists = (id, exists = existsSync, dirs = clipDirs()) => dirs.some((d) => exists(`${d}audio/hello-day-${id}.mp3`));

/**
 * Today's greeting for a child: one line per child per local day (stable all day, different across children and days),
 * from the pool of the child's language and the part of the day. Pure but for the clock and the file check.
 * @returns {{ day: string, part: string, lang: string, id: string, text: string, clip: string | null, glance: "start" }}
 */
export function greetingFor(child, { now = new Date(), exists = existsSync } = {}) {
  const lang = langOf(child?.language_pref);
  const { day, hour } = localDay(now);
  const part = partOf(hour);
  const pool = GREETINGS[lang][part];
  const [id, text] = pool[hash(`${child?.id ?? ""}|${day}`) % pool.length];
  return { day, part, lang, id, text, clip: clipExists(id, exists) ? clipUrl(id) : null, glance: "start" };
}
