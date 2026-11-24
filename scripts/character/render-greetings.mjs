// Render her daily home greetings (server/face-puppet/greetings.js) once, in Diya's DragonHD voice, into
// public/audio/hello-day-<id>.mp3. Needs the Azure speech keys in .env.local (the same as the lesson's TTS); one short
// clip per line, 27 lines in all, a one-off spend of a few cents. Skips clips that already exist unless --force.
// The whole path (render → viseme sidecars → checks) is scripts/character/greetings-pipeline.mjs; this file is its render
// step, importable (renderGreetings) and runnable on its own:
//   node --env-file=.env.local scripts/character/render-greetings.mjs [--force] [--only en-m1,hi-a2]
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { GREETINGS, clipUrl } from "../../server/face-puppet/greetings.js";

const PUBLIC = fileURLToPath(new URL("../../public", import.meta.url));

/** Every greeting line: { id, lang, part, text, file } (file = the clip's path on disk). */
export function greetingLines() {
  const out = [];
  for (const [lang, parts] of Object.entries(GREETINGS)) {
    for (const [part, lines] of Object.entries(parts)) for (const [id, text] of lines) out.push({ id, lang, part, text, file: `${PUBLIC}${clipUrl(id)}` });
  }
  return out;
}

/** Render the lines whose clip is missing (or all with force). Azure is imported only when a clip is actually made. */
export async function renderGreetings({ force = false, only = null, log = console.log } = {}) {
  const todo = greetingLines().filter((l) => (!only || only.has(l.id)) && (force || !fs.existsSync(l.file)));
  if (!todo.length) return [];
  const { dhdClip } = await import("../../server/voice/azureTts.js");
  const { plainSsml } = await import("../../server/voice/expressive/compile/dhd.js");
  const { dhdVoiceFor } = await import("../../server/voice/voices.js");
  const { spokenOptsForChild } = await import("../../server/voice/spoken.js");
  const v = dhdVoiceFor("asha");
  const dv = { voice: v.dhd, baseRate: v.baseRate };
  const made = [];
  for (const l of todo) {
    const spoken = spokenOptsForChild({ language_pref: l.lang, class_level: 6 });
    const audio = await dhdClip(plainSsml(l.text, dv, spoken));
    fs.writeFileSync(l.file, audio);
    made.push(l);
    log(l.file, audio.length, "B:", l.text);
  }
  return made;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const force = process.argv.includes("--force");
  const only = process.argv.includes("--only") ? new Set(process.argv[process.argv.indexOf("--only") + 1].split(",")) : null;
  const made = await renderGreetings({ force, only });
  console.log(`${made.length} clip(s) rendered; next: scripts/character/greetings-pipeline.mjs --run (sidecars + checks)`);
}
